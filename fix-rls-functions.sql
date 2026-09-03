-- PATCH RLS — corrige recursão infinita (FASE 3)
-- Causa: as policies de professores/encarregados chamavam escolas_do_staff() /
-- alunos_do_encarregado(), que por sua vez liam tabelas com RLS -> recursão -> 500.
-- Fix: funções passam a SECURITY DEFINER (bypass de RLS), quebrando a recursão.
-- Cola e corre no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION escolas_do_staff()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM professores WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION alunos_do_encarregado()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(ea.aluno_id), ARRAY[]::uuid[])
  FROM encarregado_aluno ea
  JOIN encarregados e ON e.id = ea.encarregado_id
  WHERE e.user_id = auth.uid();
$$;

-- Confirmar
SELECT 'escolas_do_staff OK' WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname='escolas_do_staff');
SELECT 'alunos_do_encarregado OK' WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname='alunos_do_encarregado');
