-- KULONGA — correcção da geração de tokens de acesso
-- RPC SECURITY DEFINER para evitar falhas de RLS no INSERT directo.
-- Executar no Supabase SQL Editor como administrador.

BEGIN;

CREATE OR REPLACE FUNCTION public.gerar_tokens_acesso(
  p_aluno_id uuid
)
RETURNS TABLE (
  aluno_id uuid,
  token_aluno text,
  token_encarregado text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_escola_id uuid;
  v_token_aluno text;
  v_token_encarregado text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'É necessário iniciar sessão para gerar tokens';
  END IF;

  -- A secretaria/direcção é criada na tabela professores pelo fluxo
  -- registar_escola. Professores autorizados também podem gerar convites.
  SELECT p.escola_id
    INTO v_escola_id
  FROM public.professores p
  WHERE p.user_id = v_user_id
    AND COALESCE(p.activo, true) = true
    AND COALESCE(p.papel, 'professor') = 'secretaria'
  LIMIT 1;

  IF v_escola_id IS NULL THEN
    RAISE EXCEPTION 'O utilizador não está autorizado a gerar tokens';
  END IF;

  -- Bloqueia o aluno durante a rotação para evitar dois pares simultâneos.
  PERFORM 1
  FROM public.alunos a
  WHERE a.id = p_aluno_id
    AND a.escola_id = v_escola_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'O aluno não pertence à escola do utilizador';
  END IF;

  -- Invalida todos os convites anteriores desse aluno.
  UPDATE public.tokens_acesso
  SET ativo = false
  WHERE tokens_acesso.aluno_id = p_aluno_id
    AND tokens_acesso.ativo = true;

  -- Gera códigos hexadecimais de 12 caracteres (48 bits) que ainda não existam.
  LOOP
    v_token_aluno := replace(gen_random_uuid()::text, '-', '');
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.tokens_acesso t
      WHERE t.codigo = v_token_aluno
    );
  END LOOP;

  LOOP
    v_token_encarregado := replace(gen_random_uuid()::text, '-', '');
    EXIT WHEN v_token_encarregado <> v_token_aluno
      AND NOT EXISTS (
        SELECT 1
        FROM public.tokens_acesso t
        WHERE t.codigo = v_token_encarregado
      );
  END LOOP;

  INSERT INTO public.tokens_acesso (
    aluno_id,
    codigo,
    tipo,
    ativo,
    gerado_por,
    expira_em,
    tentativas_falhadas,
    bloqueado_ate
  )
  VALUES
    (p_aluno_id, v_token_aluno, 'aluno', true, v_user_id, now() + interval '24 hours', 0, NULL),
    (p_aluno_id, v_token_encarregado, 'encarregado', true, v_user_id, now() + interval '24 hours', 0, NULL);

  RETURN QUERY
  SELECT p_aluno_id, v_token_aluno, v_token_encarregado;
END;
$$;

-- A função é o único caminho de geração exposto ao cliente.
REVOKE ALL ON FUNCTION public.gerar_tokens_acesso(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_tokens_acesso(uuid) TO authenticated;

-- O cliente continua a validar tokens exclusivamente pelas RPCs existentes.
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Teste opcional, depois de iniciar sessão como secretaria/professor:
-- SELECT * FROM public.gerar_tokens_acesso('ID-DO-ALUNO'::uuid);
-- Deve devolver uma linha com token_aluno e token_encarregado.
