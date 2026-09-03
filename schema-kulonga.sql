================================================================================
KULONGA — SCHEMA CORRIGIDO (v2)
Execute este ficheiro todo de uma vez no Supabase Dashboard → SQL Editor → Run
Data: 28/08/2026
Correcções em relação ao plano-execucao-backend.txt:
  - RLS reescrito: secretaria (staff) passa a conseguir ver TODAS as tabelas
    da sua escola; professor vê apenas as suas turmas; encarregado vê o seu aluno
  - Funções auxiliares escolas_do_staff() / alunos_do_encarregado() para evitar
    recursão de RLS
  - View notas_vigentes com join corrigido (p.user_id = n.autor_id)
================================================================================

--------------------------------------------------------------------------------
1. EXTENSÕES
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

--------------------------------------------------------------------------------
2. TABELAS
--------------------------------------------------------------------------------
-- 1. ESCOLAS
CREATE TABLE IF NOT EXISTS escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  provincia TEXT NOT NULL,
  municipio TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  direccao_nome TEXT,
  direccao_telefone TEXT,
  criada_em TIMESTAMPTZ DEFAULT now(),
  actualizada_em TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFESSORES (inclui director/secretaria como staff da escola)
CREATE TABLE IF NOT EXISTS professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  disciplinas TEXT[],
  activo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('M', 'F')),
  foto_url TEXT,
  telefone TEXT,
  endereco TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. TURMAS
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ano_lectivo TEXT NOT NULL,
  serie TEXT,
  turno TEXT,
  coordenador_id UUID REFERENCES professores(id),
  criada_em TIMESTAMPTZ DEFAULT now()
);

-- 5. DISCIPLINAS
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  criada_em TIMESTAMPTZ DEFAULT now()
);

-- 6. TURMA-ALUNOS
CREATE TABLE IF NOT EXISTS turma_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  matriculado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, aluno_id)
);

-- 7. TURMA-DISCIPLINAS
CREATE TABLE IF NOT EXISTS turma_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  UNIQUE(turma_id, disciplina_id)
);

-- 8. DISCIPLINA-PROFESSOR
CREATE TABLE IF NOT EXISTS disciplina_professor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  UNIQUE(disciplina_id, professor_id, turma_id)
);

-- 9. NOTAS
CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id),
  turma_id UUID NOT NULL REFERENCES turmas(id),
  trimestre SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
  tipo TEXT NOT NULL CHECK (tipo IN ('frequencia', 'prova', 'exame')),
  valor NUMERIC(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 20),
  autor_id UUID NOT NULL,
  autor_papel TEXT NOT NULL CHECK (autor_papel IN ('professor', 'coordenador', 'secretaria')),
  lancado_em TIMESTAMPTZ DEFAULT now(),
  actualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 10. ENCARREGADOS
CREATE TABLE IF NOT EXISTS encarregados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 11. ENCARREGADO-ALUNO
CREATE TABLE IF NOT EXISTS encarregado_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encarregado_id UUID NOT NULL REFERENCES encarregados(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  parentesco TEXT,
  UNIQUE(encarregado_id, aluno_id)
);

-- 12. TOKENS DE ACESSO
CREATE TABLE IF NOT EXISTS tokens_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  qr_hash TEXT,
  ativo BOOLEAN DEFAULT true,
  expira_em TIMESTAMPTZ,
  gerado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 13. NOTAS PENDENTES (sync offline)
CREATE TABLE IF NOT EXISTS notas_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL,
  disciplina_id UUID NOT NULL,
  turma_id UUID NOT NULL,
  trimestre SMALLINT NOT NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC(4,2) NOT NULL,
  autor_id UUID NOT NULL,
  autor_papel TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'sync', 'erro')),
  lancado_em TIMESTAMPTZ DEFAULT now(),
  sincronizado_em TIMESTAMPTZ
);

--------------------------------------------------------------------------------
3. FUNÇÕES AUXILIARES (evitam recursão de RLS)
--------------------------------------------------------------------------------
-- escola_id onde o user autenticado é staff (professor/coord/secretaria)
CREATE OR REPLACE FUNCTION escolas_do_staff()
RETURNS uuid[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(array_agg(escola_id), ARRAY[]::uuid[])
  FROM professores WHERE user_id = auth.uid();
$$;

-- aluno_id visíveis pelo encarregado autenticado
CREATE OR REPLACE FUNCTION alunos_do_encarregado()
RETURNS uuid[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(array_agg(ea.aluno_id), ARRAY[]::uuid[])
  FROM encarregado_aluno ea
  JOIN encarregados e ON e.id = ea.encarregado_id
  WHERE e.user_id = auth.uid();
$$;

--------------------------------------------------------------------------------
4. VIEW notas_vigentes (hierarquia: secretaria > coordenador > professor)
   Em empate: nota mais recente vence
--------------------------------------------------------------------------------
CREATE OR REPLACE VIEW notas_vigentes AS
WITH notas_com_rank AS (
  SELECT
    n.*,
    d.nome AS disciplina_nome,
    p.nome AS professor_nome,
    p.telefone AS professor_telefone,
    ROW_NUMBER() OVER (
      PARTITION BY n.aluno_id, n.disciplina_id, n.trimestre, n.tipo
      ORDER BY
        CASE n.autor_papel
          WHEN 'secretaria' THEN 3
          WHEN 'coordenador' THEN 2
          WHEN 'professor' THEN 1
        END DESC,
        n.actualizado_em DESC
    ) AS rank
  FROM notas n
  JOIN disciplinas d ON d.id = n.disciplina_id
  LEFT JOIN professores p ON p.user_id = n.autor_id
)
SELECT * FROM notas_com_rank WHERE rank = 1;

--------------------------------------------------------------------------------
5. RLS
--------------------------------------------------------------------------------
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplina_professor ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE encarregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE encarregado_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_pendentes ENABLE ROW LEVEL SECURITY;

-- Política "raiz" para as funções auxiliares funcionarem (ver a própria linha)
CREATE POLICY "professores_ver_propria_linha" ON professores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "encarregados_ver_propria_linha" ON encarregados
  FOR SELECT USING (user_id = auth.uid());

-- ESCOLAS: staff da escola vê/gere tudo
CREATE POLICY "escolas_staff" ON escolas
  FOR ALL USING (id = ANY(escolas_do_staff()));

-- PROFESSORES: staff vê colegas da escola; cada um vê a própria linha
CREATE POLICY "professores_staff" ON professores
  FOR ALL USING (
    user_id = auth.uid()
    OR escola_id = ANY(escolas_do_staff())
  );

-- ALUNOS: staff da escola + encarregado do próprio aluno
CREATE POLICY "alunos_staff" ON alunos
  FOR ALL USING (
    escola_id = ANY(escolas_do_staff())
    OR id = ANY(alunos_do_encarregado())
  );

-- TURMAS: staff da escola + professor das suas turmas
CREATE POLICY "turmas_staff" ON turmas
  FOR ALL USING (
    escola_id = ANY(escolas_do_staff())
    OR id IN (
      SELECT turma_id FROM disciplina_professor
      WHERE professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid())
    )
  );

-- DISCIPLINAS: staff da escola
CREATE POLICY "disciplinas_staff" ON disciplinas
  FOR ALL USING (escola_id = ANY(escolas_do_staff()));

-- TURMA_ALUNOS
CREATE POLICY "turma_alunos_staff" ON turma_alunos
  FOR ALL USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = ANY(escolas_do_staff()))
    OR aluno_id = ANY(alunos_do_encarregado())
  );

-- TURMA_DISCIPLINAS
CREATE POLICY "turma_disciplinas_staff" ON turma_disciplinas
  FOR ALL USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = ANY(escolas_do_staff()))
  );

-- DISCIPLINA_PROFESSOR
CREATE POLICY "disciplina_professor_staff" ON disciplina_professor
  FOR ALL USING (
    disciplina_id IN (SELECT id FROM disciplinas WHERE escola_id = ANY(escolas_do_staff()))
  );

-- NOTAS: staff da escola (secretaria/prof/coord) + encarregado do aluno
CREATE POLICY "notas_staff" ON notas
  FOR SELECT USING (
    turma_id IN (SELECT id FROM turmas WHERE escola_id = ANY(escolas_do_staff()))
    OR aluno_id = ANY(alunos_do_encarregado())
  );

CREATE POLICY "notas_inserir" ON notas
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND turma_id IN (SELECT id FROM turmas WHERE escola_id = ANY(escolas_do_staff()))
  );

CREATE POLICY "notas_actualizar" ON notas
  FOR UPDATE USING (autor_id = auth.uid());

-- ENCARREGADOS: vê a própria linha e os da sua escola (staff)
CREATE POLICY "encarregados_staff" ON encarregados
  FOR ALL USING (
    user_id = auth.uid()
    OR id IN (SELECT encarregado_id FROM encarregado_aluno WHERE aluno_id = ANY(alunos_do_encarregado()))
  );

-- ENCARREGADO_ALUNO
CREATE POLICY "encarregado_aluno_staff" ON encarregado_aluno
  FOR ALL USING (
    encarregado_id IN (SELECT id FROM encarregados WHERE user_id = auth.uid())
    OR aluno_id = ANY(alunos_do_encarregado())
  );

-- TOKENS: qualquer um valida (lectura); staff gera para alunos da escola
CREATE POLICY "tokens_validar" ON tokens_acesso
  FOR SELECT USING (ativo = true);

CREATE POLICY "tokens_gerar" ON tokens_acesso
  FOR INSERT WITH CHECK (
    gerado_por = auth.uid()
    AND aluno_id IN (SELECT id FROM alunos WHERE escola_id = ANY(escolas_do_staff()))
  );

-- NOTAS PENDENTES: cada utilizador vê/cria/actualiza as suas
CREATE POLICY "notas_pendentes_ver" ON notas_pendentes
  FOR SELECT USING (autor_id = auth.uid());

CREATE POLICY "notas_pendentes_criar" ON notas_pendentes
  FOR INSERT WITH CHECK (autor_id = auth.uid());

CREATE POLICY "notas_pendentes_actualizar" ON notas_pendentes
  FOR UPDATE USING (autor_id = auth.uid());

--------------------------------------------------------------------------------
6. STORAGE
--------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-alunos', 'fotos-alunos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "upload_foto_aluno" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-alunos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "ver_fotos_alunos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-alunos');

================================================================================
FIM — depois de correr isto, avançar para FASE 4 (descomentar services)
================================================================================
