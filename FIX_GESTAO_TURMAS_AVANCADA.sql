-- KULONGA: gestão avançada de turmas
-- Executar depois das migrações base/RLS já aplicadas.

ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS sala text;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS capacidade integer;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activa';
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS actualizada_em timestamptz DEFAULT now();
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.encarregados ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS foto_url text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turmas_capacidade_check') THEN
    ALTER TABLE public.turmas ADD CONSTRAINT turmas_capacidade_check CHECK (capacidade IS NULL OR capacidade > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'turmas_estado_check') THEN
    ALTER TABLE public.turmas ADD CONSTRAINT turmas_estado_check CHECK (estado IN ('planeada','activa','encerrada','arquivada'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS turmas_escola_ano_idx ON public.turmas(escola_id, ano_lectivo);
CREATE INDEX IF NOT EXISTS turma_alunos_turma_idx ON public.turma_alunos(turma_id);
CREATE INDEX IF NOT EXISTS disciplina_professor_turma_idx ON public.disciplina_professor(turma_id);

-- O coordenador é sempre um professor da mesma escola; a RLS existente continua a limitar a escola.
CREATE OR REPLACE FUNCTION public.validar_coordenador_turma()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.coordenador_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.professores p
    WHERE p.id = NEW.coordenador_id AND p.escola_id = NEW.escola_id
      AND COALESCE(p.activo, true) = true AND COALESCE(p.papel, 'professor') IN ('professor','coordenador')
  ) THEN RAISE EXCEPTION 'O coordenador tem de ser um professor activo da mesma escola'; END IF;
  NEW.actualizada_em := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validar_coordenador_turma_trigger ON public.turmas;
CREATE TRIGGER validar_coordenador_turma_trigger BEFORE INSERT OR UPDATE ON public.turmas
FOR EACH ROW EXECUTE FUNCTION public.validar_coordenador_turma();

-- Função de leitura para o coordenador: permite consultar os dados da própria turma sem dar acesso global.
CREATE OR REPLACE FUNCTION public.turmas_do_coordenador()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT id FROM public.turmas WHERE coordenador_id IN (
    SELECT id FROM public.professores WHERE user_id = auth.uid() AND COALESCE(activo, true) = true
  );
$$;
REVOKE ALL ON FUNCTION public.turmas_do_coordenador() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.turmas_do_coordenador() TO authenticated;

NOTIFY pgrst, 'reload schema';
