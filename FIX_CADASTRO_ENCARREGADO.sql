-- KULONGA — activação completa do encarregado
-- Guarda o nome e o telefone fornecidos no primeiro acesso.
-- Executar depois da migração base de tokens.

DROP FUNCTION IF EXISTS public.activar_conta_por_token(text, text, text, text);

CREATE OR REPLACE FUNCTION public.activar_conta_por_token(
  p_codigo text,
  p_tipo text,
  p_email text,
  p_nome text DEFAULT NULL,
  p_telefone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_token public.tokens_acesso%ROWTYPE;
  v_enc uuid;
  v_aluno uuid;
  v_nome text := NULLIF(trim(p_nome), '');
  v_telefone text := NULLIF(trim(p_telefone), '');
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'É necessário criar a conta antes de activar o convite';
  END IF;

  SELECT * INTO v_token
  FROM public.tokens_acesso
  WHERE codigo = upper(trim(p_codigo))
    AND tipo = p_tipo
    AND ativo = true
    AND usado_em IS NULL
    AND (expira_em IS NULL OR expira_em > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido, expirado ou já utilizado';
  END IF;

  v_aluno := v_token.aluno_id;

  IF p_tipo = 'aluno' THEN
    IF EXISTS (
      SELECT 1 FROM public.alunos
      WHERE id = v_aluno AND user_id IS NOT NULL AND user_id <> v_user
    ) THEN
      RAISE EXCEPTION 'Este convite de aluno já está associado a outra conta';
    END IF;

    UPDATE public.alunos
    SET user_id = v_user,
        email = lower(trim(p_email)),
        telefone = COALESCE(v_telefone, telefone)
    WHERE id = v_aluno;
  ELSE
    SELECT id INTO v_enc
    FROM public.encarregados
    WHERE user_id = v_user
    LIMIT 1;

    IF v_enc IS NULL THEN
      INSERT INTO public.encarregados(user_id, nome, telefone)
      VALUES (v_user, COALESCE(v_nome, 'Encarregado'), v_telefone)
      RETURNING id INTO v_enc;
    ELSE
      UPDATE public.encarregados
      SET nome = COALESCE(v_nome, nome),
          telefone = COALESCE(v_telefone, telefone)
      WHERE id = v_enc;
    END IF;

    INSERT INTO public.encarregado_aluno(encarregado_id, aluno_id)
    VALUES (v_enc, v_aluno)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.tokens_acesso
  SET ativo = false, usado_em = now(), usado_por = v_user
  WHERE id = v_token.id;

  RETURN v_aluno;
END;
$$;

REVOKE ALL ON FUNCTION public.activar_conta_por_token(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activar_conta_por_token(text, text, text, text, text) TO authenticated;
