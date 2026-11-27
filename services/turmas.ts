// services/turmas.ts — gestão de turmas e relações escolares
import { supabase } from './supabase';

export interface TurmaDados {
  escolaId: string;
  nome: string;
  anoLectivo: string;
  serie?: string;
  turno?: string;
  sala?: string;
  capacidade?: number | null;
  estado?: 'planeada' | 'activa' | 'encerrada' | 'arquivada';
  observacoes?: string;
  coordenadorId?: string | null;
}

export async function criarTurma(d: TurmaDados) {
  const { data, error } = await supabase.from('turmas').insert({
    escola_id: d.escolaId, nome: d.nome.trim(), ano_lectivo: d.anoLectivo.trim(), serie: d.serie?.trim() || null,
    turno: d.turno?.trim() || null, sala: d.sala?.trim() || null, capacidade: d.capacidade ?? null,
    estado: d.estado ?? 'activa', observacoes: d.observacoes?.trim() || null, coordenador_id: d.coordenadorId ?? null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function listarTurmas(escolaId: string) {
  const { data, error } = await supabase.from('turmas').select('*').eq('escola_id', escolaId).order('ano_lectivo', { ascending: false }).order('nome');
  if (error) throw error;
  return data;
}

export async function listarTurmasDoProfessor(professorId: string) {
  const { data: atribuicoes, error: atribuicoesError } = await supabase
    .from('disciplina_professor')
    .select('turma_id, disciplina_id, disciplinas(id,nome,codigo)')
    .eq('professor_id', professorId);
  if (atribuicoesError) throw atribuicoesError;
  const ids = [...new Set((atribuicoes ?? []).map((a: any) => a.turma_id))];
  if (ids.length === 0) return [];
  const { data: turmas, error: turmasError } = await supabase.from('turmas').select('*').in('id', ids).order('ano_lectivo', { ascending: false }).order('nome');
  if (turmasError) throw turmasError;
  return (turmas ?? []).map((turma: any) => ({
    ...turma,
    disciplinas_atribuidas: (atribuicoes ?? []).filter((a: any) => a.turma_id === turma.id).map((a: any) => a.disciplinas).filter(Boolean),
  }));
}

export async function buscarTurma(turmaId: string) {
  const { data, error } = await supabase.from('turmas').select('*').eq('id', turmaId).single();
  if (error) throw error;
  return data;
}

export async function actualizarTurma(turmaId: string, dados: Partial<TurmaDados>) {
  const payload: Record<string, unknown> = {};
  if (dados.nome !== undefined) payload.nome = dados.nome.trim();
  if (dados.anoLectivo !== undefined) payload.ano_lectivo = dados.anoLectivo.trim();
  if (dados.serie !== undefined) payload.serie = dados.serie?.trim() || null;
  if (dados.turno !== undefined) payload.turno = dados.turno?.trim() || null;
  if (dados.sala !== undefined) payload.sala = dados.sala?.trim() || null;
  if (dados.capacidade !== undefined) payload.capacidade = dados.capacidade;
  if (dados.estado !== undefined) payload.estado = dados.estado;
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes?.trim() || null;
  if (dados.coordenadorId !== undefined) payload.coordenador_id = dados.coordenadorId;
  const { error } = await supabase.from('turmas').update(payload).eq('id', turmaId);
  if (error) throw error;
}

export async function removerTurma(turmaId: string) {
  const { error } = await supabase.from('turmas').delete().eq('id', turmaId);
  if (error) throw error;
}

export async function listarAlunosTurma(turmaId: string) {
  const { data, error } = await supabase.from('turma_alunos').select('id, matriculado_em, alunos (*)').eq('turma_id', turmaId).order('matriculado_em');
  if (error) throw error;
  return data;
}

export async function listarProfessoresTurma(turmaId: string) {
  const { data, error } = await supabase.from('disciplina_professor').select('id, disciplina_id, professores(id,nome,email,telefone,foto_url), disciplinas(id,nome,codigo)').eq('turma_id', turmaId);
  if (error) throw error;
  return data;
}

export async function listarDisciplinasEscola(escolaId: string) {
  const { data, error } = await supabase.from('disciplinas').select('*').eq('escola_id', escolaId).order('nome');
  if (error) throw error;
  return data;
}

export async function atribuirProfessorTurma(professorId: string, disciplinaId: string, turmaId: string) {
  const { error } = await supabase.from('disciplina_professor').upsert({ professor_id: professorId, disciplina_id: disciplinaId, turma_id: turmaId }, { onConflict: 'disciplina_id,professor_id,turma_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removerProfessorTurma(atribuicaoId: string) {
  const { error } = await supabase.from('disciplina_professor').delete().eq('id', atribuicaoId);
  if (error) throw error;
}
