import { supabase } from './supabase';

export async function listarTrabalhosDoAluno(alunoId: string) {
  const { data: matriculas, error: matriculasError } = await supabase.from('turma_alunos').select('turma_id').eq('aluno_id', alunoId);
  if (matriculasError) throw matriculasError;
  const turmas = (matriculas ?? []).map((row) => row.turma_id);
  if (!turmas.length) return [];
  const { data, error } = await supabase.from('trabalhos').select('*, disciplinas(nome), turmas(nome), entregas_trabalho!left(*)').in('turma_id', turmas).eq('activo', true).order('prazo', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function criarTrabalho(dados: { escolaId: string; turmaId: string; disciplinaId?: string | null; professorId: string; titulo: string; descricao: string; prazo?: string | null }) {
  const titulo = dados.titulo.trim();
  if (titulo.length < 2) throw new Error('O título do trabalho é demasiado curto.');
  const { data, error } = await supabase.from('trabalhos').insert({ escola_id: dados.escolaId, turma_id: dados.turmaId, disciplina_id: dados.disciplinaId ?? null, professor_id: dados.professorId, titulo, descricao: dados.descricao.trim(), prazo: dados.prazo ?? null }).select().single();
  if (error) throw error;
  return data;
}

export async function entregarTrabalho(dados: { trabalhoId: string; alunoId: string; resposta?: string; ficheiroUrl?: string | null }) {
  if (!dados.resposta?.trim() && !dados.ficheiroUrl) throw new Error('Escreve uma resposta ou adiciona um ficheiro.');
  const { data, error } = await supabase.from('entregas_trabalho').upsert({ trabalho_id: dados.trabalhoId, aluno_id: dados.alunoId, resposta: dados.resposta?.trim() ?? null, ficheiro_url: dados.ficheiroUrl ?? null, estado: 'entregue', entregue_em: new Date().toISOString(), actualizado_em: new Date().toISOString() }, { onConflict: 'trabalho_id,aluno_id' }).select().single();
  if (error) throw error;
  return data;
}

export async function listarAvisos(escolaId: string) {
  const { data, error } = await supabase.from('avisos').select('*, turmas(nome)').eq('escola_id', escolaId).eq('activo', true).order('publicado_em', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function criarAviso(dados: { escolaId: string; autorId: string; autorPapel: 'secretaria' | 'professor'; titulo: string; mensagem: string; publico: 'escola' | 'turma' | 'professores' | 'alunos' | 'encarregados'; turmaId?: string | null }) {
  if (dados.titulo.trim().length < 2 || dados.mensagem.trim().length < 2) throw new Error('Preenche o título e a mensagem do aviso.');
  const { data, error } = await supabase.from('avisos').insert({ escola_id: dados.escolaId, autor_id: dados.autorId, autor_papel: dados.autorPapel, titulo: dados.titulo.trim(), mensagem: dados.mensagem.trim(), publico: dados.publico, turma_id: dados.turmaId ?? null }).select().single();
  if (error) throw error;
  return data;
}

export async function listarNotificacoes() {
  const { data, error } = await supabase.from('notificacoes').select('*').order('criada_em', { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function marcarNotificacaoLida(id: string) {
  const { error } = await supabase.from('notificacoes').update({ lida_em: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function listarTrabalhosDoProfessor(professorId: string) {
  const { data, error } = await supabase.from('trabalhos').select('*, disciplinas(nome), turmas(nome)').eq('professor_id', professorId).eq('activo', true).order('prazo', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
