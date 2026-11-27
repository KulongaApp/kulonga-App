-- KULONGA — MIGRAÇÃO SUPABASE COMPLETA DE PRODUÇÃO
-- Executar este ficheiro inteiro uma única vez no Supabase SQL Editor.
-- É idempotente: as policies são removidas antes de serem recriadas.
-- Usa gen_random_uuid() e md5(), compatíveis com o schema actual.
-- NÃO inclui LIMPAR_TOKENS_TESTE.sql.
-- Gerado em 17/10/2026.

-- ================================================================
-- 01 — actualização base e funcionalidades: ATUALIZACAO_SUPABASE_COMPLETA.sql
-- ================================================================
-- ================================================================
-- KULONGA — ACTUALIZAÇÃO COMPLETA DO SUPABASE
-- Compatível com a base existente enviada pelo utilizador.
-- Não apaga tabelas nem dados. Executar este ficheiro inteiro uma vez.
-- ================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Colunas que podem faltar em instalações anteriores
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS ano_lectivo TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'encarregado';
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS usado_em TIMESTAMPTZ;
ALTER TABLE public.tokens_acesso ADD COLUMN IF NOT EXISTS usado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Validar o tipo dos tokens sem interromper instalações que já têm dados.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tokens_acesso_tipo_check') THEN
    ALTER TABLE public.tokens_acesso ADD CONSTRAINT tokens_acesso_tipo_check CHECK (tipo IN ('aluno', 'encarregado'));
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Preencher ano lectivo apenas onde está vazio.
UPDATE public.escolas
SET ano_lectivo = CASE
  WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '/' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT
  ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
END
WHERE ano_lectivo IS NULL OR trim(ano_lectivo) = '';

-- 2. Tabelas de funcionalidades novas (seguro se já existirem)
CREATE TABLE IF NOT EXISTS public.assiduidade_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  data_sessao DATE NOT NULL,
  inicio TIME,
  fim TIME,
  observacao TEXT,
  criado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (turma_id, disciplina_id, data_sessao, inicio)
);

CREATE TABLE IF NOT EXISTS public.assiduidade_registos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES public.assiduidade_sessoes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('presente','ausente','atrasado','justificado')),
  minutos_atraso SMALLINT CHECK (minutos_atraso IS NULL OR minutos_atraso >= 0),
  justificacao TEXT,
  observacao TEXT,
  registado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  registado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS public.trabalhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE RESTRICT,
  titulo TEXT NOT NULL CHECK (char_length(trim(titulo)) BETWEEN 2 AND 160),
  descricao TEXT NOT NULL DEFAULT '',
  prazo TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.entregas_trabalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabalho_id UUID NOT NULL REFERENCES public.trabalhos(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  resposta TEXT,
  ficheiro_url TEXT,
  estado TEXT NOT NULL DEFAULT 'entregue' CHECK (estado IN ('rascunho','entregue','corrigido','devolvido')),
  nota NUMERIC(4,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20)),
  feedback TEXT,
  entregue_em TIMESTAMPTZ,
  corrigido_em TIMESTAMPTZ,
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  autor_papel TEXT NOT NULL CHECK (autor_papel IN ('secretaria','professor')),
  titulo TEXT NOT NULL CHECK (char_length(trim(titulo)) BETWEEN 2 AND 160),
  mensagem TEXT NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 2 AND 5000),
  publico TEXT NOT NULL CHECK (publico IN ('escola','turma','professores','alunos','encarregados')),
  publicado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  utilizador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('trabalho','entrega','feedback','aviso','assiduidade','sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  rota TEXT,
  entidade_id UUID,
  lida_em TIMESTAMPTZ,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedupe_key TEXT UNIQUE
);

-- A versão exportada do Supabase não tinha esta restrição, mas o frontend usa upsert.
CREATE UNIQUE INDEX IF NOT EXISTS entregas_trabalho_aluno_unq
  ON public.entregas_trabalho(trabalho_id, aluno_id);

CREATE INDEX IF NOT EXISTS idx_escolas_ano_lectivo ON public.escolas(ano_lectivo);
CREATE INDEX IF NOT EXISTS idx_tokens_acesso_codigo_activo ON public.tokens_acesso(codigo) WHERE ativo = true;

-- Conserva apenas o convite de aluno activo mais recente por aluno.
-- Convites de encarregado não são afectados: podem existir vários por família.
WITH duplicados AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY aluno_id ORDER BY criado_em DESC NULLS LAST, id DESC) AS ordem
  FROM public.tokens_acesso
  WHERE ativo = true AND tipo = 'aluno'
)
UPDATE public.tokens_acesso t SET ativo = false
FROM duplicados d WHERE t.id = d.id AND d.ordem > 1;

CREATE UNIQUE INDEX IF NOT EXISTS tokens_acesso_aluno_activo_unq
  ON public.tokens_acesso(aluno_id) WHERE ativo = true AND tipo = 'aluno';
CREATE INDEX IF NOT EXISTS idx_assiduidade_sessoes_turma_data ON public.assiduidade_sessoes(turma_id, data_sessao DESC);
CREATE INDEX IF NOT EXISTS idx_assiduidade_registos_aluno ON public.assiduidade_registos(aluno_id, actualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_trabalhos_turma_prazo ON public.trabalhos(turma_id, prazo);
CREATE INDEX IF NOT EXISTS idx_entregas_aluno ON public.entregas_trabalho(aluno_id, actualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON public.notificacoes(utilizador_id, lida_em, criada_em DESC);

-- 3. Funções auxiliares usadas pelas políticas RLS
CREATE OR REPLACE FUNCTION public.escolas_do_staff()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::UUID[])
  FROM public.professores WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.alunos_do_encarregado()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(ea.aluno_id), ARRAY[]::UUID[])
  FROM public.encarregado_aluno ea
  JOIN public.encarregados e ON e.id = ea.encarregado_id
  WHERE e.user_id = auth.uid();
$$;

-- 4. Fluxo de cadastro da escola/professor
CREATE OR REPLACE FUNCTION public.registar_escola(
  p_nome text, p_provincia text, p_municipio text, p_endereco text,
  p_telefone text, p_email text, p_direccao_nome text, p_direccao_telefone text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_escola uuid; v_user uuid := auth.uid(); v_ano text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  v_ano := CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '/' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::text END;
  INSERT INTO public.escolas(nome, provincia, municipio, endereco, telefone, email, ano_lectivo, direccao_nome, direccao_telefone)
  VALUES (p_nome, p_provincia, p_municipio, p_endereco, p_telefone, p_email, v_ano, p_direccao_nome, p_direccao_telefone)
  RETURNING id INTO v_escola;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo)
  VALUES (v_user, v_escola, p_direccao_nome, p_email, p_direccao_telefone, NULL, true);
  RETURN v_escola;
END;
$$;

CREATE OR REPLACE FUNCTION public.registar_professor(
  p_escola_id uuid, p_nome text, p_email text, p_telefone text, p_disciplinas text[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo)
  VALUES (v_user, p_escola_id, p_nome, p_email, p_telefone, p_disciplinas, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 5. Convites aluno/encarregado
CREATE OR REPLACE FUNCTION public.validar_token_acesso(p_codigo TEXT, p_tipo TEXT)
RETURNS TABLE(aluno_id UUID, nome_aluno TEXT, escola_id UUID)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.nome_completo, a.escola_id FROM public.tokens_acesso t
  JOIN public.alunos a ON a.id = t.aluno_id
  WHERE t.codigo = upper(trim(p_codigo)) AND t.tipo = p_tipo AND t.ativo = true
    AND t.usado_em IS NULL AND (t.expira_em IS NULL OR t.expira_em > now()) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.activar_conta_por_token(
  p_codigo TEXT, p_tipo TEXT, p_email TEXT, p_nome TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_token public.tokens_acesso%ROWTYPE; v_enc UUID; v_aluno UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'É necessário criar a conta antes de activar o convite'; END IF;
  SELECT * INTO v_token FROM public.tokens_acesso
  WHERE codigo = upper(trim(p_codigo)) AND tipo = p_tipo AND ativo = true AND usado_em IS NULL
    AND (expira_em IS NULL OR expira_em > now()) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido, expirado ou já utilizado'; END IF;
  v_aluno := v_token.aluno_id;
  IF p_tipo = 'aluno' THEN
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
  UPDATE public.tokens_acesso SET ativo = false, usado_em = now(), usado_por = v_user WHERE id = v_token.id;
  RETURN v_aluno;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_e_vincular_token(p_codigo TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN public.activar_conta_por_token(p_codigo, 'encarregado', NULL, NULL); END;
$$;

-- 6. RLS: activar nas tabelas existentes e novas
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplina_professor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encarregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encarregado_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assiduidade_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assiduidade_registos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Remover apenas as políticas com nomes usados por esta aplicação e recriá-las.
DROP POLICY IF EXISTS escolas_listar ON public.escolas;
DROP POLICY IF EXISTS escolas_staff ON public.escolas;
CREATE POLICY escolas_listar ON public.escolas FOR SELECT USING (true);
CREATE POLICY escolas_staff ON public.escolas FOR ALL USING (id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS professores_ver_propria_linha ON public.professores;
DROP POLICY IF EXISTS professores_staff ON public.professores;
CREATE POLICY professores_ver_propria_linha ON public.professores FOR SELECT USING (user_id = auth.uid());
CREATE POLICY professores_staff ON public.professores FOR ALL USING (user_id = auth.uid() OR escola_id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS alunos_staff ON public.alunos;
CREATE POLICY alunos_staff ON public.alunos FOR ALL USING (escola_id = ANY(public.escolas_do_staff()) OR id = ANY(public.alunos_do_encarregado()) OR user_id = auth.uid());

DROP POLICY IF EXISTS turmas_staff ON public.turmas;
CREATE POLICY turmas_staff ON public.turmas FOR ALL USING (
  escola_id = ANY(public.escolas_do_staff()) OR id IN (SELECT turma_id FROM public.disciplina_professor WHERE professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS disciplinas_staff ON public.disciplinas;
CREATE POLICY disciplinas_staff ON public.disciplinas FOR ALL USING (escola_id = ANY(public.escolas_do_staff()));
DROP POLICY IF EXISTS turma_alunos_staff ON public.turma_alunos;
CREATE POLICY turma_alunos_staff ON public.turma_alunos FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())) OR aluno_id = ANY(public.alunos_do_encarregado()));
DROP POLICY IF EXISTS turma_disciplinas_staff ON public.turma_disciplinas;
CREATE POLICY turma_disciplinas_staff ON public.turma_disciplinas FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
DROP POLICY IF EXISTS disciplina_professor_staff ON public.disciplina_professor;
CREATE POLICY disciplina_professor_staff ON public.disciplina_professor FOR ALL USING (disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS notas_staff ON public.notas;
CREATE POLICY notas_staff ON public.notas FOR SELECT USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())) OR aluno_id = ANY(public.alunos_do_encarregado()) OR aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS notas_inserir ON public.notas;
CREATE POLICY notas_inserir ON public.notas FOR INSERT WITH CHECK (autor_id = auth.uid() AND turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
DROP POLICY IF EXISTS notas_actualizar ON public.notas;
CREATE POLICY notas_actualizar ON public.notas FOR UPDATE USING (autor_id = auth.uid());

DROP POLICY IF EXISTS encarregados_ver_propria_linha ON public.encarregados;
DROP POLICY IF EXISTS encarregados_staff ON public.encarregados;
DROP POLICY IF EXISTS encarregados_proprio ON public.encarregados;
CREATE POLICY encarregados_proprio ON public.encarregados FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS encarregado_aluno_staff ON public.encarregado_aluno;
CREATE POLICY encarregado_aluno_staff ON public.encarregado_aluno FOR ALL USING (encarregado_id IN (SELECT id FROM public.encarregados WHERE user_id = auth.uid()) OR aluno_id = ANY(public.alunos_do_encarregado()));

DROP POLICY IF EXISTS tokens_validar ON public.tokens_acesso;
DROP POLICY IF EXISTS tokens_validar_via_rpc ON public.tokens_acesso;
DROP POLICY IF EXISTS tokens_gerar ON public.tokens_acesso;
DROP POLICY IF EXISTS tokens_revogar_staff ON public.tokens_acesso;
CREATE POLICY tokens_validar_via_rpc ON public.tokens_acesso FOR SELECT USING (false);
CREATE POLICY tokens_gerar ON public.tokens_acesso FOR INSERT WITH CHECK (gerado_por = auth.uid() AND aluno_id IN (SELECT id FROM public.alunos WHERE escola_id = ANY(public.escolas_do_staff())));
CREATE POLICY tokens_revogar_staff ON public.tokens_acesso FOR UPDATE USING (aluno_id IN (SELECT id FROM public.alunos WHERE escola_id = ANY(public.escolas_do_staff()))) WITH CHECK (aluno_id IN (SELECT id FROM public.alunos WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS notas_pendentes_ver ON public.notas_pendentes;
DROP POLICY IF EXISTS notas_pendentes_criar ON public.notas_pendentes;
DROP POLICY IF EXISTS notas_pendentes_actualizar ON public.notas_pendentes;
CREATE POLICY notas_pendentes_ver ON public.notas_pendentes FOR SELECT USING (autor_id = auth.uid());
CREATE POLICY notas_pendentes_criar ON public.notas_pendentes FOR INSERT WITH CHECK (autor_id = auth.uid());
CREATE POLICY notas_pendentes_actualizar ON public.notas_pendentes FOR UPDATE USING (autor_id = auth.uid());

-- Assiduidade
CREATE OR REPLACE FUNCTION public.sessoes_assiduidade_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT r.sessao_id), ARRAY[]::uuid[])
  FROM public.assiduidade_registos r
  WHERE r.aluno_id = ANY(public.alunos_do_encarregado())
     OR r.aluno_id IN (SELECT a.id FROM public.alunos a WHERE a.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.sessoes_assiduidade_do_utilizador() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sessoes_assiduidade_do_utilizador() TO authenticated;
DROP POLICY IF EXISTS assiduidade_sessoes_staff ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_staff ON public.assiduidade_sessoes FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))) WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
DROP POLICY IF EXISTS assiduidade_registos_staff ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_staff ON public.assiduidade_registos FOR ALL USING (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s JOIN public.turmas t ON t.id = s.turma_id WHERE t.escola_id = ANY(public.escolas_do_staff()))) WITH CHECK (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s JOIN public.turmas t ON t.id = s.turma_id WHERE t.escola_id = ANY(public.escolas_do_staff())));
DROP POLICY IF EXISTS assiduidade_sessoes_encarregado ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_encarregado ON public.assiduidade_sessoes FOR SELECT USING (id = ANY(public.sessoes_assiduidade_do_utilizador()));
DROP POLICY IF EXISTS assiduidade_registos_encarregado ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_encarregado ON public.assiduidade_registos FOR SELECT USING (aluno_id = ANY(public.alunos_do_encarregado()));
DROP POLICY IF EXISTS assiduidade_registos_aluno ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_aluno ON public.assiduidade_registos FOR SELECT USING (aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()));

-- Trabalhos e entregas
DROP POLICY IF EXISTS trabalhos_escola_staff ON public.trabalhos;
CREATE POLICY trabalhos_escola_staff ON public.trabalhos FOR SELECT USING (escola_id = ANY(public.escolas_do_staff()) OR turma_id IN (SELECT turma_id FROM public.disciplina_professor WHERE professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS trabalhos_professor_criar ON public.trabalhos;
CREATE POLICY trabalhos_professor_criar ON public.trabalhos FOR INSERT WITH CHECK (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND escola_id = ANY(public.escolas_do_staff()));
DROP POLICY IF EXISTS trabalhos_professor_editar ON public.trabalhos;
CREATE POLICY trabalhos_professor_editar ON public.trabalhos FOR UPDATE USING (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) OR escola_id = ANY(public.escolas_do_staff()));
DROP POLICY IF EXISTS trabalhos_aluno_encarregado ON public.trabalhos;
CREATE POLICY trabalhos_aluno_encarregado ON public.trabalhos FOR SELECT USING (turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id = ANY(public.alunos_do_encarregado())) OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS entregas_staff ON public.entregas_trabalho;
CREATE POLICY entregas_staff ON public.entregas_trabalho FOR SELECT USING (trabalho_id IN (SELECT id FROM public.trabalhos WHERE escola_id = ANY(public.escolas_do_staff())));
DROP POLICY IF EXISTS entregas_aluno_ler ON public.entregas_trabalho;
CREATE POLICY entregas_aluno_ler ON public.entregas_trabalho FOR SELECT USING (aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()) OR aluno_id = ANY(public.alunos_do_encarregado()));
DROP POLICY IF EXISTS entregas_aluno_gravar ON public.entregas_trabalho;
CREATE POLICY entregas_aluno_gravar ON public.entregas_trabalho FOR INSERT WITH CHECK (aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS entregas_aluno_actualizar ON public.entregas_trabalho;
CREATE POLICY entregas_aluno_actualizar ON public.entregas_trabalho FOR UPDATE USING (aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS entregas_professor_corrigir ON public.entregas_trabalho;
CREATE POLICY entregas_professor_corrigir ON public.entregas_trabalho FOR UPDATE USING (trabalho_id IN (SELECT id FROM public.trabalhos WHERE professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) OR escola_id = ANY(public.escolas_do_staff())));

-- Avisos e notificações
DROP POLICY IF EXISTS avisos_ler ON public.avisos;
CREATE POLICY avisos_ler ON public.avisos FOR SELECT USING (
  (escola_id = ANY(public.escolas_do_staff()) AND publico IN ('escola','professores'))
  OR (escola_id IN (SELECT escola_id FROM public.alunos WHERE user_id = auth.uid()) AND publico IN ('escola','alunos') AND (turma_id IS NULL OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()))))
  OR (escola_id IN (SELECT a.escola_id FROM public.alunos a WHERE a.id = ANY(public.alunos_do_encarregado())) AND publico IN ('escola','encarregados') AND (turma_id IS NULL OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id = ANY(public.alunos_do_encarregado()))))
);
DROP POLICY IF EXISTS avisos_staff_criar ON public.avisos;
CREATE POLICY avisos_staff_criar ON public.avisos FOR INSERT WITH CHECK (autor_id = auth.uid() AND escola_id = ANY(public.escolas_do_staff()));
DROP POLICY IF EXISTS avisos_autor_editar ON public.avisos;
CREATE POLICY avisos_autor_editar ON public.avisos FOR UPDATE USING (autor_id = auth.uid() OR escola_id = ANY(public.escolas_do_staff()));
DROP POLICY IF EXISTS notificacoes_proprias ON public.notificacoes;
CREATE POLICY notificacoes_proprias ON public.notificacoes FOR SELECT USING (utilizador_id = auth.uid());
DROP POLICY IF EXISTS notificacoes_marcar_lidas ON public.notificacoes;
CREATE POLICY notificacoes_marcar_lidas ON public.notificacoes FOR UPDATE USING (utilizador_id = auth.uid()) WITH CHECK (utilizador_id = auth.uid());

-- 7. Notificações automáticas
CREATE OR REPLACE FUNCTION public.emitir_notificacoes_trabalho()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aluno RECORD;
BEGIN
  FOR aluno IN SELECT a.user_id FROM public.turma_alunos ta JOIN public.alunos a ON a.id = ta.aluno_id WHERE ta.turma_id = NEW.turma_id AND a.user_id IS NOT NULL LOOP
    INSERT INTO public.notificacoes(escola_id, utilizador_id, tipo, titulo, mensagem, rota, entidade_id, dedupe_key)
    VALUES (NEW.escola_id, aluno.user_id, 'trabalho', 'Novo trabalho: ' || NEW.titulo, 'Foi publicado um novo trabalho para a tua turma.', '/(aluno)/trabalhos', NEW.id, 'trabalho:' || NEW.id || ':aluno:' || aluno.user_id)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.emitir_notificacoes_aviso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE destinatario RECORD;
BEGIN
  FOR destinatario IN
    SELECT DISTINCT a.user_id FROM public.alunos a WHERE a.escola_id = NEW.escola_id AND a.user_id IS NOT NULL AND NEW.publico IN ('escola','alunos') AND (NEW.turma_id IS NULL OR a.id IN (SELECT aluno_id FROM public.turma_alunos WHERE turma_id = NEW.turma_id))
    UNION SELECT DISTINCT e.user_id FROM public.encarregados e JOIN public.encarregado_aluno ea ON ea.encarregado_id = e.id JOIN public.alunos a ON a.id = ea.aluno_id WHERE a.escola_id = NEW.escola_id AND e.user_id IS NOT NULL AND NEW.publico IN ('escola','encarregados') AND (NEW.turma_id IS NULL OR a.id IN (SELECT aluno_id FROM public.turma_alunos WHERE turma_id = NEW.turma_id))
    UNION SELECT DISTINCT p.user_id FROM public.professores p WHERE p.escola_id = NEW.escola_id AND p.user_id IS NOT NULL AND NEW.publico IN ('escola','professores')
  LOOP
    INSERT INTO public.notificacoes(escola_id, utilizador_id, tipo, titulo, mensagem, rota, entidade_id, dedupe_key)
    VALUES (NEW.escola_id, destinatario.user_id, 'aviso', NEW.titulo, NEW.mensagem, '/avisos', NEW.id, 'aviso:' || NEW.id || ':user:' || destinatario.user_id)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificar_trabalho ON public.trabalhos;
CREATE TRIGGER trigger_notificar_trabalho AFTER INSERT ON public.trabalhos FOR EACH ROW EXECUTE FUNCTION public.emitir_notificacoes_trabalho();
DROP TRIGGER IF EXISTS trigger_notificar_aviso ON public.avisos;
CREATE TRIGGER trigger_notificar_aviso AFTER INSERT ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.emitir_notificacoes_aviso();

-- 8. Storage privado para anexos de trabalhos
INSERT INTO storage.buckets(id, name, public) VALUES ('trabalhos-entregas', 'trabalhos-entregas', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS entregas_upload_aluno ON storage.objects;
CREATE POLICY entregas_upload_aluno ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'trabalhos-entregas' AND auth.role() = 'authenticated'
  AND split_part(name, '/', 3) ~* '^[0-9a-f-]{36}$' AND split_part(name, '/', 3)::uuid = auth.uid()
);
DROP POLICY IF EXISTS entregas_ler_autorizado ON storage.objects;
CREATE POLICY entregas_ler_autorizado ON storage.objects FOR SELECT USING (
  bucket_id = 'trabalhos-entregas' AND auth.role() = 'authenticated'
  AND split_part(name, '/', 3) ~* '^[0-9a-f-]{36}$'
  AND (split_part(name, '/', 1)::uuid = ANY(public.escolas_do_staff()) OR split_part(name, '/', 3)::uuid = auth.uid())
);

COMMIT;

NOTIFY pgrst, 'reload schema';
SELECT 'KULONGA: actualização completa concluída' AS resultado;


-- ================================================================
-- 02 — correcção RLS de encarregados: FIX_RLS_ENCARREGADOS.sql
-- ================================================================
-- KULONGA — correcção da política RLS de encarregados
-- Corrige a recursão infinita causada por uma policy de encarregados
-- que consultava alunos_do_encarregado(), que por sua vez consultava encarregados.

BEGIN;

-- O acesso ao próprio perfil já é suficiente para o fluxo do encarregado.
-- A associação encarregado_aluno continua protegida pela sua própria policy.
DROP POLICY IF EXISTS encarregados_staff ON public.encarregados;
DROP POLICY IF EXISTS encarregados_ver_propria_linha ON public.encarregados;
DROP POLICY IF EXISTS encarregados_proprio ON public.encarregados;

CREATE POLICY encarregados_proprio
  ON public.encarregados
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Teste opcional, autenticado como encarregado:
-- SELECT id, nome FROM public.encarregados WHERE user_id = auth.uid();


-- ================================================================
-- 03 — correcção RLS de assiduidade: FIX_RLS_ASSIDUIDADE.sql
-- ================================================================
-- KULONGA — correcção RLS da assiduidade
-- Evita a recursão entre assiduidade_sessoes e assiduidade_registos.

BEGIN;

CREATE OR REPLACE FUNCTION public.sessoes_assiduidade_do_utilizador()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT r.sessao_id), ARRAY[]::uuid[])
  FROM public.assiduidade_registos r
  WHERE r.aluno_id = ANY(public.alunos_do_encarregado())
     OR r.aluno_id IN (
       SELECT a.id
       FROM public.alunos a
       WHERE a.user_id = auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION public.sessoes_assiduidade_do_utilizador() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sessoes_assiduidade_do_utilizador() TO authenticated;

DROP POLICY IF EXISTS assiduidade_sessoes_staff ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_staff
  ON public.assiduidade_sessoes
  FOR ALL
  USING (
    turma_id IN (
      SELECT t.id
      FROM public.turmas t
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  )
  WITH CHECK (
    turma_id IN (
      SELECT t.id
      FROM public.turmas t
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  );

DROP POLICY IF EXISTS assiduidade_registos_staff ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_staff
  ON public.assiduidade_registos
  FOR ALL
  USING (
    sessao_id IN (
      SELECT s.id
      FROM public.assiduidade_sessoes s
      JOIN public.turmas t ON t.id = s.turma_id
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  )
  WITH CHECK (
    sessao_id IN (
      SELECT s.id
      FROM public.assiduidade_sessoes s
      JOIN public.turmas t ON t.id = s.turma_id
      WHERE t.escola_id = ANY(public.escolas_do_staff())
    )
  );

DROP POLICY IF EXISTS assiduidade_sessoes_encarregado ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_encarregado
  ON public.assiduidade_sessoes
  FOR SELECT
  USING (id = ANY(public.sessoes_assiduidade_do_utilizador()));

DROP POLICY IF EXISTS assiduidade_registos_encarregado ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_encarregado
  ON public.assiduidade_registos
  FOR SELECT
  USING (aluno_id = ANY(public.alunos_do_encarregado()));

DROP POLICY IF EXISTS assiduidade_registos_aluno ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_aluno
  ON public.assiduidade_registos
  FOR SELECT
  USING (
    aluno_id IN (
      SELECT a.id
      FROM public.alunos a
      WHERE a.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;


-- ================================================================
-- 04 — pré-requisito persistente de papéis
-- ================================================================
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'professor';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'professores_papel_check') THEN ALTER TABLE public.professores ADD CONSTRAINT professores_papel_check CHECK (papel IN ('secretaria','professor')); END IF; END $$;

-- ================================================================
-- 05 — produção: convites, expiração, rate limit e Storage: HARDENING_PRODUCAO_CONVITES_UPLOADS.sql
-- ================================================================
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


-- ================================================================
-- 06 — RPC segura de tokens com UUID aleatório: FIX_RPC_TOKENS_ACESSO.sql
-- ================================================================
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


-- ================================================================
-- 07 — separação secretaria/professor: HARDENING_RLS_PAPEIS.sql
-- ================================================================
-- KULONGA — endurecimento P0 de autorização por papel e turma
-- Professor: vê as turmas/disciplinas atribuídas e edita notas, trabalhos
-- e assiduidade dessas turmas. Secretaria mantém gestão administrativa.
-- Executar no Supabase SQL Editor como administrador.

BEGIN;

ALTER TABLE public.professores
  ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'professor';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'professores_papel_check'
  ) THEN
    ALTER TABLE public.professores
      ADD CONSTRAINT professores_papel_check
      CHECK (papel IN ('secretaria', 'professor'));
  END IF;
END $$;

-- Migração inicial: conserva as contas de secretaria já criadas pelo fluxo actual.
-- Depois desta migração, o papel persistente e as policies deixam de depender
-- de user_metadata enviado pelo cliente.
UPDATE public.professores p
SET papel = 'secretaria'
FROM auth.users u
WHERE u.id = p.user_id
  AND (
    u.raw_user_meta_data ->> 'papel' = 'secretaria'
    OR (u.raw_user_meta_data -> 'papeis') ? 'secretaria'
  );

CREATE OR REPLACE FUNCTION public.escolas_do_staff()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM public.professores
  WHERE user_id = auth.uid()
    AND activo = true
    AND papel = 'secretaria';
$$;

CREATE OR REPLACE FUNCTION public.escolas_do_utilizador()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM public.professores
  WHERE user_id = auth.uid() AND activo = true;
$$;

CREATE OR REPLACE FUNCTION public.turmas_do_professor()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT dp.turma_id), ARRAY[]::uuid[])
  FROM public.disciplina_professor dp
  JOIN public.professores p ON p.id = dp.professor_id
  WHERE p.user_id = auth.uid() AND p.activo = true AND p.papel = 'professor';
$$;

CREATE OR REPLACE FUNCTION public.professor_atribuido(
  p_turma_id uuid,
  p_disciplina_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.disciplina_professor dp
    JOIN public.professores p ON p.id = dp.professor_id
    WHERE p.user_id = auth.uid()
      AND p.activo = true
      AND p.papel = 'professor'
      AND dp.turma_id = p_turma_id
      AND (p_disciplina_id IS NULL OR dp.disciplina_id = p_disciplina_id)
  );
$$;

REVOKE ALL ON FUNCTION public.escolas_do_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.turmas_do_professor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.professor_atribuido(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escolas_do_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.turmas_do_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.professor_atribuido(uuid, uuid) TO authenticated;

-- As novas escolas começam com um utilizador de secretaria.
CREATE OR REPLACE FUNCTION public.registar_escola(
  p_nome text, p_provincia text, p_municipio text, p_endereco text,
  p_telefone text, p_email text, p_direccao_nome text, p_direccao_telefone text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_escola uuid; v_user uuid := auth.uid(); v_ano text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  IF EXISTS (SELECT 1 FROM public.professores WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'O utilizador já está associado a uma escola';
  END IF;
  v_ano := CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '/' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::text END;
  INSERT INTO public.escolas(nome, provincia, municipio, endereco, telefone, email, ano_lectivo, direccao_nome, direccao_telefone)
  VALUES (trim(p_nome), trim(p_provincia), nullif(trim(p_municipio), ''), nullif(trim(p_endereco), ''), nullif(trim(p_telefone), ''), lower(trim(p_email)), v_ano, trim(p_direccao_nome), nullif(trim(p_direccao_telefone), ''))
  RETURNING id INTO v_escola;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
  VALUES (v_user, v_escola, trim(p_direccao_nome), lower(trim(p_email)), nullif(trim(p_direccao_telefone), ''), NULL, true, 'secretaria');
  RETURN v_escola;
END;
$$;

CREATE OR REPLACE FUNCTION public.registar_professor(
  p_escola_id uuid, p_nome text, p_email text, p_telefone text, p_disciplinas text[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professores
    WHERE user_id = v_user AND escola_id = p_escola_id
      AND activo = true AND papel = 'secretaria'
  ) THEN
    RAISE EXCEPTION 'Apenas a secretaria da escola pode registar professores';
  END IF;
  INSERT INTO public.professores(user_id, escola_id, nome, email, telefone, disciplinas, activo, papel)
  VALUES (NULL, p_escola_id, trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), p_disciplinas, true, 'professor')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_escola(text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registar_professor(uuid,text,text,text,text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registar_escola(text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registar_professor(uuid,text,text,text,text[]) TO authenticated;

-- Professores: apenas a secretaria gere o cadastro completo.
DROP POLICY IF EXISTS professores_proprio_select ON public.professores;
DROP POLICY IF EXISTS professores_secretaria_all ON public.professores;
DROP POLICY IF EXISTS professores_ver_propria_linha ON public.professores;
DROP POLICY IF EXISTS professores_staff ON public.professores;
CREATE POLICY professores_proprio_select ON public.professores
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY professores_secretaria_all ON public.professores
  FOR ALL
  USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

-- Alunos: professores só vêem alunos das turmas atribuídas.
DROP POLICY IF EXISTS alunos_select_autorizado ON public.alunos;
DROP POLICY IF EXISTS alunos_secretaria_all ON public.alunos;
DROP POLICY IF EXISTS alunos_staff ON public.alunos;
CREATE POLICY alunos_select_autorizado ON public.alunos
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id = ANY(public.alunos_do_encarregado())
    OR user_id = auth.uid()
    OR id IN (
      SELECT ta.aluno_id FROM public.turma_alunos ta
      WHERE ta.turma_id = ANY(public.turmas_do_professor())
    )
  );
CREATE POLICY alunos_secretaria_all ON public.alunos
  FOR ALL
  USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

-- Estrutura académica: professores consultam apenas atribuições; secretaria gere.
DROP POLICY IF EXISTS turmas_select_autorizado ON public.turmas;
DROP POLICY IF EXISTS turmas_secretaria_all ON public.turmas;
DROP POLICY IF EXISTS turmas_staff ON public.turmas;
CREATE POLICY turmas_select_autorizado ON public.turmas
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id = ANY(public.turmas_do_professor())
  );
CREATE POLICY turmas_secretaria_all ON public.turmas
  FOR ALL USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS disciplinas_select_autorizado ON public.disciplinas;
DROP POLICY IF EXISTS disciplinas_secretaria_all ON public.disciplinas;
DROP POLICY IF EXISTS disciplinas_staff ON public.disciplinas;
CREATE POLICY disciplinas_select_autorizado ON public.disciplinas
  FOR SELECT USING (
    escola_id = ANY(public.escolas_do_staff())
    OR id IN (
      SELECT dp.disciplina_id FROM public.disciplina_professor dp
      JOIN public.professores p ON p.id = dp.professor_id
      WHERE p.user_id = auth.uid() AND p.activo = true
    )
  );
CREATE POLICY disciplinas_secretaria_all ON public.disciplinas
  FOR ALL USING (escola_id = ANY(public.escolas_do_staff()))
  WITH CHECK (escola_id = ANY(public.escolas_do_staff()));

DROP POLICY IF EXISTS turma_alunos_select_autorizado ON public.turma_alunos;
DROP POLICY IF EXISTS turma_alunos_secretaria_all ON public.turma_alunos;
DROP POLICY IF EXISTS turma_alunos_staff ON public.turma_alunos;
CREATE POLICY turma_alunos_select_autorizado ON public.turma_alunos
  FOR SELECT USING (
    turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
    OR turma_id = ANY(public.turmas_do_professor())
    OR aluno_id = ANY(public.alunos_do_encarregado())
    OR aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );
CREATE POLICY turma_alunos_secretaria_all ON public.turma_alunos
  FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS turma_disciplinas_select_autorizado ON public.turma_disciplinas;
DROP POLICY IF EXISTS turma_disciplinas_secretaria_all ON public.turma_disciplinas;
DROP POLICY IF EXISTS turma_disciplinas_staff ON public.turma_disciplinas;
CREATE POLICY turma_disciplinas_select_autorizado ON public.turma_disciplinas
  FOR SELECT USING (turma_id = ANY(public.turmas_do_professor()) OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
CREATE POLICY turma_disciplinas_secretaria_all ON public.turma_disciplinas
  FOR ALL USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));

DROP POLICY IF EXISTS disciplina_professor_select_autorizado ON public.disciplina_professor;
DROP POLICY IF EXISTS disciplina_professor_secretaria_all ON public.disciplina_professor;
DROP POLICY IF EXISTS disciplina_professor_staff ON public.disciplina_professor;
CREATE POLICY disciplina_professor_select_autorizado ON public.disciplina_professor
  FOR SELECT USING (
    professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid())
    OR disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff()))
  );
CREATE POLICY disciplina_professor_secretaria_all ON public.disciplina_professor
  FOR ALL USING (disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff())));

-- Notas: professor apenas na turma/disciplina atribuída; secretaria mantém acesso escolar.
DROP POLICY IF EXISTS notas_staff ON public.notas;
DROP POLICY IF EXISTS notas_inserir ON public.notas;
DROP POLICY IF EXISTS notas_actualizar ON public.notas;
DROP POLICY IF EXISTS notas_select_autorizado ON public.notas;
DROP POLICY IF EXISTS notas_insert_autorizado ON public.notas;
DROP POLICY IF EXISTS notas_update_autorizado ON public.notas;
CREATE POLICY notas_select_autorizado ON public.notas
  FOR SELECT USING (
    turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
    OR public.professor_atribuido(turma_id, disciplina_id)
    OR aluno_id = ANY(public.alunos_do_encarregado())
    OR aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );
CREATE POLICY notas_insert_autorizado ON public.notas
  FOR INSERT WITH CHECK (
    (
      autor_id = auth.uid()
      AND public.professor_atribuido(turma_id, disciplina_id)
    )
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  );
CREATE POLICY notas_update_autorizado ON public.notas
  FOR UPDATE
  USING (
    (autor_id = auth.uid() AND public.professor_atribuido(turma_id, disciplina_id))
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  )
  WITH CHECK (
    (autor_id = auth.uid() AND public.professor_atribuido(turma_id, disciplina_id))
    OR turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  );

-- Assiduidade: professores só trabalham nas turmas atribuídas.
DROP POLICY IF EXISTS assiduidade_sessoes_secretaria ON public.assiduidade_sessoes;
DROP POLICY IF EXISTS assiduidade_sessoes_professor ON public.assiduidade_sessoes;
DROP POLICY IF EXISTS assiduidade_sessoes_staff ON public.assiduidade_sessoes;
CREATE POLICY assiduidade_sessoes_secretaria ON public.assiduidade_sessoes FOR ALL
  USING (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())))
  WITH CHECK (turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff())));
CREATE POLICY assiduidade_sessoes_professor ON public.assiduidade_sessoes FOR ALL
  USING (turma_id = ANY(public.turmas_do_professor()))
  WITH CHECK (turma_id = ANY(public.turmas_do_professor()));

DROP POLICY IF EXISTS assiduidade_registos_secretaria ON public.assiduidade_registos;
DROP POLICY IF EXISTS assiduidade_registos_professor ON public.assiduidade_registos;
DROP POLICY IF EXISTS assiduidade_registos_staff ON public.assiduidade_registos;
CREATE POLICY assiduidade_registos_secretaria ON public.assiduidade_registos FOR ALL
  USING (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))))
  WITH CHECK (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))));
CREATE POLICY assiduidade_registos_professor ON public.assiduidade_registos FOR ALL
  USING (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id = ANY(public.turmas_do_professor())))
  WITH CHECK (sessao_id IN (SELECT s.id FROM public.assiduidade_sessoes s WHERE s.turma_id = ANY(public.turmas_do_professor())));

-- Trabalhos: professores só criam/alteram trabalhos das turmas atribuídas.
DROP POLICY IF EXISTS trabalhos_select_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_insert_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_update_autorizado ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_escola_staff ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_professor_criar ON public.trabalhos;
DROP POLICY IF EXISTS trabalhos_professor_editar ON public.trabalhos;
CREATE POLICY trabalhos_select_autorizado ON public.trabalhos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff()) OR turma_id = ANY(public.turmas_do_professor())
  OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id = ANY(public.alunos_do_encarregado()))
  OR turma_id IN (SELECT turma_id FROM public.turma_alunos WHERE aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid()))
);
CREATE POLICY trabalhos_insert_autorizado ON public.trabalhos FOR INSERT WITH CHECK (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
);
CREATE POLICY trabalhos_update_autorizado ON public.trabalhos FOR UPDATE USING (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
) WITH CHECK (
  (professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid()) AND turma_id = ANY(public.turmas_do_professor()))
  OR escola_id = ANY(public.escolas_do_staff())
);

-- Token generation is an administrative operation.
REVOKE ALL ON FUNCTION public.gerar_tokens_acesso(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_tokens_acesso(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;


-- ================================================================
-- 08 — correcção de recursões RLS: FIX_RLS_RECURSAO_PAPEIS.sql
-- ================================================================
-- KULONGA — correcção da recursão RLS após o endurecimento por papéis
-- Executar depois de HARDENING_RLS_PAPEIS.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.alunos_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(a.id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.disciplinas_do_professor()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT dp.disciplina_id), ARRAY[]::uuid[])
  FROM public.disciplina_professor dp
  JOIN public.professores p ON p.id = dp.professor_id
  WHERE p.user_id = auth.uid() AND p.activo = true AND p.papel = 'professor';
$$;

CREATE OR REPLACE FUNCTION public.turmas_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT ta.turma_id), ARRAY[]::uuid[])
  FROM public.turma_alunos ta
  WHERE ta.aluno_id = ANY(public.alunos_do_utilizador())
     OR ta.aluno_id = ANY(public.alunos_do_encarregado());
$$;

CREATE OR REPLACE FUNCTION public.escolas_dos_alunos_do_utilizador()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT a.escola_id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.id = ANY(public.alunos_do_utilizador());
$$;

CREATE OR REPLACE FUNCTION public.escolas_dos_alunos_do_encarregado()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT COALESCE(array_agg(DISTINCT a.escola_id), ARRAY[]::uuid[])
  FROM public.alunos a
  WHERE a.id = ANY(public.alunos_do_encarregado());
$$;

REVOKE ALL ON FUNCTION public.alunos_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.disciplinas_do_professor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.turmas_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_dos_alunos_do_utilizador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.escolas_dos_alunos_do_encarregado() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alunos_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disciplinas_do_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.turmas_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_dos_alunos_do_utilizador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.escolas_dos_alunos_do_encarregado() TO authenticated;

DROP POLICY IF EXISTS alunos_select_autorizado ON public.alunos;
CREATE POLICY alunos_select_autorizado ON public.alunos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR id = ANY(public.alunos_do_encarregado())
  OR id = ANY(public.alunos_do_utilizador())
  OR id IN (SELECT ta.aluno_id FROM public.turma_alunos ta WHERE ta.turma_id = ANY(public.turmas_do_professor()))
);

DROP POLICY IF EXISTS disciplinas_select_autorizado ON public.disciplinas;
CREATE POLICY disciplinas_select_autorizado ON public.disciplinas FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR id = ANY(public.disciplinas_do_professor())
);

DROP POLICY IF EXISTS turma_alunos_select_autorizado ON public.turma_alunos;
CREATE POLICY turma_alunos_select_autorizado ON public.turma_alunos FOR SELECT USING (
  turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  OR turma_id = ANY(public.turmas_do_professor())
  OR aluno_id = ANY(public.alunos_do_encarregado())
  OR aluno_id = ANY(public.alunos_do_utilizador())
);

DROP POLICY IF EXISTS disciplina_professor_select_autorizado ON public.disciplina_professor;
CREATE POLICY disciplina_professor_select_autorizado ON public.disciplina_professor FOR SELECT USING (
  professor_id IN (SELECT id FROM public.professores WHERE user_id = auth.uid())
  OR disciplina_id = ANY(public.disciplinas_do_professor())
  OR disciplina_id IN (SELECT id FROM public.disciplinas WHERE escola_id = ANY(public.escolas_do_staff()))
);

DROP POLICY IF EXISTS notas_select_autorizado ON public.notas;
CREATE POLICY notas_select_autorizado ON public.notas FOR SELECT USING (
  turma_id IN (SELECT id FROM public.turmas WHERE escola_id = ANY(public.escolas_do_staff()))
  OR public.professor_atribuido(turma_id, disciplina_id)
  OR turma_id = ANY(public.turmas_do_utilizador())
  OR aluno_id = ANY(public.alunos_do_encarregado())
  OR aluno_id = ANY(public.alunos_do_utilizador())
);

DROP POLICY IF EXISTS trabalhos_select_autorizado ON public.trabalhos;
CREATE POLICY trabalhos_select_autorizado ON public.trabalhos FOR SELECT USING (
  escola_id = ANY(public.escolas_do_staff())
  OR turma_id = ANY(public.turmas_do_professor())
  OR turma_id = ANY(public.turmas_do_utilizador())
);

DROP POLICY IF EXISTS avisos_ler ON public.avisos;
CREATE POLICY avisos_ler ON public.avisos FOR SELECT USING (
  (
    escola_id = ANY(public.escolas_do_staff())
    AND publico IN ('escola', 'professores')
  )
  OR (
    escola_id = ANY(public.escolas_dos_alunos_do_utilizador())
    AND publico IN ('escola', 'alunos')
    AND (turma_id IS NULL OR turma_id = ANY(public.turmas_do_utilizador()))
  )
  OR (
    escola_id = ANY(public.escolas_dos_alunos_do_encarregado())
    AND publico IN ('escola', 'encarregados')
    AND (turma_id IS NULL OR turma_id = ANY(public.turmas_do_utilizador()))
  )
);

NOTIFY pgrst, 'reload schema';
COMMIT;

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
