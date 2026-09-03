import { useEffect, useState, useCallback } from 'react';
import { alunoMock, Aluno } from '../mocks/aluno';

// TODO: Lógica offline-first real:
// 1. Buscar do SQLite/WatermelonDB local
// 2. Se online, sincronizar com Supabase
// 3. Actualizar SQLite com dados novos
// const { data } = await supabase
//   .from('alunos')
//   .select('*, disciplinas(*, professores(*)), notas(*)')
//   .eq('id', alunoId)
//   .single();

export const useAlunoDados = () => {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    setLoading(true);
    setErro(null);
    const timeout = setTimeout(() => {
      setAluno(alunoMock);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const cancel = recarregar();
    return cancel;
  }, [recarregar]);

  return { aluno, loading, erro, recarregar };
};
