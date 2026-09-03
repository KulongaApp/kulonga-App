// services/professores.ts — FASE 5
import { supabase } from './supabase';

// Devolve o escola_id do utilizador logado (professor/secretaria)
export async function obterEscolaDoUsuario(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('professores')
    .select('escola_id')
    .eq('user_id', user.id)
    .single();
  if (error || !data) return null;
  return data.escola_id as string;
}

export interface ProfessorDados {
  escolaId: string;
  nome: string;
  email: string;
  telefone?: string;
  disciplinas?: string[];
  user_id?: string;
}

// Auto-registo do professor (RPC SECURITY DEFINER)
export async function registarProfessor(d: ProfessorDados): Promise<string> {
  const { data, error } = await supabase.rpc('registar_professor', {
    p_escola_id: d.escolaId,
    p_nome: d.nome,
    p_email: d.email,
    p_telefone: d.telefone ?? null,
    p_disciplinas: d.disciplinas ?? [],
  });
  if (error) throw error;
  return data as string;
}

// Secretaria adiciona professor (utilizador já criado via signUp)
export async function adicionarProfessor(d: ProfessorDados) {
  const { error } = await supabase.from('professores').insert({
    user_id: d.user_id ?? null,
    escola_id: d.escolaId,
    nome: d.nome,
    email: d.email,
    telefone: d.telefone ?? null,
    disciplinas: d.disciplinas ?? [],
    activo: true,
  });
  if (error) throw error;
}

export async function listarProfessores(escolaId: string) {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('escola_id', escolaId);
  if (error) throw error;
  return data;
}

export async function buscarProfessor(professorId: string) {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .eq('id', professorId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarProfessor(
  professorId: string,
  dados: Partial<ProfessorDados>
) {
  const { error } = await supabase
    .from('professores')
    .update({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      disciplinas: dados.disciplinas,
    })
    .eq('id', professorId);
  if (error) throw error;
}

export async function removerProfessor(professorId: string) {
  const { error } = await supabase
    .from('professores')
    .delete()
    .eq('id', professorId);
  if (error) throw error;
}

export async function atribuirDisciplina(
  professorId: string,
  disciplinaId: string,
  turmaId: string
) {
  const { error } = await supabase
    .from('disciplina_professor')
    .insert({ professor_id: professorId, disciplina_id: disciplinaId, turma_id: turmaId });
  if (error) throw error;
}
