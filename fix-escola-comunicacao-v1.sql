-- KULONGA — Trabalhos, avisos e notificações v1
-- Migração incremental; executar depois do schema principal.

CREATE TABLE IF NOT EXISTS trabalhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE RESTRICT,
  titulo TEXT NOT NULL CHECK (char_length(trim(titulo)) BETWEEN 2 AND 160),
  descricao TEXT NOT NULL DEFAULT '',
  prazo TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS entregas_trabalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabalho_id UUID NOT NULL REFERENCES trabalhos(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  resposta TEXT,
  ficheiro_url TEXT,
  estado TEXT NOT NULL DEFAULT 'entregue' CHECK (estado IN ('rascunho','entregue','corrigido','devolvido')),
  nota NUMERIC(4,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20)),
  feedback TEXT,
  entregue_em TIMESTAMPTZ,
  corrigido_em TIMESTAMPTZ,
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trabalho_id, aluno_id),
  CHECK (resposta IS NOT NULL OR ficheiro_url IS NOT NULL OR estado = 'rascunho')
);

CREATE TABLE IF NOT EXISTS avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  autor_papel TEXT NOT NULL CHECK (autor_papel IN ('secretaria','professor')),
  titulo TEXT NOT NULL CHECK (char_length(trim(titulo)) BETWEEN 2 AND 160),
  mensagem TEXT NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 2 AND 5000),
  publico TEXT NOT NULL CHECK (publico IN ('escola','turma','professores','alunos','encarregados')),
  publicado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_trabalhos_turma_prazo ON trabalhos(turma_id, prazo);
CREATE INDEX IF NOT EXISTS idx_entregas_aluno ON entregas_trabalho(aluno_id, actualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_escola_publicado ON avisos(escola_id, publicado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(utilizador_id, lida_em, criada_em DESC);

ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trabalhos_escola_staff" ON trabalhos;
CREATE POLICY "trabalhos_escola_staff" ON trabalhos FOR SELECT USING (
  escola_id = ANY(escolas_do_staff()) OR turma_id IN (SELECT turma_id FROM disciplina_professor WHERE professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()))
);
DROP POLICY IF EXISTS "trabalhos_professor_criar" ON trabalhos;
CREATE POLICY "trabalhos_professor_criar" ON trabalhos FOR INSERT WITH CHECK (
  professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()) AND escola_id = ANY(escolas_do_staff())
);
DROP POLICY IF EXISTS "trabalhos_professor_editar" ON trabalhos;
CREATE POLICY "trabalhos_professor_editar" ON trabalhos FOR UPDATE USING (professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()) OR escola_id = ANY(escolas_do_staff()));
DROP POLICY IF EXISTS "trabalhos_aluno_encarregado" ON trabalhos;
CREATE POLICY "trabalhos_aluno_encarregado" ON trabalhos FOR SELECT USING (
  turma_id IN (SELECT turma_id FROM turma_alunos WHERE aluno_id = ANY(alunos_do_encarregado()))
  OR turma_id IN (SELECT turma_id FROM turma_alunos WHERE aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "entregas_staff" ON entregas_trabalho;
CREATE POLICY "entregas_staff" ON entregas_trabalho FOR SELECT USING (trabalho_id IN (SELECT id FROM trabalhos WHERE escola_id = ANY(escolas_do_staff())));
DROP POLICY IF EXISTS "entregas_aluno_ler" ON entregas_trabalho;
CREATE POLICY "entregas_aluno_ler" ON entregas_trabalho FOR SELECT USING (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()) OR aluno_id = ANY(alunos_do_encarregado()));
DROP POLICY IF EXISTS "entregas_aluno_gravar" ON entregas_trabalho;
CREATE POLICY "entregas_aluno_gravar" ON entregas_trabalho FOR INSERT WITH CHECK (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "entregas_aluno_actualizar" ON entregas_trabalho;
CREATE POLICY "entregas_aluno_actualizar" ON entregas_trabalho FOR UPDATE USING (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "entregas_professor_corrigir" ON entregas_trabalho;
CREATE POLICY "entregas_professor_corrigir" ON entregas_trabalho FOR UPDATE USING (trabalho_id IN (SELECT id FROM trabalhos WHERE professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()) OR escola_id = ANY(escolas_do_staff())));

DROP POLICY IF EXISTS "avisos_ler" ON avisos;
CREATE POLICY "avisos_ler" ON avisos FOR SELECT USING (
  (escola_id = ANY(escolas_do_staff()) AND publico IN ('escola','professores'))
  OR (escola_id IN (SELECT escola_id FROM alunos WHERE user_id = auth.uid()) AND publico IN ('escola','alunos') AND (turma_id IS NULL OR turma_id IN (SELECT turma_id FROM turma_alunos WHERE aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()))))
  OR (escola_id IN (SELECT a.escola_id FROM alunos a WHERE a.id = ANY(alunos_do_encarregado())) AND publico IN ('escola','encarregados') AND (turma_id IS NULL OR turma_id IN (SELECT turma_id FROM turma_alunos WHERE aluno_id = ANY(alunos_do_encarregado()))))
);
DROP POLICY IF EXISTS "avisos_staff_criar" ON avisos;
CREATE POLICY "avisos_staff_criar" ON avisos FOR INSERT WITH CHECK (autor_id = auth.uid() AND escola_id = ANY(escolas_do_staff()));
DROP POLICY IF EXISTS "avisos_autor_editar" ON avisos;
CREATE POLICY "avisos_autor_editar" ON avisos FOR UPDATE USING (autor_id = auth.uid() OR escola_id = ANY(escolas_do_staff()));

DROP POLICY IF EXISTS "notificacoes_proprias" ON notificacoes;
CREATE POLICY "notificacoes_proprias" ON notificacoes FOR SELECT USING (utilizador_id = auth.uid());
DROP POLICY IF EXISTS "notificacoes_marcar_lidas" ON notificacoes;
CREATE POLICY "notificacoes_marcar_lidas" ON notificacoes FOR UPDATE USING (utilizador_id = auth.uid()) WITH CHECK (utilizador_id = auth.uid());

CREATE OR REPLACE FUNCTION emitir_notificacoes_trabalho()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aluno RECORD;
BEGIN
  FOR aluno IN SELECT a.user_id FROM turma_alunos ta JOIN alunos a ON a.id = ta.aluno_id WHERE ta.turma_id = NEW.turma_id AND a.user_id IS NOT NULL LOOP
    INSERT INTO notificacoes(escola_id, utilizador_id, tipo, titulo, mensagem, rota, entidade_id, dedupe_key)
    VALUES (NEW.escola_id, aluno.user_id, 'trabalho', 'Novo trabalho: ' || NEW.titulo, 'Foi publicado um novo trabalho para a tua turma.', '/(aluno)/trabalhos', NEW.id, 'trabalho:' || NEW.id || ':aluno:' || aluno.user_id)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION emitir_notificacoes_aviso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE destinatario RECORD;
BEGIN
  FOR destinatario IN
    SELECT DISTINCT a.user_id FROM alunos a WHERE a.escola_id = NEW.escola_id AND a.user_id IS NOT NULL AND NEW.publico IN ('escola','alunos') AND (NEW.turma_id IS NULL OR a.id IN (SELECT aluno_id FROM turma_alunos WHERE turma_id = NEW.turma_id))
    UNION SELECT DISTINCT e.user_id FROM encarregados e JOIN encarregado_aluno ea ON ea.encarregado_id = e.id JOIN alunos a ON a.id = ea.aluno_id WHERE a.escola_id = NEW.escola_id AND e.user_id IS NOT NULL AND NEW.publico IN ('escola','encarregados') AND (NEW.turma_id IS NULL OR a.id IN (SELECT aluno_id FROM turma_alunos WHERE turma_id = NEW.turma_id))
    UNION SELECT DISTINCT p.user_id FROM professores p WHERE p.escola_id = NEW.escola_id AND p.user_id IS NOT NULL AND NEW.publico IN ('escola','professores')
  LOOP
    INSERT INTO notificacoes(escola_id, utilizador_id, tipo, titulo, mensagem, rota, entidade_id, dedupe_key)
    VALUES (NEW.escola_id, destinatario.user_id, 'aviso', NEW.titulo, NEW.mensagem, '/avisos', NEW.id, 'aviso:' || NEW.id || ':user:' || destinatario.user_id)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificar_trabalho ON trabalhos;
CREATE TRIGGER trigger_notificar_trabalho AFTER INSERT ON trabalhos FOR EACH ROW EXECUTE FUNCTION emitir_notificacoes_trabalho();
DROP TRIGGER IF EXISTS trigger_notificar_aviso ON avisos;
CREATE TRIGGER trigger_notificar_aviso AFTER INSERT ON avisos FOR EACH ROW EXECUTE FUNCTION emitir_notificacoes_aviso();
