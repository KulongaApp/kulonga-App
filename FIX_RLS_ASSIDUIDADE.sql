-- KULONGA — correcção RLS da assiduidade
-- Evita a recursão entre assiduidade_sessoes e assiduidade_registos.

BEGIN;

CREATE OR REPLACE FUNCTION public.sessoes_assiduidade_do_utilizador()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT r.sessao_id), ARRAY[]::uuid[])
  FROM public.assiduidade_registos r
  WHERE r.aluno_id = ANY(public.alunos_do_encarregado())
     OR r.aluno_id IN (
       SELECT a.id
       FROM public.alunos a
       WHERE a.user_id = auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION public.sessoes_assiduidade_do_utilizador() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sessoes_assiduidade_do_utilizador() TO authenticated;

DROP POLICY IF EXISTS assiduidade_sessoes_staff ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_staff
  ON public.assiduidade_sessoes
  FOR ALL
  USING (
    turma_id IN (
      SELECT t.id
      FROM public.turmas t
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  )
  WITH CHECK (
    turma_id IN (
      SELECT t.id
      FROM public.turmas t
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  );

DROP POLICY IF EXISTS assiduidade_registos_staff ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_staff
  ON public.assiduidade_registos
  FOR ALL
  USING (
    sessao_id IN (
      SELECT s.id
      FROM public.assiduidade_sessoes s
      JOIN public.turmas t ON t.id = s.turma_id
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  )
  WITH CHECK (
    sessao_id IN (
      SELECT s.id
      FROM public.assiduidade_sessoes s
      JOIN public.turmas t ON t.id = s.turma_id
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  );

DROP POLICY IF EXISTS assiduidade_sessoes_encarregado ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_encarregado
  ON public.assiduidade_sessoes
  FOR SELECT
  USING (id = ANY(public.sessoes_assiduidade_do_utilizador()));

DROP POLICY IF EXISTS assiduidade_registos_encarregado ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_encarregado
  ON public.assiduidade_registos
  FOR SELECT
  USING (aluno_id = ANY(public.alunos_do_encarregado()));

DROP POLICY IF EXISTS assiduidade_registos_aluno ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_aluno
  ON public.assiduidade_registos
  FOR SELECT
  USING (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE a.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
