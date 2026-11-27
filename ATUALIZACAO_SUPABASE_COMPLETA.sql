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
