-- PATCH RLS 2 — corrige recursão mútua encarregados <-> encarregado_aluno
-- Causa: encarregados_staff lia encarregado_aluno e encarregado_aluno_staff lia
-- encarregados -> ciclo -> 500.
-- Fix: função meus_encarregados() SECURITY DEFINER + policies sem referência cruzada.
-- Cola e corre no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION meus_encarregados()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  FROM encarregados WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "encarregados_staff" ON encarregados;
CREATE POLICY "encarregados_staff" ON encarregados
  FOR ALL USING (
    user_id = auth.uid()
    OR id IN (
      SELECT encarregado_id FROM encarregado_aluno
      WHERE aluno_id IN (SELECT id FROM alunos WHERE escola_id = ANY(escolas_do_staff()))
    )
  );

DROP POLICY IF EXISTS "encarregado_aluno_staff" ON encarregado_aluno;
CREATE POLICY "encarregado_aluno_staff" ON encarregado_aluno
  FOR ALL USING (
    encarregado_id = ANY(meus_encarregados())
    OR aluno_id IN (SELECT id FROM alunos WHERE escola_id = ANY(escolas_do_staff()))
    OR aluno_id = ANY(alunos_do_encarregado())
  );

-- Confirmar
SELECT 'meus_encarregados OK' WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname='meus_encarregados');
