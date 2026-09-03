// services/disciplinas.ts — FASE 5
import { supabase } from './supabase';

export interface DisciplinaDados {
  escolaId: string;
  nome: string;
  codigo?: string;
}

export async function adicionarDisciplina(d: DisciplinaDados) {
  const { data, error } = await supabase
    .from('disciplinas')
    .insert({
      escola_id: d.escolaId,
      nome: d.nome,
      codigo: d.codigo ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarDisciplinas(escolaId: string) {
  const { data, error } = await supabase
    .from('disciplinas')
    .select('*')
    .eq('escola_id', escolaId);
  if (error) throw error;
  return data;
}

export async function buscarDisciplina(disciplinaId: string) {
  const { data, error } = await supabase
    .from('disciplinas')
    .select('*')
    .eq('id', disciplinaId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarDisciplina(
  disciplinaId: string,
  dados: Partial<DisciplinaDados>
) {
  const { error } = await supabase
    .from('disciplinas')
    .update({ nome: dados.nome, codigo: dados.codigo })
    .eq('id', disciplinaId);
  if (error) throw error;
}

export async function removerDisciplina(disciplinaId: string) {
  const { error } = await supabase.from('disciplinas').delete().eq('id', disciplinaId);
  if (error) throw error;
}
