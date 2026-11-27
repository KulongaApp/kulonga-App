-- KULONGA: mensagens claras para tokens (professor, aluno, encarregado).
-- Em vez de "inválido ou expirado" para tudo, a app passa a saber o motivo real:
--   inexistente, tipo_errado, usado, anulado, expirado, bloqueado, email_diferente, limite.
-- "expirado" só aparece quando o prazo realmente passou. Um token que a escola substituiu
-- por um novo (o antigo é encerrado na hora) aparece como "anulado", não como "expirado".
-- Não altera tabelas nem permissões existentes. Executar no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION public.diagnosticar_token(
  p_codigo text,
  p_tipo_esperado text,
  p_email text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_codigo text := lower(trim(coalesce(p_codigo, '')));
  v_esperado text := lower(trim(coalesce(p_tipo_esperado, '')));
  v_longo boolean;
  v_ip text := 'sem-ip';
  v_chave text;
  v_janela timestamptz := to_timestamp(floor(extract(epoch FROM now()) / 900) * 900);
  v_tentativas integer;
  v_tipo text;
  v_criado timestamptz;
  v_exp timestamptz;
  v_usado timestamptz;
  v_bloq timestamptz;
  v_ativo boolean;
  v_email_convite text;
  v_achou boolean := false;
BEGIN
  IF v_esperado NOT IN ('professor', 'aluno', 'encarregado') THEN
    RETURN jsonb_build_object('motivo', 'inexistente');
  END IF;
  IF v_codigo !~ '^[a-f0-9]{6}$' AND v_codigo !~ '^[a-f0-9]{32}$' THEN
    RETURN jsonb_build_object('motivo', 'inexistente');
  END IF;
  v_longo := length(v_codigo) = 32;

  -- Limite de tentativas por IP: 120 em cada 15 minutos (folga porque muitas redes móveis partilham o mesmo IP)
  BEGIN
    v_ip := split_part(coalesce(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for', 'sem-ip'), ',', 1);
  EXCEPTION WHEN others THEN
    v_ip := 'sem-ip';
  END;
  v_chave := md5('diagnostico|' || trim(v_ip));
  INSERT INTO public.token_rate_limits (rate_key, window_start, attempts, updated_at)
  VALUES (v_chave, v_janela, 1, now())
  ON CONFLICT (rate_key) DO UPDATE
    SET attempts = CASE WHEN public.token_rate_limits.window_start = v_janela
                        THEN public.token_rate_limits.attempts + 1 ELSE 1 END,
        window_start = v_janela,
        updated_at = now()
  RETURNING attempts INTO v_tentativas;
  IF v_tentativas > 120 THEN
    RETURN jsonb_build_object('motivo', 'limite');
  END IF;

  -- 1) Tokens de aluno e encarregado. Códigos antigos de 6 dígitos só se procuram no tipo esperado.
  SELECT lower(t.tipo), t.criado_em, t.expira_em, t.usado_em, t.bloqueado_ate, t.ativo
    INTO v_tipo, v_criado, v_exp, v_usado, v_bloq, v_ativo
  FROM public.tokens_acesso t
  WHERE lower(t.codigo) = v_codigo
    AND (v_longo OR lower(t.tipo) = v_esperado)
  ORDER BY t.criado_em DESC NULLS LAST
  LIMIT 1;
  IF FOUND THEN
    v_achou := true;
  ELSIF v_longo THEN
    -- 2) Convites de professor (guardados com md5 do código)
    SELECT 'professor', c.criado_em, c.expira_em, c.usado_em, NULL::timestamptz, true, lower(c.email)
      INTO v_tipo, v_criado, v_exp, v_usado, v_bloq, v_ativo, v_email_convite
    FROM public.convites_professores c
    WHERE c.token_hash = md5(v_codigo)
    LIMIT 1;
    IF FOUND THEN v_achou := true; END IF;
  END IF;

  IF NOT v_achou THEN
    RETURN jsonb_build_object('motivo', 'inexistente');
  END IF;
  IF v_tipo <> v_esperado THEN
    RETURN jsonb_build_object('motivo', 'tipo_errado', 'tipo_real', v_tipo);
  END IF;
  IF v_usado IS NOT NULL THEN
    RETURN jsonb_build_object('motivo', 'usado');
  END IF;
  IF v_ativo IS NOT TRUE THEN
    RETURN jsonb_build_object('motivo', 'anulado');
  END IF;
  IF v_exp IS NOT NULL AND v_exp <= now() THEN
    -- Encerrado muito antes das 24 horas = substituído por um token novo, não expirado
    IF v_criado IS NOT NULL AND v_exp < v_criado + interval '23 hours 55 minutes' THEN
      RETURN jsonb_build_object('motivo', 'anulado');
    END IF;
    RETURN jsonb_build_object('motivo', 'expirado', 'expira_em', v_exp);
  END IF;
  IF v_bloq IS NOT NULL AND v_bloq > now() THEN
    RETURN jsonb_build_object('motivo', 'bloqueado');
  END IF;
  IF v_esperado = 'professor' AND p_email IS NOT NULL AND length(trim(p_email)) > 0
     AND lower(trim(p_email)) <> v_email_convite THEN
    RETURN jsonb_build_object('motivo', 'email_diferente');
  END IF;
  RETURN jsonb_build_object('motivo', 'ok');
END;
$$;

REVOKE ALL ON FUNCTION public.diagnosticar_token(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.diagnosticar_token(text, text, text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
