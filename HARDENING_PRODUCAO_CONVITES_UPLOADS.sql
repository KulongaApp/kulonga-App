-- KULONGA — endurecimento de produção: convites, tokens e uploads
-- Executar depois de HARDENING_RLS_PAPEIS.sql e FIX_RLS_RECURSAO_PAPEIS.sql.
-- Requer execução no Supabase SQL Editor como administrador.

BEGIN;

-- Janela de rate limiting server-side. A Edge Function é a única consumidora.
CREATE TABLE IF NOT EXISTS public.token_rate_limits (
  rate_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.token_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.token_rate_limits FROM anon, authenticated;

-- 1. Convites únicos de professores
CREATE TABLE IF NOT EXISTS public.convites_professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text NOT NULL CHECK (char_length(trim(nome)) BETWEEN 3 AND 160),
  telefone text,
  token_hash text NOT NULL UNIQUE,
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  usado_em timestamptz,
  usado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_convites_professores_email ON public.convites_professores(lower(email));
ALTER TABLE public.convites_professores ENABLE ROW LEVEL SECURITY;

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
      AND activo = true AND papel = 'secretaria'
  ) THEN RAISE EXCEPTION 'Apenas a secretaria pode criar convites'; END IF;
  IF p_nome IS NULL OR char_length(trim(p_nome)) NOT BETWEEN 3 AND 160 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF p_email IS NULL OR lower(trim(p_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  -- gen_random_uuid() existe mesmo quando pgcrypto não expõe gen_random_bytes().
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
  SELECT * INTO v_convite
  FROM public.convites_professores
  WHERE token_hash = md5(trim(p_token))
    AND usado_em IS NULL AND expira_em > now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF v_email <> lower(v_convite.email) THEN RAISE EXCEPTION 'O email da conta não corresponde ao convite'; END IF;
  IF EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'A conta já está associada a um perfil';
  END IF;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, activo, papel)
  VALUES (v_user, v_convite.escola_id, v_convite.nome, v_convite.email, v_convite.telefone, true, 'professor')
  RETURNING id INTO v_id;
  UPDATE public.convites_professores SET usado_em = now(), usado_por = v_user WHERE id = v_convite.id;
  RETURN v_id;
END;
$$;

DROP POLICY IF EXISTS convites_professores_secretaria ON public.convites_professores;
CREATE POLICY convites_professores_secretaria ON public.convites_professores
  FOR SELECT USING (escola_id = ANY(public.escolas_do_staff()));
REVOKE ALL ON FUNCTION public.criar_convite_professor(uuid,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activar_convite_professor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_convite_professor(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activar_convite_professor(text) TO authenticated;

-- 2. Expiração obrigatória nos tokens existentes e futuros
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS tentativas_falhadas smallint NOT NULL DEFAULT 0;
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS bloqueado_ate timestamptz;
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS expira_em timestamptz;
ALTER TABLE public.tokens_acesso ALTER COLUMN expira_em SET DEFAULT (now() + interval '24 hours');
UPDATE public.tokens_acesso SET expira_em = coalesce(expira_em, criado_em + interval '24 hours') WHERE expira_em IS NULL;

CREATE OR REPLACE FUNCTION public.validar_token_acesso(p_codigo text, p_tipo text)
RETURNS TABLE(aluno_id uuid, nome_aluno text, escola_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_token public.tokens_acesso%ROWTYPE;
BEGIN
  SELECT * INTO v_token
  FROM public.tokens_acesso
  WHERE lower(codigo) = lower(trim(p_codigo)) AND lower(tipo) = lower(trim(p_tipo))
    AND ativo = true AND usado_em IS NULL
  LIMIT 1;
  IF NOT FOUND OR v_token.expira_em IS NOT NULL AND v_token.expira_em <= now()
     OR v_token.bloqueado_ate IS NOT NULL AND v_token.bloqueado_ate > now()
  THEN RETURN; END IF;
  RETURN QUERY SELECT a.id, a.nome_completo, a.escola_id
    FROM public.alunos a WHERE a.id = v_token.aluno_id LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.activar_conta_por_token(
  p_codigo text, p_tipo text, p_email text, p_nome text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_token public.tokens_acesso%ROWTYPE; v_enc uuid; v_aluno uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'É necessário criar a conta antes de activar o convite'; END IF;
  SELECT * INTO v_token FROM public.tokens_acesso
  WHERE lower(codigo) = lower(trim(p_codigo)) AND lower(tipo) = lower(trim(p_tipo)) AND ativo = true AND usado_em IS NULL FOR UPDATE;
  IF NOT FOUND OR v_token.expira_em IS NOT NULL AND v_token.expira_em <= now()
     OR v_token.bloqueado_ate IS NOT NULL AND v_token.bloqueado_ate > now()
  THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  v_aluno := v_token.aluno_id;
  IF lower(p_tipo) = 'aluno' THEN
    IF EXISTS (SELECT 1 FROM public.alunos WHERE id = v_aluno AND user_id IS NOT NULL AND user_id <> v_user) THEN
      RAISE EXCEPTION 'Este convite de aluno já está associado a outra conta';
    END IF;
    UPDATE public.alunos SET user_id = v_user, email = lower(trim(p_email)) WHERE id = v_aluno;
  ELSE
    SELECT id INTO v_enc FROM public.encarregados WHERE user_id = v_user LIMIT 1;
    IF v_enc IS NULL THEN
      INSERT INTO public.encarregados(user_id, nome) VALUES (v_user, COALESCE(NULLIF(trim(p_nome), ''), 'Encarregado')) RETURNING id INTO v_enc;
    END IF;
    INSERT INTO public.encarregado_aluno(encarregado_id, aluno_id) VALUES (v_enc, v_aluno) ON CONFLICT DO NOTHING;
  END IF;
  UPDATE public.tokens_acesso SET ativo = false, usado_em = now(), usado_por = v_user, tentativas_falhadas = 0 WHERE id = v_token.id;
  RETURN v_aluno;
END;
$$;

-- 3. Bucket privado com limites de ficheiro e MIME
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg', 'image/png',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
WHERE id = 'trabalhos-entregas';

DROP POLICY IF EXISTS entregas_upload_aluno ON storage.objects;
CREATE POLICY entregas_upload_aluno ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'trabalhos-entregas'
  AND auth.role() = 'authenticated'
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9]{13}-[A-Za-z0-9._-]+$'
  AND (CASE WHEN split_part(name, '/', 3) ~* '^[0-9a-f-]{36}$' THEN split_part(name, '/', 3)::uuid ELSE NULL END) = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.trabalhos t
    JOIN public.turma_alunos ta ON ta.turma_id = t.turma_id
    JOIN public.alunos a ON a.id = ta.aluno_id
    WHERE t.id = (CASE WHEN split_part(name, '/', 2) ~* '^[0-9a-f-]{36}$' THEN split_part(name, '/', 2)::uuid ELSE NULL END)
      AND a.user_id = auth.uid()
      AND t.escola_id = (CASE WHEN split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' THEN split_part(name, '/', 1)::uuid ELSE NULL END)
  )
);

DROP POLICY IF EXISTS entregas_ler_autorizado ON storage.objects;
CREATE POLICY entregas_ler_autorizado ON storage.objects FOR SELECT USING (
  bucket_id = 'trabalhos-entregas'
  AND auth.role() = 'authenticated'
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9]{13}-[A-Za-z0-9._-]+$'
  AND (
    (CASE WHEN split_part(name, '/', 3) ~* '^[0-9a-f-]{36}$' THEN split_part(name, '/', 3)::uuid ELSE NULL END) = auth.uid()
    OR (CASE WHEN split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' THEN split_part(name, '/', 1)::uuid ELSE NULL END) = ANY(public.escolas_do_staff())
  )
);

NOTIFY pgrst, 'reload schema';
COMMIT;
