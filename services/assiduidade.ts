import { supabase } from './supabase';

export type EstadoAssiduidade = 'presente' | 'ausente' | 'atrasado' | 'justificado';

export interface RegistoAssiduidade {
  alunoId: string;
  estado: EstadoAssiduidade;
  minutosAtraso?: number | null;
  justificacao?: string | null;
}

export async function guardarAssiduidade(dados: {
  turmaId: string;
  disciplinaId?: string | null;
  dataSessao: string;
  inicio?: string | null;
  registos: RegistoAssiduidade[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão não encontrada.');

  const { data: sessao, error: sessaoError } = await supabase
    .from('assiduidade_sessoes')
    .upsert({
      turma_id: dados.turmaId,
      disciplina_id: dados.disciplinaId ?? null,
      data_sessao: dados.dataSessao,
      inicio: dados.inicio ?? null,
      criado_por: user.id,
      actualizado_em: new Date().toISOString(),
    }, { onConflict: 'turma_id,disciplina_id,data_sessao,inicio' })
    .select('id')
    .single();
  if (sessaoError) throw sessaoError;

  const linhas = dados.registos.map((r) => ({
    sessao_id: sessao.id,
    aluno_id: r.alunoId,
    estado: r.estado,
    minutos_atraso: r.estado === 'atrasado' ? r.minutosAtraso ?? 0 : null,
    justificacao: r.estado === 'justificado' ? r.justificacao ?? null : null,
    registado_por: user.id,
    actualizado_em: new Date().toISOString(),
  }));
  const { error } = await supabase.from('assiduidade_registos').upsert(linhas, { onConflict: 'sessao_id,aluno_id' });
  if (error) throw error;
  return sessao;
}

export async function listarAssiduidadeAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('assiduidade_registos')
    .select('estado,minutos_atraso,justificacao,assiduidade_sessoes(data_sessao,disciplina_id,turma_id)')
    .eq('aluno_id', alunoId)
    .order('actualizado_em', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
