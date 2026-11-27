-- KULONGA — Assiduidade escolar v1
-- Migração incremental: executar depois do schema principal.
-- Não reutiliza notas.tipo = frequencia: MAC continua a ser uma nota pedagógica.

CREATE TABLE IF NOT EXISTS assiduidade_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
  data_sessao DATE NOT NULL,
  inicio TIME,
  fim TIME,
  observacao TEXT,
  criado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (turma_id, disciplina_id, data_sessao, inicio)
);

CREATE TABLE IF NOT EXISTS assiduidade_registos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES assiduidade_sessoes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente', 'atrasado', 'justificado')),
  minutos_atraso SMALLINT CHECK (minutos_atraso IS NULL OR minutos_atraso >= 0),
  justificacao TEXT,
  observacao TEXT,
  registado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  registado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_assiduidade_sessoes_turma_data
  ON assiduidade_sessoes(turma_id, data_sessao DESC);
CREATE INDEX IF NOT EXISTS idx_assiduidade_registos_aluno
  ON assiduidade_registos(aluno_id, actualizado_em DESC);

ALTER TABLE assiduidade_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assiduidade_registos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assiduidade_sessoes_staff" ON assiduidade_sessoes;
CREATE POLICY "assiduidade_sessoes_staff" ON assiduidade_sessoes
  FOR ALL USING (turma_id IN (
    SELECT t.id FROM turmas t WHERE t.escola_id = ANY(escolas_do_staff())
  ));

DROP POLICY IF EXISTS "assiduidade_registos_staff" ON assiduidade_registos;
CREATE POLICY "assiduidade_registos_staff" ON assiduidade_registos
  FOR ALL USING (sessao_id IN (
    SELECT s.id FROM assiduidade_sessoes s
    JOIN turmas t ON t.id = s.turma_id
    WHERE t.escola_id = ANY(escolas_do_staff())
  ));

DROP POLICY IF EXISTS "assiduidade_sessoes_encarregado" ON assiduidade_sessoes;
CREATE POLICY "assiduidade_sessoes_encarregado" ON assiduidade_sessoes
  FOR SELECT USING (id IN (
    SELECT r.sessao_id FROM assiduidade_registos r
    WHERE r.aluno_id = ANY(alunos_do_encarregado())
  ));

DROP POLICY IF EXISTS "assiduidade_registos_encarregado" ON assiduidade_registos;
CREATE POLICY "assiduidade_registos_encarregado" ON assiduidade_registos
  FOR SELECT USING (aluno_id = ANY(alunos_do_encarregado()));

DROP POLICY IF EXISTS "assiduidade_registos_aluno" ON assiduidade_registos;
CREATE POLICY "assiduidade_registos_aluno" ON assiduidade_registos
  FOR SELECT USING (aluno_id IN (
    SELECT a.id FROM alunos a WHERE a.user_id = auth.uid()
  ));

COMMENT ON TABLE assiduidade_sessoes IS 'Sessões reais de aula para presença; não confundir com MAC.';
COMMENT ON TABLE assiduidade_registos IS 'Estado individual do aluno numa sessão: presente, ausente, atrasado ou justificado.';
