-- KULONGA — endurecimento P0 de autorização por papel e turma
-- Professor: vê as turmas/disciplinas atribuídas e edita notas, trabalhos
-- e assiduidade dessas turmas. Secretaria mantém gestão administrativa.
-- Executar no Supabase SQL Editor como administrador.

BEGIN;

ALTER TABLE public.professores
  ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'professor';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'professores_papel_check'
  ) THEN
    ALTER TABLE public.professores
      ADD CONSTRAINT professores_papel_check
      CHECK (papel IN ('secretaria', 'professor'));
  END IF;
END $$;

-- Migração inicial: conserva as contas de secretaria já criadas pelo fluxo actual.
-- Depois desta migração, o papel persistente e as policies deixam de depender
-- de user_metadata enviado pelo cliente.
UPDATE public.professores p
SET papel = 'secretaria'
FROM auth.users u
WHERE u.id = p.user_id
  AND (
    u.raw_user_meta_data ->> 'papel' = 'secretaria'
    OR (u.raw_user_meta_data -> 'papeis') ? 'secretaria'
  );

CREATE OR REPLACE FUNCTION public.escolas_do_staff()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM public.professores
  WHERE user_id = auth.uid()
    AND activo = true
    AND papel = 'secretaria';
$$;

CREATE OR REPLACE FUNCTION public.escolas_do_utilizador()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM public.professores
  WHERE user_id = auth.uid() AND activo = true;
$$;

CREATE OR REPLACE FUNCTION public.turmas_do_professor()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT dp.turma_id), ARRAY[]::uuid[])
  FROM public.disciplina_professor dp
  JOIN public.professores p ON p.id = dp.professor_id
  WHERE p.user_id = auth.uid() AND p.activo = true AND p.papel = 'professor';
$$;

CREATE OR REPLACE FUNCTION public.professor_atribuido(
  p_turma_id uuid,
  p_disciplina_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.disciplina_professor dp
    JOIN public.professores p ON p.id = dp.professor_id
    WHERE p.user_id = auth.uid()
      AND p.activo = true
      AND p.papel = 'professor'
      AND dp.turma_id = p_turma_id
      AND (p_disciplina_id IS NULL OR dp.disciplina_id = p_disciplina_id)
  );
$$;

REVOKE ALL ON FUNCTION public.escolas_do_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.turmas_do_professor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.professor_atribuido(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escolas_do_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.turmas_do_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.professor_atribuido(uuid, uuid) TO authenticated;

-- As novas escolas começam com um utilizador de secretaria.
CREATE OR REPLACE FUNCTION public.registar_escola(
  p_nome text, p_provincia text, p_municipio text, p_endereco text,
  p_telefone text, p_email text, p_direccao_nome text, p_direccao_telefone text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_escola uuid; v_user uuid := auth.uid(); v_ano text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  IF EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'O utilizador já está associado a uma escola';
  END IF;
  v_ano := CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '/' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::text END;
  INSERT INTO public.escolas(nome, provincia, municipio, endereco, telefone, email, ano_lectivo, direccao_nome, direccao_telefone)
  VALUES (trim(p_nome), trim(p_provincia), nullif(trim(p_municipio), ''), nullif(trim(p_endereco), ''), nullif(trim(p_telefone), ''), lower(trim(p_email)), v_ano, trim(p_direccao_nome), nullif(trim(p_direccao_telefone), ''))
  RETURNING id INTO v_escola;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
  VALUES (v_user, v_escola, trim(p_direccao_nome), lower(trim(p_email)), nullif(trim(p_direccao_telefone), ''), NULL, true, 'secretaria');
  RETURN v_escola;
END;
$$;

CREATE OR REPLACE FUNCTION public.registar_professor(
  p_escola_id uuid, p_nome text, p_email text, p_telefone text, p_disciplinas text[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = p_escola_id
      AND activo = true AND papel = 'secretaria'
  ) THEN
    RAISE EXCEPTION 'Apenas a secretaria da escola pode registar professores';
  END IF;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
  VALUES (NULL, p_escola_id, trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), p_disciplinas, true, 'professor')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_escola(text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registar_professor(uuid,text,text,text,text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_escola(text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registar_professor(uuid,text,text,text,text[]) TO authenticated;

-- Professores: apenas a secretaria gere o cadastro completo.
DROP POLICY IF EXISTS professores_proprio_select ON public.professores;
DROP POLICY IF EXISTS professores_secretaria_all ON public.professores;
DROP POLICY IF EXISTS professores_ver_propria_linha ON public.professores;
DROP POLICY IF EXISTS professores_staff ON public.professores;
CREATE POLICY professores_proprio_select ON public.professores
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY professores_secretaria_all ON public.professores
  FOR ALL
  USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

-- Alunos: professores só vêem alunos das turmas atribuídas.
DROP POLICY IF EXISTS alunos_select_autorizado ON public.alunos;
DROP POLICY IF EXISTS alunos_secretaria_all ON public.alunos;
DROP POLICY IF EXISTS alunos_staff ON public.alunos;
CREATE POLICY alunos_select_autorizado ON public.alunos
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id = ANY(public.alunos_do_encarregado())
    OR user_id = auth.uid()
    OR id IN (
      SELECT ta.aluno_id FROM public.turma_alunos ta
      WHERE ta.turma_id = ANY(public.turmas_do_professor())
    )
  );
CREATE POLICY alunos_secretaria_all ON public.alunos
  FOR ALL
  USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

-- Estrutura académica: professores consultam apenas atribuições; secretaria gere.
DROP POLICY IF EXISTS turmas_select_autorizado ON public.turmas;
DROP POLICY IF EXISTS turmas_secretaria_all ON public.turmas;
DROP POLICY IF EXISTS turmas_staff ON public.turmas;
CREATE POLICY turmas_select_autorizado ON public.turmas
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id = ANY(public.turmas_do_professor())
  );
CREATE POLICY turmas_secretaria_all ON public.turmas
  FOR ALL USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS disciplinas_select_autorizado ON public.disciplinas;
DROP POLICY IF EXISTS disciplinas_secretaria_all ON public.disciplinas;
DROP POLICY IF EXISTS disciplinas_staff ON public.disciplinas;
CREATE POLICY disciplinas_select_autorizado ON public.disciplinas
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id IN (
      SELECT dp.disciplina_id FROM public.disciplina_professor dp
      JOIN public.professores p ON p.id = dp.professor_id
      WHERE p.user_id = auth.uid() AND p.activo = true
    )
  );
CREATE POLICY disciplinas_secretaria_all ON public.disciplinas
  FOR ALL USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS turma_alunos_select_autorizado ON public.turma_alunos;
DROP POLICY IF EXISTS turma_alunos_secretaria_all ON public.turma_alunos;
DROP POLICY IF EXISTS turma_alunos_staff ON public.turma_alunos;
CREATE POLICY turma_alunos_select_autorizado ON public.turma_alunos
  FOR SELECT USING (
    turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
    OR turma_id = ANY(public.turmas_do_professor())
    OR aluno_id = ANY(public.alunos_do_encarregado())
    OR aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );
CREATE POLICY turma_alunos_secretaria_all ON public.turma_alunos
  FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS turma_disciplinas_select_autorizado ON public.turma_disciplinas;
DROP POLICY IF EXISTS turma_disciplinas_secretaria_all ON public.turma_disciplinas;
DROP POLICY IF EXISTS turma_disciplinas_staff ON public.turma_disciplinas;
CREATE POLICY turma_disciplinas_select_autorizado ON public.turma_disciplinas
  FOR SELECT USING (turma_id = ANY(public.turmas_do_professor()) OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
CREATE POLICY turma_disciplinas_secretaria_all ON public.turma_disciplinas
  FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS disciplina_professor_select_autorizado ON public.disciplina_professor;
DROP POLICY IF EXISTS disciplina_professor_secretaria_all ON public.disciplina_professor;
DROP POLICY IF EXISTS disciplina_professor_staff ON public.disciplina_professor;
CREATE POLICY disciplina_professor_select_autorizado ON public.disciplina_professor
  FOR SELECT USING (
    professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid())
    OR disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff()))
  );
CREATE POLICY disciplina_professor_secretaria_all ON public.disciplina_professor
  FOR ALL USING (disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff())));

-- Notas: professor apenas na turma/disciplina atribuída; secretaria mantém acesso escolar.
DROP POLICY IF EXISTS notas_staff ON public.notas;
DROP POLICY IF EXISTS notas_inserir ON public.notas;
DROP POLICY IF EXISTS notas_actualizar ON public.notas;
DROP POLICY IF EXISTS notas_select_autorizado ON public.notas;
DROP POLICY IF EXISTS notas_insert_autorizado ON public.notas;
DROP POLICY IF EXISTS notas_update_autorizado ON public.notas;
CREATE POLICY notas_select_autorizado ON public.notas
  FOR SELECT USING (
    turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
    OR public.professor_atribuido(turma_id, disciplina_id)
    OR aluno_id = ANY(public.alunos_do_encarregado())
    OR aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );
CREATE POLICY notas_insert_autorizado ON public.notas
  FOR INSERT WITH CHECK (
    (
      autor_id = auth.uid()
      AND public.professor_atribuido(turma_id, disciplina_id)
    )
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  );
CREATE POLICY notas_update_autorizado ON public.notas
  FOR UPDATE
  USING (
    (autor_id = auth.uid() AND public.professor_atribuido(turma_id, disciplina_id))
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  )
  WITH CHECK (
    (autor_id = auth.uid() AND public.professor_atribuido(turma_id, disciplina_id))
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  );

-- Assiduidade: professores só trabalham nas turmas atribuídas.
DROP POLICY IF EXISTS assiduidade_sessoes_secretaria ON public.assiduidade_sessoes;
DROP POLICY IF EXISTS assiduidade_sessoes_professor ON public.assiduidade_sessoes;
DROP POLICY IF EXISTS assiduidade_sessoes_staff ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_secretaria ON public.assiduidade_sessoes FOR ALL
  USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
CREATE POLICY assiduidade_sessoes_professor ON public.assiduidade_sessoes FOR ALL
  USING (turma_id = ANY(public.turmas_do_professor()))
  WITH CHECK (turma_id = ANY(public.turmas_do_professor()));

DROP POLICY IF EXISTS assiduidade_registos_secretaria ON public.assiduidade_registos;
DROP POLICY IF EXISTS assiduidade_registos_professor ON public.assiduidade_registos;
DROP POLICY IF EXISTS assiduidade_registos_staff ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_secretaria ON public.assiduidade_registos FOR ALL
  USING (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))))
  WITH CHECK (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))));
CREATE POLICY assiduidade_registos_professor ON public.assiduidade_registos FOR ALL
  USING (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id = ANY(public.turmas_do_professor())))
  WITH CHECK (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id = ANY(public.turmas_do_professor())));

-- Trabalhos: professores só criam/alteram trabalhos das turmas atribuídas.
DROP POLICY IF EXISTS trabalhos_select_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_insert_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_update_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_escola_staff ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_professor_criar ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_professor_editar ON public.trabalhos;
CREATE POLICY trabalhos_select_autorizado ON public.trabalhos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff()) OR turma_id = ANY(public.turmas_do_professor())
  OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id = ANY(public.alunos_do_encarregado()))
  OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()))
);
CREATE POLICY trabalhos_insert_autorizado ON public.trabalhos FOR INSERT WITH CHECK (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
);
CREATE POLICY trabalhos_update_autorizado ON public.trabalhos FOR UPDATE USING (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
) WITH CHECK (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
);

-- Token generation is an administrative operation.
REVOKE ALL ON FUNCTION public.gerar_tokens_acesso(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_tokens_acesso(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
