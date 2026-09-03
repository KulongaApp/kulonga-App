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

// Média de uma disciplina num trimestre (peso: prova 0.4, frequencia 0.3, exame 0.3)
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

  const pesos: Record<string, number> = {
    frequencia: 0.3,
    prova: 0.4,
    exame: 0.3,
  };
  let soma = 0;
  let totalPeso = 0;
  for (const n of data ?? []) {
    const p = pesos[n.tipo] ?? 0;
    soma += Number(n.valor) * p;
    totalPeso += p;
  }
  return totalPeso > 0 ? soma / totalPeso : 0;
}
