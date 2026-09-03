// Funções para gestão de notas — offline-first
// O professor lança sem internet, sincroniza depois
// Esta é a parte mais importante do Kulonga

import { supabase } from './supabase';
import { salvarNotaPendente, sincronizarPendentes as syncPendentes } from '../db/sync';

export interface NotaPayload {
  alunoId: string;
  disciplinaId: string;
  trimestre: 1 | 2 | 3;
  valor: number;
  autorPapel: 'professor' | 'coordenador' | 'secretaria';
  autorId: string;
}

// ── Buscar notas de um aluno (encarregado) ─────────────────
export async function buscarNotasAluno(alunoId: string) {
  try {
    // Usa a VIEW notas_vigentes — aplica a hierarquia de papéis
    const { data, error } = await supabase
      .from('notas_vigentes')
      .select('*')
      .eq('aluno_id', alunoId);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro ao buscar notas:', e);
    return null;
  }
}

export async function lancarNota(
  payload: NotaPayload & { turmaId: string; tipo: string }
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    await salvarNotaPendente({
      alunoId: payload.alunoId,
      disciplinaId: payload.disciplinaId,
      turmaId: payload.turmaId,
      trimestre: payload.trimestre,
      tipo: payload.tipo as any,
      valor: payload.valor,
      autorId: payload.autorId,
      autorPapel: payload.autorPapel,
    });
    try {
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      const s = await NetInfo.fetch();
      if (s.isConnected) await syncPendentes();
    } catch {}
    return { sucesso: true };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}

export async function sincronizarPendentes(): Promise<{ sincronizadas: number; erros: number }> {
  return syncPendentes();
}

// ── Gerar token de acesso (secretaria) ────────────────────
export async function gerarTokenAluno(
  alunoId: string,
  geradoPor: string
): Promise<{ sucesso: boolean; codigo?: string; erro?: string }> {
  try {
    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const { error } = await supabase.from('tokens_acesso').insert({
      aluno_id: alunoId,
      codigo,
      ativo: true,
      gerado_por: geradoPor,
    });
    if (error) throw error;

    return { sucesso: true, codigo };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}