-- KULONGA — correcção da recursão RLS após o endurecimento por papéis
-- Executar depois de HARDENING_RLS_PAPEIS.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.alunos_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(a.id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.disciplinas_do_professor()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT dp.disciplina_id), ARRAY[]::uuid[])
  FROM public.disciplina_professor dp
  JOIN public.professores p ON p.id = dp.professor_id
  WHERE p.user_id = auth.uid() AND p.activo = true AND p.papel = 'professor';
$$;

CREATE OR REPLACE FUNCTION public.turmas_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT ta.turma_id), ARRAY[]::uuid[])
  FROM public.turma_alunos ta
  WHERE ta.aluno_id = ANY(public.alunos_do_utilizador())
     OR ta.aluno_id = ANY(public.alunos_do_encarregado());
$$;

CREATE OR REPLACE FUNCTION public.escolas_dos_alunos_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT a.escola_id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.id = ANY(public.alunos_do_utilizador());
$$;

CREATE OR REPLACE FUNCTION public.escolas_dos_alunos_do_encarregado()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT a.escola_id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.id = ANY(public.alunos_do_encarregado());
$$;

REVOKE ALL ON FUNCTION public.alunos_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.disciplinas_do_professor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.turmas_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_dos_alunos_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_dos_alunos_do_encarregado() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alunos_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disciplinas_do_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.turmas_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_dos_alunos_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_dos_alunos_do_encarregado() TO authenticated;

DROP POLICY IF EXISTS alunos_select_autorizado ON public.alunos;
CREATE POLICY alunos_select_autorizado ON public.alunos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR id = ANY(public.alunos_do_encarregado())
  OR id = ANY(public.alunos_do_utilizador())
  OR id IN (SELECT ta.aluno_id FROM public.turma_alunos ta WHERE ta.turma_id = ANY(public.turmas_do_professor()))
);

DROP POLICY IF EXISTS disciplinas_select_autorizado ON public.disciplinas;
CREATE POLICY disciplinas_select_autorizado ON public.disciplinas FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR id = ANY(public.disciplinas_do_professor())
);

DROP POLICY IF EXISTS turma_alunos_select_autorizado ON public.turma_alunos;
CREATE POLICY turma_alunos_select_autorizado ON public.turma_alunos FOR SELECT USING (
  turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  OR turma_id = ANY(public.turmas_do_professor())
  OR aluno_id = ANY(public.alunos_do_encarregado())
  OR aluno_id = ANY(public.alunos_do_utilizador())
);

DROP POLICY IF EXISTS disciplina_professor_select_autorizado ON public.disciplina_professor;
CREATE POLICY disciplina_professor_select_autorizado ON public.disciplina_professor FOR SELECT USING (
  professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid())
  OR disciplina_id = ANY(public.disciplinas_do_professor())
  OR disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff()))
);

DROP POLICY IF EXISTS notas_select_autorizado ON public.notas;
CREATE POLICY notas_select_autorizado ON public.notas FOR SELECT USING (
  turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  OR public.professor_atribuido(turma_id, disciplina_id)
  OR turma_id = ANY(public.turmas_do_utilizador())
  OR aluno_id = ANY(public.alunos_do_encarregado())
  OR aluno_id = ANY(public.alunos_do_utilizador())
);

DROP POLICY IF EXISTS trabalhos_select_autorizado ON public.trabalhos;
CREATE POLICY trabalhos_select_autorizado ON public.trabalhos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR turma_id = ANY(public.turmas_do_professor())
  OR turma_id = ANY(public.turmas_do_utilizador())
);

DROP POLICY IF EXISTS avisos_ler ON public.avisos;
CREATE POLICY avisos_ler ON public.avisos FOR SELECT USING (
  (
    escola_id = ANY(public.escolas_do_staff())
    AND publico IN ('escola', 'professores')
  )
  OR (
    escola_id = ANY(public.escolas_dos_alunos_do_utilizador())
    AND publico IN ('escola', 'alunos')
    AND (turma_id IS NULL OR turma_id = ANY(public.turmas_do_utilizador()))
  )
  OR (
    escola_id = ANY(public.escolas_dos_alunos_do_encarregado())
    AND publico IN ('escola', 'encarregados')
    AND (turma_id IS NULL OR turma_id = ANY(public.turmas_do_utilizador()))
  )
);

NOTIFY pgrst, 'reload schema';
COMMIT;
