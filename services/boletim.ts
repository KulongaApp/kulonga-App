// services/boletim.ts — FASE 5
import { supabase } from './supabase';

// Notas vigentes (com hierarquia de papéis) de um aluno
export async function gerarBoletimAluno(alunoId: string, anoLectivo?: string) {
  let q = supabase.from('notas_vigentes').select('*').eq('aluno_id', alunoId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function gerarBoletimTurma(turmaId: string) {
  const { data, error } = await supabase
    .from('notas_vigentes')
    .select('*')
    .eq('turma_id', turmaId);
  if (error) throw error;
  return data;
}

export async function calcularMedia(
  alunoId: string,
  disciplinaId: string,
  trimestre: number
) {
  const { data, error } = await supabase
    .from('notas_vigentes')
    .select('tipo, valor')
    .eq('aluno_id', alunoId)
    .eq('disciplina_id', disciplinaId)
    .eq('trimestre', trimestre);
  if (error) throw error;
  const get = (t: string) => {
    const r = (data ?? []).find((x: any) => x.tipo === t);
    return r ? Number(r.valor) : null;
  };
  const mac = get('frequencia');
  const pt = get('prova');
  if (mac !== null && pt !== null) return (mac + pt) / 2;
  if (mac !== null) return mac;
  if (pt !== null) return pt;
  const exame = get('exame');
  return exame ?? 0;
}
