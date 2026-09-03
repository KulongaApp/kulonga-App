-- SPRINT 1 — Vínculos professor/escola e encarregado/aluno
-- Executar no Supabase SQL Editor depois dos 3 fixes anteriores
-- Depois: NOTIFY pgrst, 'reload schema';

-- 1. Melhorar registar_professor: se secretaria pré-registou professor (user_id NULL) com mesmo email, vincula em vez de duplicar
CREATE OR REPLACE FUNCTION registar_professor(
  p_escola_id uuid,
  p_nome text,
  p_email text,
  p_telefone text,
  p_disciplinas text[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_id uuid;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  SELECT id INTO v_id FROM professores WHERE escola_id = p_escola_id AND lower(email)=lower(p_email) AND user_id IS NULL LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE professores SET user_id=v_user, nome=p_nome, telefone=COALESCE(p_telefone,telefone), disciplinas=COALESCE(p_disciplinas,disciplinas), activo=true WHERE id=v_id;
    RETURN v_id;
  END IF;
  INSERT INTO professores (user_id, escola_id, nome, email, telefone, disciplinas, activo)
  VALUES (v_user, p_escola_id, p_nome, p_email, p_telefone, p_disciplinas, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 2. RPC para encarregado validar token e criar vínculo encarregado_aluno (resolve órfão)
CREATE OR REPLACE FUNCTION validar_e_vincular_token(p_codigo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_aluno uuid; v_enc uuid; v_user uuid;
BEGIN
  SELECT aluno_id INTO v_aluno FROM tokens_acesso WHERE codigo=p_codigo AND ativo=true AND (expira_em IS NULL OR expira_em > now()) LIMIT 1;
  IF v_aluno IS NULL THEN RAISE EXCEPTION 'Token invalido ou expirado'; END IF;
  v_user := auth.uid();
  IF v_user IS NOT NULL THEN
    SELECT id INTO v_enc FROM encarregados WHERE user_id=v_user LIMIT 1;
    IF v_enc IS NULL THEN INSERT INTO encarregados (user_id, nome) VALUES (v_user, 'Encarregado') RETURNING id INTO v_enc; END IF;
  ELSE
    INSERT INTO encarregados (nome) VALUES ('Encarregado') RETURNING id INTO v_enc;
  END IF;
  INSERT INTO encarregado_aluno (encarregado_id, aluno_id) VALUES (v_enc, v_aluno) ON CONFLICT DO NOTHING;
  RETURN v_aluno;
END;
$$;

-- 3. Fechar tokens públicos: remover policy antiga e criar via RPC apenas
DROP POLICY IF EXISTS "tokens_validar" ON tokens_acesso;
CREATE POLICY "tokens_validar_via_rpc" ON tokens_acesso FOR SELECT USING (false);

-- 4. Garantir expira_em padrão 30 dias nos novos tokens
ALTER TABLE tokens_acesso ALTER COLUMN expira_em SET DEFAULT (now() + interval '30 days');

SELECT 'Sprint1 vinculos OK' AS status;
