-- KULONGA — Fluxo de acesso por convite v2
-- Aplicar no Supabase SQL Editor e depois executar:
-- NOTIFY pgrst, 'reload schema';
--
-- Princípios:
-- 1) A secretaria emite um token de ALUNO e um de ENCARREGADO.
-- 2) O token apenas identifica o convite; não cria sessões anónimas.
-- 3) A conta é criada no Auth e só depois o token é activado.
-- 4) Cada token é de uso único e expira por defeito em 30 dias.

-- Compatibilidade com instalações já existentes.
ALTER TABLE tokens_acesso ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION escolas_do_staff()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::UUID[])
  FROM professores
  WHERE user_id = auth.uid();
$$;

ALTER TABLE tokens_acesso
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'encarregado'
    CHECK (tipo IN ('aluno', 'encarregado'));

ALTER TABLE tokens_acesso
  ADD COLUMN IF NOT EXISTS usado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS tokens_acesso_codigo_activo_idx
  ON tokens_acesso (codigo)
  WHERE ativo = true;

-- Se uma versão anterior já criou mais do que um token de aluno activo,
-- conserva o mais recente antes de criar a restrição de unicidade.
WITH duplicados AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY aluno_id ORDER BY criado_em DESC, id DESC) AS ordem
  FROM tokens_acesso
  WHERE ativo = true AND tipo = 'aluno'
)
UPDATE tokens_acesso t
SET ativo = false
FROM duplicados d
WHERE t.id = d.id AND d.ordem > 1;

CREATE UNIQUE INDEX IF NOT EXISTS tokens_acesso_aluno_activo_idx
  ON tokens_acesso (aluno_id)
  WHERE ativo = true AND tipo = 'aluno';

-- Apenas lê o convite. Não cria utilizador, encarregado ou vínculo.
CREATE OR REPLACE FUNCTION validar_token_acesso(
  p_codigo TEXT,
  p_tipo TEXT
)
RETURNS TABLE(aluno_id UUID, nome_aluno TEXT, escola_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.nome_completo, a.escola_id
  FROM tokens_acesso t
  JOIN alunos a ON a.id = t.aluno_id
  WHERE t.codigo = upper(trim(p_codigo))
    AND t.tipo = p_tipo
    AND t.ativo = true
    AND t.usado_em IS NULL
    AND (t.expira_em IS NULL OR t.expira_em > now())
  LIMIT 1;
$$;

-- Liga o utilizador autenticado ao convite e consome o token atomically.
CREATE OR REPLACE FUNCTION activar_conta_por_token(
  p_codigo TEXT,
  p_tipo TEXT,
  p_email TEXT,
  p_nome TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_token tokens_acesso%ROWTYPE;
  v_enc UUID;
  v_aluno UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'É necessário criar a conta antes de activar o convite';
  END IF;

  SELECT * INTO v_token
  FROM tokens_acesso
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
    IF EXISTS (SELECT 1 FROM alunos WHERE id = v_aluno AND user_id IS NOT NULL AND user_id <> v_user) THEN
      RAISE EXCEPTION 'Este convite de aluno já está associado a outra conta';
    END IF;

    UPDATE alunos
    SET user_id = v_user,
        email = lower(trim(p_email))
    WHERE id = v_aluno;
  ELSE
    SELECT id INTO v_enc FROM encarregados WHERE user_id = v_user LIMIT 1;
    IF v_enc IS NULL THEN
      INSERT INTO encarregados (user_id, nome)
      VALUES (v_user, COALESCE(NULLIF(trim(p_nome), ''), 'Encarregado'))
      RETURNING id INTO v_enc;
    END IF;

    INSERT INTO encarregado_aluno (encarregado_id, aluno_id)
    VALUES (v_enc, v_aluno)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE tokens_acesso
  SET ativo = false, usado_em = now(), usado_por = v_user
  WHERE id = v_token.id;

  RETURN v_aluno;
END;
$$;

-- A tabela continua fechada ao SELECT directo: a validação é feita por RPC.
DROP POLICY IF EXISTS "tokens_validar" ON tokens_acesso;
DROP POLICY IF EXISTS "tokens_validar_via_rpc" ON tokens_acesso;
CREATE POLICY "tokens_validar_via_rpc"
  ON tokens_acesso FOR SELECT USING (false);

DROP POLICY IF EXISTS "tokens_revogar_staff" ON tokens_acesso;
CREATE POLICY "tokens_revogar_staff"
  ON tokens_acesso FOR UPDATE
  USING (aluno_id IN (SELECT id FROM alunos WHERE escola_id = ANY(escolas_do_staff())))
  WITH CHECK (aluno_id IN (SELECT id FROM alunos WHERE escola_id = ANY(escolas_do_staff())));

-- Compatibilidade com clientes antigos: deixa de criar encarregados anónimos.
CREATE OR REPLACE FUNCTION validar_e_vincular_token(p_codigo TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN activar_conta_por_token(p_codigo, 'encarregado', NULL, NULL);
END;
$$;

SELECT 'Fluxo de convite v2 preparado' AS status;
