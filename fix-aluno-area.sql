-- SPRINT 4 — Área do Aluno
-- Executar no Supabase SQL Editor
-- Depois: NOTIFY pgrst, 'reload schema';

ALTER TABLE alunos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION registar_aluno(p_escola_id uuid, p_nome text, p_email text, p_genero text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid; v_id uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  INSERT INTO alunos (escola_id, nome_completo, email, genero, user_id) VALUES (p_escola_id, p_nome, lower(p_email), p_genero, v_user) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

DROP POLICY IF EXISTS "alunos_ver_proprio" ON alunos;
CREATE POLICY "alunos_ver_proprio" ON alunos FOR SELECT USING (user_id = auth.uid() OR id = ANY(alunos_do_encarregado()) OR escola_id = ANY(escolas_do_staff()));

SELECT 'aluno area OK' AS status;
