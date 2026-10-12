-- ============================================================================
-- Kulonga — Fix: notas duplicadas ao guardar
-- Correr no Supabase SQL Editor.
--
-- Problema: a tabela `notas` não tem nenhuma restrição de unicidade, por isso
-- carregar duas vezes em "Guardar Notas" cria duas linhas para o mesmo
-- (aluno, disciplina, trimestre, tipo). A VIEW notas_vigentes esconde o
-- sintoma (mostra só a mais recente), mas os dados ficam inflacionados e as
-- estatísticas de "notas lançadas" ficam erradas.
--
-- Solução: índice único por autor. A chave inclui `autor_papel` porque a VIEW
-- `notas_vigentes` dá prioridade a secretaria > coordenador > professor — ou
-- seja, é legítimo existir uma linha do professor e outra do coordenador para
-- a mesma nota.
--
-- Depois de correr isto, o app passa a usar upsert e re-lançar actualiza.
-- ============================================================================

-- 1) Remover duplicados já existentes (mantém a linha mais recente de cada grupo)
WITH duplicados AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY aluno_id, disciplina_id, trimestre, tipo, autor_papel
           ORDER BY COALESCE(actualizado_em, lancado_em) DESC NULLS LAST, id DESC
         ) AS rn
  FROM notas
)
DELETE FROM notas
WHERE id IN (SELECT id FROM duplicados WHERE rn > 1);

-- 2) Impedir que voltem a aparecer
CREATE UNIQUE INDEX IF NOT EXISTS notas_vigente_uidx
  ON notas (aluno_id, disciplina_id, trimestre, tipo, autor_papel);

-- 3) Manter `actualizado_em` sempre correcto (usado para desempatar na VIEW)
CREATE OR REPLACE FUNCTION notas_touch_actualizado()
RETURNS trigger AS $$
BEGIN
  NEW.actualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notas_touch_trg ON notas;
CREATE TRIGGER notas_touch_trg
  BEFORE UPDATE ON notas
  FOR EACH ROW EXECUTE FUNCTION notas_touch_actualizado();

-- 4) Recarregar o cache do PostgREST (sem isto o app pode não ver o índice)
NOTIFY pgrst, 'reload schema';
