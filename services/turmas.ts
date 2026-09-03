// services/turmas.ts — FASE 5
import { supabase } from './supabase';

export interface TurmaDados {
  escolaId: string;
  nome: string;
  anoLectivo: string;
  serie?: string;
  turno?: string;
  coordenadorId?: string;
}

export async function criarTurma(d: TurmaDados) {
  const { data, error } = await supabase
    .from('turmas')
    .insert({
      escola_id: d.escolaId,
      nome: d.nome,
      ano_lectivo: d.anoLectivo,
      serie: d.serie ?? null,
      turno: d.turno ?? null,
      coordenador_id: d.coordenadorId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarTurmas(escolaId: string) {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('escola_id', escolaId);
  if (error) throw error;
  return data;
}

export async function buscarTurma(turmaId: string) {
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('id', turmaId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarTurma(turmaId: string, dados: Partial<TurmaDados>) {
  const { error } = await supabase
    .from('turmas')
    .update({
      nome: dados.nome,
      ano_lectivo: dados.anoLectivo,
      serie: dados.serie,
      turno: dados.turno,
      coordenador_id: dados.coordenadorId,
    })
    .eq('id', turmaId);
  if (error) throw error;
}

export async function removerTurma(turmaId: string) {
  const { error } = await supabase.from('turmas').delete().eq('id', turmaId);
  if (error) throw error;
}

export async function listarAlunosTurma(turmaId: string) {
  const { data, error } = await supabase
    .from('turma_alunos')
    .select('alunos (*)')
    .eq('turma_id', turmaId);
  if (error) throw error;
  return data;
}
