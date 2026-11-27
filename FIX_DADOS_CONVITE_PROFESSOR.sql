-- KULONGA: o professor vê os dados que a secretaria registou (só leitura) ao ativar o convite.
-- 1) dados_convite_professor: com um token válido, devolve nome, email, telefone, escola e turmas/disciplinas.
-- 2) activar_convite_professor: versão final. Liga a conta ao registo que a secretaria criou
--    (mantém turmas e disciplinas) e usa SEMPRE os dados da secretaria, nunca os escritos pelo professor.
-- Não altera tabelas. Executar no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION public.dados_convite_professor(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_token text := lower(trim(coalesce(p_token, '')));
  v_ip text := 'sem-ip';
  v_chave text;
  v_janela timestamptz := to_timestamp(floor(extract(epoch FROM now()) / 900) * 900);
  v_tentativas integer;
  v_convite public.convites_professores%ROWTYPE;
  v_escola_nome text;
  v_prof_id uuid;
  v_atribuicoes jsonb;
BEGIN
  IF v_token !~ '^[a-f0-9]{32}$' THEN
    RETURN jsonb_build_object('valido', false);
  END IF;

  -- Limite de tentativas por IP: 120 em cada 15 minutos
  BEGIN
    v_ip := split_part(coalesce(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for', 'sem-ip'), ',', 1);
  EXCEPTION WHEN others THEN
    v_ip := 'sem-ip';
  END;
  v_chave := md5('dados-convite|' || trim(v_ip));
  INSERT INTO public.token_rate_limits (rate_key, window_start, attempts, updated_at)
  VALUES (v_chave, v_janela, 1, now())
  ON CONFLICT (rate_key) DO UPDATE
    SET attempts = CASE WHEN public.token_rate_limits.window_start = v_janela
                        THEN public.token_rate_limits.attempts + 1 ELSE 1 END,
        window_start = v_janela,
        updated_at = now()
  RETURNING attempts INTO v_tentativas;
  IF v_tentativas > 120 THEN
    RETURN jsonb_build_object('valido', false);
  END IF;

  -- Só com token válido: não usado e dentro do prazo
  SELECT * INTO v_convite
  FROM public.convites_professores c
  WHERE c.token_hash = md5(v_token) AND c.usado_em IS NULL AND c.expira_em > now()
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false);
  END IF;

  SELECT e.nome INTO v_escola_nome FROM public.escolas e WHERE e.id = v_convite.escola_id;

  SELECT p.id INTO v_prof_id
  FROM public.professores p
  WHERE p.escola_id = v_convite.escola_id
    AND lower(p.email) = lower(v_convite.email)
    AND p.user_id IS NULL
  ORDER BY p.id
  LIMIT 1;

  SELECT coalesce(jsonb_agg(jsonb_build_object('turma', t.nome, 'disciplina', d.nome) ORDER BY t.nome, d.nome), '[]'::jsonb)
    INTO v_atribuicoes
  FROM public.disciplina_professor dp
  JOIN public.turmas t ON t.id = dp.turma_id
  JOIN public.disciplinas d ON d.id = dp.disciplina_id
  WHERE dp.professor_id = v_prof_id;

  RETURN jsonb_build_object(
    'valido', true,
    'nome', v_convite.nome,
    'email', v_convite.email,
    'telefone', v_convite.telefone,
    'escola', v_escola_nome,
    'atribuicoes', v_atribuicoes,
    'expira_em', v_convite.expira_em
  );
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
  IF EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'A conta já está associada a um perfil';
  END IF;

  -- Liga a conta ao registo pendente criado pela secretaria; não cria uma segunda linha.
  SELECT id INTO v_id FROM public.professores
  WHERE escola_id = v_convite.escola_id AND lower(email) = lower(v_convite.email) AND user_id IS NULL
  ORDER BY id LIMIT 1 FOR UPDATE;
  IF v_id IS NULL THEN
    INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, activo, papel)
    VALUES (v_user, v_convite.escola_id, v_convite.nome, v_convite.email, v_convite.telefone, true, 'professor')
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.professores
    SET user_id = v_user, nome = v_convite.nome, telefone = v_convite.telefone, activo = true, papel = 'professor'
    WHERE id = v_id;
  END IF;
  UPDATE public.convites_professores SET usado_em = now(), usado_por = v_user WHERE id = v_convite.id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.dados_convite_professor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dados_convite_professor(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.activar_convite_professor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activar_convite_professor(text) TO authenticated;
NOTIFY pgrst, 'reload schema';
