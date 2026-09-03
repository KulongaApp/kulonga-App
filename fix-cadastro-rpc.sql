-- PATCH CADASTRO — funções SECURITY DEFINER (bootstrap de RLS)
-- Problema: ao registar a escola, o director ainda não é "staff",
-- logo o RLS bloqueia o INSERT em escolas/professores (recursão de boot).
-- Fix: RPCs que correm como dono (postgres) e gravam user_id = auth.uid().
-- Cola e corre no Supabase SQL Editor, depois: NOTIFY pgrst, 'reload schema';

-- Permite listar escolas (directório público p/ o professor escolher a sua)
DROP POLICY IF EXISTS "escolas_listar" ON escolas;
CREATE POLICY "escolas_listar" ON escolas FOR SELECT USING (true);

-- Registar escola + director (primeiro professor) numa só transacção
CREATE OR REPLACE FUNCTION registar_escola(
  p_nome text,
  p_provincia text,
  p_municipio text,
  p_endereco text,
  p_telefone text,
  p_email text,
  p_direccao_nome text,
  p_direccao_telefone text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_escola uuid;
  v_user uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'sem sessao';
  END IF;
  INSERT INTO escolas (nome, provincia, municipio, endereco, telefone, email, direccao_nome, direccao_telefone)
  VALUES (p_nome, p_provincia, p_municipio, p_endereco, p_telefone, p_email, p_direccao_nome, p_direccao_telefone)
  RETURNING id INTO v_escola;
  INSERT INTO professores (user_id, escola_id, nome, email, telefone, disciplinas, activo)
  VALUES (v_user, v_escola, p_direccao_nome, p_email, p_direccao_telefone, NULL, true);
  RETURN v_escola;
END;
$$;

-- Registar professor (auto-registo) ligado a uma escola existente
CREATE OR REPLACE FUNCTION registar_professor(
  p_escola_id uuid,
  p_nome text,
  p_email text,
  p_telefone text,
  p_disciplinas text[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'sem sessao';
  END IF;
  INSERT INTO professores (user_id, escola_id, nome, email, telefone, disciplinas, activo)
  VALUES (v_user, p_escola_id, p_nome, p_email, p_telefone, p_disciplinas, true);
  RETURN (SELECT id FROM professores WHERE user_id = v_user AND escola_id = p_escola_id LIMIT 1);
END;
$$;

SELECT 'registar_escola OK' WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname='registar_escola');
SELECT 'registar_professor OK' WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname='registar_professor');
