-- KULONGA: gestão de professores separada dos convites
-- Executar depois de FIX_CONVITES_PROFESSORES_24H.sql.
-- Não é necessário repetir os scripts antigos completos de gestão.

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
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = p_escola_id
      AND COALESCE(activo, true) = true AND COALESCE(papel, 'professor') = 'secretaria'
  ) THEN RAISE EXCEPTION 'Apenas a secretaria da escola pode adicionar professores'; END IF;
  IF p_nome IS NULL OR char_length(trim(p_nome)) NOT BETWEEN 3 AND 160 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF p_email IS NULL OR lower(trim(p_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'Email inválido'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.professores
    WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email))
      AND user_id IS NOT NULL AND COALESCE(activo, true) = true
  ) THEN RAISE EXCEPTION 'Já existe um professor activo com este email'; END IF;
  SELECT id INTO v_id FROM public.professores
  WHERE escola_id = p_escola_id AND lower(email) = lower(trim(p_email)) AND user_id IS NULL
  LIMIT 1 FOR UPDATE;
  IF v_id IS NULL THEN
    INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
    VALUES (NULL, p_escola_id, trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), NULL, true, 'professor')
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.professores
    SET nome = trim(p_nome), telefone = nullif(trim(p_telefone), ''), activo = true, papel = 'professor'
    WHERE id = v_id;
  END IF;
  RETURN v_id;
END;
$$;

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
  WHERE p.id = p_professor_id AND p.user_id IS NULL AND COALESCE(p.activo, true) = true
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professor pendente não encontrado'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = v_professor.escola_id
      AND COALESCE(activo, true) = true AND COALESCE(papel, 'professor') = 'secretaria'
  ) THEN RAISE EXCEPTION 'Apenas a secretaria da escola pode gerar convites'; END IF;
  UPDATE public.convites_professores
  SET expira_em = LEAST(expira_em, now())
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
