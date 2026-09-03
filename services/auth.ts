// Funções de autenticação do Kulonga
// Por agora usam mocks — quando o Supabase estiver
// configurado basta descomentar as linhas com TODO

import { supabase } from './supabase';
import AsyncStorage from
  '@react-native-async-storage/async-storage';

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
  senha: string
): Promise<ResultadoAuth> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) return { sucesso: false, erro: error.message };

    const meta = data.user?.user_metadata;
    const papeis: string[] = meta?.papeis ?? [meta?.papel ?? 'professor'];
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
  erro?: string;
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