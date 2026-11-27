// Funções de autenticação do Kulonga ligadas ao Supabase Auth.

import { supabase } from './supabase';
import AsyncStorage from
  '@react-native-async-storage/async-storage';
import { mensagemDoDiagnostico } from './token-diagnostico';
import type { DiagnosticoToken, MotivoToken, TipoToken } from './token-diagnostico';

export type { DiagnosticoToken, MotivoToken, TipoToken } from './token-diagnostico';
export { mensagemDoDiagnostico } from './token-diagnostico';

export interface ResultadoAuth {
  sucesso: boolean;
  erro?: string;
  papel?: string;
  userId?: string;
  papeis?: string[];
}

// ── Login professor / secretaria ───────────────────────────
export async function loginComEmail(
  email: string,
  senha: string,
  papelEsperado?: string,
): Promise<ResultadoAuth> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) return { sucesso: false, erro: error.message };

    const meta = data.user?.user_metadata;
    let papeis: string[] = meta?.papeis ?? (meta?.papel ? [meta.papel] : []);
    if (!papeis.length && papelEsperado) {
      const tabela = papelEsperado === 'aluno' ? 'alunos' : papelEsperado === 'encarregado' ? 'encarregados' : 'professores';
      const { data: perfil } = await supabase.from(tabela).select('id').eq('user_id', data.user.id).maybeSingle();
      if (perfil) papeis = [papelEsperado];
    }
    if (!papeis.length) papeis = ['professor'];
    return {
      sucesso: true,
      papel: papeis[0],
      papeis,
      userId: data.user.id,
    };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}

// ── Validar token do encarregado ───────────────────────────
export interface ResultadoToken {
  valido: boolean;
  alunoId?: string;
  nomeAluno?: string;
  escolaId?: string;
  erro?: string;
  motivo?: MotivoToken;
  tipoReal?: TipoToken;
}

// Pergunta à base de dados porque é que um token não serve (ou se serve).
// Devolve null se a função ainda não estiver instalada ou se houver falha de rede.
export async function diagnosticarToken(
  codigo: string,
  esperado: TipoToken,
  email?: string,
): Promise<DiagnosticoToken | null> {
  try {
    const { data, error } = await supabase.rpc('diagnosticar_token', {
      p_codigo: codigo.trim(),
      p_tipo_esperado: esperado,
      p_email: email?.trim() || null,
    });
    if (error || !data || typeof (data as any).motivo !== 'string') return null;
    const d = data as any;
    return { motivo: d.motivo, tipoReal: d.tipo_real ?? undefined, expiraEm: d.expira_em ?? undefined };
  } catch {
    return null;
  }
}

export type TipoConvite = 'aluno' | 'encarregado';

// Valida o convite sem criar uma sessão ou um registo anónimo.
export async function prevalidarToken(
  codigo: string,
  tipo: TipoConvite,
): Promise<ResultadoToken> {
  try {
    const edge = await supabase.functions.invoke('validar-token', {
      body: { codigo: codigo.trim(), tipo },
    });
    let data = edge.data;
    let error = edge.error;
    // Fallback temporário para instalações onde a Edge Function ainda não foi publicada.
    // Depois do deploy, erros de validação continuam a ser tratados pela Edge Function.
    if (error && /function|404|not found/i.test(error.message ?? '')) {
      const rpc = await supabase.rpc('validar_token_acesso', { p_codigo: codigo, p_tipo: tipo }).maybeSingle();
      data = rpc.data ? { valido: true, convite: rpc.data } : { valido: false };
      error = rpc.error;
    }
    const row = data?.convite as { aluno_id: string; nome_aluno: string; escola_id: string } | undefined;
    if (error || !data?.valido || !row) {
      const diag = await diagnosticarToken(codigo, tipo);
      if (diag && diag.motivo !== 'ok') {
        return { valido: false, erro: mensagemDoDiagnostico(diag, tipo), motivo: diag.motivo, tipoReal: diag.tipoReal };
      }
      if (error && !data?.erro) {
        return { valido: false, erro: 'Não foi possível validar o token agora. Verifica a ligação à internet e tenta outra vez.' };
      }
      return { valido: false, erro: data?.erro ?? 'Token não aceite. Confirma o código ou consulta a escola.' };
    }
    return {
      valido: true,
      alunoId: row.aluno_id,
      nomeAluno: row.nome_aluno,
      escolaId: row.escola_id,
    };
  } catch {
    return { valido: false, erro: 'Não foi possível validar o token agora. Verifica a ligação à internet e tenta outra vez.' };
  }
}

// Deve ser chamado apenas depois de o Supabase Auth criar a conta.
export async function activarContaPorToken(
  codigo: string,
  tipo: TipoConvite,
  email: string,
  nome?: string,
  telefone?: string,
): Promise<{ sucesso: boolean; alunoId?: string; erro?: string }> {
  try {
    const { data, error } = await supabase.rpc('activar_conta_por_token', {
      p_codigo: codigo,
      p_tipo: tipo,
      p_email: email,
      p_nome: nome ?? null,
      p_telefone: telefone?.trim() || null,
    });
    if (error) return { sucesso: false, erro: error.message };
    return { sucesso: true, alunoId: data as string };
  } catch (e: any) {
    return { sucesso: false, erro: e?.message ?? 'Não foi possível activar o convite' };
  }
}

export async function validarTokenEncarregado(
  codigo: string
): Promise<ResultadoToken> {
  try {
    const { data, error } = await supabase.rpc('validar_e_vincular_token', { p_codigo: codigo });
    if (error) return { valido: false, erro: 'Token inválido' };
    const alunoId = data as unknown as string;
    if (!alunoId) return { valido: false, erro: 'Token inválido' };
    return { valido: true, alunoId };
  } catch (e: any) {
    const msg = e?.message ?? '';
    if (msg.includes('expirado')) return { valido: false, erro: 'Token expirado' };
    return { valido: false, erro: 'Token inválido' };
  }
}

// ── Verificar sessão activa ────────────────────────────────
export async function verificarSessao(): Promise<{
  activa: boolean;
  papel?: string;
  userId?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { activa: false };
    const meta = session.user.user_metadata;
    return {
      activa: true,
      papel: meta?.papeis?.[0] ?? meta?.papel,
      userId: session.user.id,
    };
  } catch {
    return { activa: false };
  }
}

// ── Logout completo ────────────────────────────────────────
export async function logout(): Promise<void> {
  // Termina a sessão no Supabase (limpa o token guardado no AsyncStorage)
  await supabase.auth.signOut();

  // Limpa o estado local da app
  await AsyncStorage.multiRemove([
    'kulonga_onboarding_feito',
    'kulonga_perfil',
    'kulonga_sessao_activa',
    'kulonga_papel_activo',
    'kulonga_papeis',
    'kulonga_nome',
    'kulonga_filhos',
    'kulonga_aluno_id',
    'kulonga_escola_id',
    'kulonga_provincia',
    'kulonga_lingua',
  ]);
}
