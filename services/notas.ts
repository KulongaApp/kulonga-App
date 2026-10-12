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

// ── Gerar convites de acesso (secretaria) ─────────────────
export interface TokensAcesso {
  aluno: string;
  encarregado: string;
}

function novoCodigoAcesso(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function gerarTokensAcesso(
  alunoId: string,
  geradoPor: string
): Promise<{ sucesso: boolean; tokens?: TokensAcesso; erro?: string }> {
  try {
    const tokens: TokensAcesso = { aluno: novoCodigoAcesso(), encarregado: novoCodigoAcesso() };
    const { error: revokeError } = await supabase
      .from('tokens_acesso')
      .update({ ativo: false })
      .eq('aluno_id', alunoId)
      .eq('tipo', 'aluno')
      .eq('ativo', true);
    if (revokeError) throw revokeError;

    const { error } = await supabase.from('tokens_acesso').insert([
      { aluno_id: alunoId, codigo: tokens.aluno, tipo: 'aluno', ativo: true, gerado_por: geradoPor },
      { aluno_id: alunoId, codigo: tokens.encarregado, tipo: 'encarregado', ativo: true, gerado_por: geradoPor },
    ]);
    if (error) throw error;

    return { sucesso: true, tokens };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}

// Compatibilidade para consumidores antigos: devolve o convite do encarregado.
export async function gerarTokenAluno(
  alunoId: string,
  geradoPor: string,
): Promise<{ sucesso: boolean; codigo?: string; erro?: string }> {
  const resultado = await gerarTokensAcesso(alunoId, geradoPor);
  return {
    sucesso: resultado.sucesso,
    codigo: resultado.tokens?.encarregado,
    erro: resultado.erro,
  };
}
