-- KULONGA — Ano lectivo configurável por escola
-- Executar depois do schema principal.
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS ano_lectivo TEXT;

UPDATE escolas
SET ano_lectivo = CASE
  WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '/' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT
  ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
END
WHERE ano_lectivo IS NULL OR trim(ano_lectivo) = '';

CREATE INDEX IF NOT EXISTS idx_escolas_ano_lectivo ON escolas(ano_lectivo);
