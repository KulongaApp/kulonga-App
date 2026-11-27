-- KULONGA — gestão real de professores através de convite
-- Executar depois de FIX_CONVITES_PROFESSORES_24H.sql.
-- A secretaria cria o registo imediatamente; o professor apenas activa a conta.
BEGIN;

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
  v_professor_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão necessária'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = p_escola_id
      AND COALESCE(activo, true) = true AND COALESCE(papel, 'professor') = 'secretaria'
  ) THEN RAISE EXCEPTION 'Apenas a secretaria da escola pode adicionar professores'; END IF;
  IF p_nome IS NULL OR char_length(trim(p_nome)) NOT BETWEEN 3 AND 160 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF p_email IS NULL OR lower(trim(p_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'Email inválido'; END IF;

  -- Impede duas contas activas com o mesmo email na mesma escola.
  IF EXISTS (SELECT 1 FROM public.professores WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND user_id IS NOT NULL AND COALESCE(activo, true)) THEN
    RAISE EXCEPTION 'Já existe um professor activo com este email';
  END IF;

  -- Cria ou actualiza o registo visível imediatamente na lista da secretaria.
  SELECT id INTO v_professor_id FROM public.professores
  WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND user_id IS NULL
  LIMIT 1 FOR UPDATE;
  IF v_professor_id IS NULL THEN
    INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
    VALUES (NULL, p_escola_id, trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), NULL, true, 'professor')
    RETURNING id INTO v_professor_id;
  ELSE
    UPDATE public.professores SET nome = trim(p_nome), telefone = nullif(trim(p_telefone), ''), activo = true, papel = 'professor'
    WHERE id = v_professor_id;
  END IF;

  -- Só um convite pendente por email/escola; o novo invalida os anteriores.
  UPDATE public.convites_professores SET expira_em = LEAST(expira_em, now())
  WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND usado_em IS NULL;
  v_raw := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.convites_professores(escola_id, email, nome, telefone, token_hash, criado_por, expira_em)
  VALUES (p_escola_id, lower(trim(p_email)), trim(p_nome), nullif(trim(p_telefone), ''), md5(v_raw), v_user, v_exp);
  RETURN QUERY SELECT v_raw, v_exp;
END;
$$;

CREATE OR REPLACE FUNCTION public.activar_convite_professor(p_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_convite public.convites_professores%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão necessária'; END IF;
  SELECT * INTO v_convite FROM public.convites_professores
  WHERE token_hash = md5(trim(p_token)) AND usado_em IS NULL AND expira_em > now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF v_email <> lower(v_convite.email) THEN RAISE EXCEPTION 'O email da conta não corresponde ao convite'; END IF;
  IF EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user) THEN RAISE EXCEPTION 'A conta já está associada a um perfil'; END IF;

  -- Liga a conta ao registo pendente criado pela secretaria; não cria uma segunda linha.
  SELECT id INTO v_id FROM public.professores
  WHERE escola_id = v_convite.escola_id AND lower(email) = lower(v_convite.email) AND user_id IS NULL
  ORDER BY id LIMIT 1 FOR UPDATE;
  IF v_id IS NULL THEN
    INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, activo, papel)
    VALUES (v_user, v_convite.escola_id, v_convite.nome, v_convite.email, v_convite.telefone, true, 'professor')
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.professores SET user_id = v_user, nome = v_convite.nome, telefone = v_convite.telefone, activo = true, papel = 'professor'
    WHERE id = v_id;
  END IF;
  UPDATE public.convites_professores SET usado_em = now(), usado_por = v_user WHERE id = v_convite.id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_convite_professor(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_convite_professor(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.activar_convite_professor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activar_convite_professor(text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;

-- 2. Registo separado: esta operação não cria convite nem token.
CREATE OR REPLACE FUNCTION public.registar_professor_pendente(
  p_escola_id uuid,
  p_nome text,
  p_email text,
  p_telefone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão necessária'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user AND escola_id = p_escola_id AND activo = true AND papel = 'secretaria') THEN
    RAISE EXCEPTION 'Apenas a secretaria da escola pode adicionar professores';
  END IF;
  IF EXISTS (SELECT 1 FROM public.professores WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND user_id IS NOT NULL AND activo = true) THEN
    RAISE EXCEPTION 'Já existe um professor activo com este email';
  END IF;
  SELECT id INTO v_id FROM public.professores WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND user_id IS NULL LIMIT 1 FOR UPDATE;
  IF v_id IS NULL THEN
    INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, activo, papel)
    VALUES (NULL, p_escola_id, trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), true, 'professor') RETURNING id INTO v_id;
  ELSE
    UPDATE public.professores SET nome = trim(p_nome), telefone = nullif(trim(p_telefone), ''), activo = true, papel = 'professor' WHERE id = v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- 3. Convites numa área própria, pesquisando pelo professor pendente.
CREATE OR REPLACE FUNCTION public.criar_convite_professor_por_id(p_professor_id uuid)
RETURNS TABLE(token text, expira_em timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_professor public.professores%ROWTYPE;
  v_raw text;
  v_exp timestamptz := now() + interval '24 hours';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão necessária'; END IF;
  SELECT p.* INTO v_professor FROM public.professores p
  WHERE p.id = p_professor_id AND p.user_id IS NULL AND p.activo = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professor pendente não encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user AND escola_id = v_professor.escola_id AND activo = true AND papel = 'secretaria') THEN
    RAISE EXCEPTION 'Apenas a secretaria da escola pode gerar convites';
  END IF;
  UPDATE public.convites_professores SET expira_em = LEAST(expira_em, now())
  WHERE escola_id = v_professor.escola_id AND lower(email) = lower(v_professor.email) AND usado_em IS NULL;
  v_raw := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.convites_professores(escola_id, email, nome, telefone, token_hash, criado_por, expira_em)
  VALUES (v_professor.escola_id, lower(v_professor.email), v_professor.nome, v_professor.telefone, md5(v_raw), v_user, v_exp);
  RETURN QUERY SELECT v_raw, v_exp;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_professor_pendente(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_professor_pendente(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.criar_convite_professor_por_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_convite_professor_por_id(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
