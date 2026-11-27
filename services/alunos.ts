// services/alunos.ts — FASE 5
import { supabase } from './supabase';

export interface AlunoDados {
  escolaId: string;
  nomeCompleto: string;
  dataNascimento?: string;
  genero?: 'M' | 'F';
  fotoUrl?: string;
  telefone?: string;
  endereco?: string;
}

export async function adicionarAluno(d: AlunoDados) {
  const { data, error } = await supabase
    .from('alunos')
    .insert({
      escola_id: d.escolaId,
      nome_completo: d.nomeCompleto,
      data_nascimento: d.dataNascimento ?? null,
      genero: d.genero ?? null,
      foto_url: d.fotoUrl ?? null,
      telefone: d.telefone ?? null,
      endereco: d.endereco ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarAlunos(escolaId: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('escola_id', escolaId);
  if (error) throw error;
  return data;
}

export async function buscarAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', alunoId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarAluno(alunoId: string, dados: Partial<AlunoDados>) {
  const { error } = await supabase
    .from('alunos')
    .update({
      nome_completo: dados.nomeCompleto,
      data_nascimento: dados.dataNascimento,
      genero: dados.genero,
      foto_url: dados.fotoUrl,
      telefone: dados.telefone,
      endereco: dados.endereco,
    })
    .eq('id', alunoId);
  if (error) throw error;
}

export async function removerAluno(alunoId: string) {
  const { error } = await supabase.from('alunos').delete().eq('id', alunoId);
  if (error) throw error;
}

export async function matricularAluno(alunoId: string, turmaId: string) {
  const { error } = await supabase
    .from('turma_alunos')
    .insert({ aluno_id: alunoId, turma_id: turmaId });
  if (error) throw error;
}

export async function desmatricularAluno(alunoId: string, turmaId: string) {
  const { error } = await supabase
    .from('turma_alunos')
    .delete()
    .eq('aluno_id', alunoId)
    .eq('turma_id', turmaId);
  if (error) throw error;
}
