-- KULONGA — fluxo de professores e validade única de 24 horas
-- Executar no Supabase SQL Editor como administrador.
-- Esta migração não cria contas Auth: o professor cria a própria conta através do convite.
BEGIN;

-- Convites de professores: 24 horas a partir da criação.
ALTER TABLE public.convites_professores
  ALTER COLUMN expira_em SET DEFAULT (now() + interval '24 hours');
UPDATE public.convites_professores
SET expira_em = LEAST(expira_em, criado_em + interval '24 hours')
WHERE usado_em IS NULL;

CREATE OR REPLACE FUNCTION public.criar_convite_professor(
  p_escola_id uuid,
  p_nome text,
  p_email text,
  p_telefone text DEFAULT NULL
) RETURNS TABLE(token text, expira_em timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_raw text;
  v_exp timestamptz := now() + interval '24 hours';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão necessária'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = p_escola_id
      AND COALESCE(activo, true) = true AND COALESCE(papel, 'professor') = 'secretaria'
  ) THEN RAISE EXCEPTION 'Apenas a secretaria da escola pode criar convites'; END IF;
  IF p_nome IS NULL OR char_length(trim(p_nome)) NOT BETWEEN 3 AND 160 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF p_email IS NULL OR lower(trim(p_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;

  -- Um novo convite invalida convites anteriores ainda pendentes para o mesmo email/escola.
  UPDATE public.convites_professores
  SET expira_em = LEAST(expira_em, now())
  WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND usado_em IS NULL;

  v_raw := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.convites_professores(escola_id, email, nome, telefone, token_hash, criado_por, expira_em)
  VALUES (p_escola_id, lower(trim(p_email)), trim(p_nome), nullif(trim(p_telefone), ''), md5(v_raw), v_user, v_exp);
  RETURN QUERY SELECT v_raw, v_exp;
END;
$$;

-- Tokens de aluno e encarregado: reduzir tokens já criados e futuros para 24 horas.
ALTER TABLE public.tokens_acesso
  ALTER COLUMN expira_em SET DEFAULT (now() + interval '24 hours');
UPDATE public.tokens_acesso
SET expira_em = LEAST(COALESCE(expira_em, criado_em + interval '24 hours'), criado_em + interval '24 hours');

CREATE OR REPLACE FUNCTION public.gerar_tokens_acesso(p_aluno_id uuid)
RETURNS TABLE (aluno_id uuid, token_aluno text, token_encarregado text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_escola_id uuid;
  v_token_aluno text;
  v_token_encarregado text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'É necessário iniciar sessão para gerar tokens'; END IF;
  SELECT p.escola_id INTO v_escola_id FROM public.professores p
  WHERE p.user_id = v_user_id AND COALESCE(p.activo, true) = true AND COALESCE(p.papel, 'professor') = 'secretaria'
  LIMIT 1;
  IF v_escola_id IS NULL THEN RAISE EXCEPTION 'O utilizador não está autorizado a gerar tokens'; END IF;
  PERFORM 1 FROM public.alunos a WHERE a.id = p_aluno_id AND a.escola_id = v_escola_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'O aluno não pertence à escola do utilizador'; END IF;
  UPDATE public.tokens_acesso SET ativo = false WHERE tokens_acesso.aluno_id = p_aluno_id AND tokens_acesso.ativo = true;
  LOOP
    v_token_aluno := replace(gen_random_uuid()::text, '-', '');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tokens_acesso t WHERE t.codigo = v_token_aluno);
  END LOOP;
  LOOP
    v_token_encarregado := replace(gen_random_uuid()::text, '-', '');
    EXIT WHEN v_token_encarregado <> v_token_aluno AND NOT EXISTS (SELECT 1 FROM public.tokens_acesso t WHERE t.codigo = v_token_encarregado);
  END LOOP;
  INSERT INTO public.tokens_acesso (aluno_id, codigo, tipo, ativo, gerado_por, expira_em, tentativas_falhadas, bloqueado_ate)
  VALUES (p_aluno_id, v_token_aluno, 'aluno', true, v_user_id, now() + interval '24 hours', 0, NULL),
         (p_aluno_id, v_token_encarregado, 'encarregado', true, v_user_id, now() + interval '24 hours', 0, NULL);
  RETURN QUERY SELECT p_aluno_id, v_token_aluno, v_token_encarregado;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_convite_professor(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_convite_professor(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.gerar_tokens_acesso(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_tokens_acesso(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Verificação opcional:
-- SELECT proname, pg_get_functiondef(oid) FROM pg_proc WHERE proname IN ('criar_convite_professor','gerar_tokens_acesso');
