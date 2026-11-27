// services/professores.ts — FASE 5
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Devolve o escola_id do utilizador logado (professor/secretaria)
export async function obterEscolaDoUsuario(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('professores')
    .select('escola_id, activo')
    .eq('user_id', user.id)
    .eq('activo', true)
    .single();
  if (!error && data?.escola_id) return data.escola_id as string;

  // O registo da secretaria também vive em professores, mas instalações
  // antigas podem não devolver a linha por causa de RLS. O valor local é
  // apenas uma pista: as RPCs continuam a validar a autorização no servidor.
  return (await AsyncStorage.getItem('kulonga_escola_id')) || null;
}

export interface ProfessorDados {
  escolaId: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
  disciplinas?: string[];
  user_id?: string;
}

export async function adicionarProfessorPendente(d: ProfessorDados): Promise<string> {
  const { data, error } = await supabase.rpc('registar_professor_pendente', {
    p_escola_id: d.escolaId,
    p_nome: d.nome.trim(),
    p_email: d.email.trim().toLowerCase(),
    p_telefone: d.telefone?.trim() || null,
  });
  if (error) throw error;
  return data as string;
}

// Registo administrativo do professor (RPC SECURITY DEFINER)
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
      foto_url: dados.fotoUrl,
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

export async function definirEstadoProfessor(professorId: string, activo: boolean) {
  const { error } = await supabase
    .from('professores')
    .update({ activo })
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

export interface ConviteProfessor {
  token: string;
  expira_em: string;
}

export async function criarConviteProfessor(dados: {
  escolaId: string;
  nome: string;
  email: string;
  telefone?: string;
}): Promise<ConviteProfessor> {
  const { data, error } = await supabase.rpc('criar_convite_professor', {
    p_escola_id: dados.escolaId,
    p_nome: dados.nome.trim(),
    p_email: dados.email.trim().toLowerCase(),
    p_telefone: dados.telefone?.trim() || null,
  });
  if (error) throw error;
  const convite = Array.isArray(data) ? data[0] : data;
  if (!convite?.token) throw new Error('O convite não foi gerado.');
  return convite as ConviteProfessor;
}

export async function criarConviteParaProfessor(professorId: string): Promise<ConviteProfessor> {
  const { data, error } = await supabase.rpc('criar_convite_professor_por_id', {
    p_professor_id: professorId,
  });
  if (error) throw error;
  const convite = Array.isArray(data) ? data[0] : data;
  if (!convite?.token) throw new Error('O token do professor não foi gerado.');
  return convite as ConviteProfessor;
}

// Dados que a secretaria registou para o professor (só leitura, com token válido)
export interface DadosConvite {
  nome: string;
  email: string;
  telefone?: string | null;
  escola?: string | null;
  atribuicoes: { turma: string; disciplina: string }[];
  expiraEm?: string;
}

export async function obterDadosConvite(token: string): Promise<DadosConvite | null> {
  try {
    const { data, error } = await supabase.rpc('dados_convite_professor', { p_token: token.trim().toLowerCase() });
    const d = data as any;
    if (error || !d?.valido || !d?.nome || !d?.email) return null;
    return {
      nome: String(d.nome),
      email: String(d.email),
      telefone: d.telefone ?? null,
      escola: d.escola ?? null,
      atribuicoes: Array.isArray(d.atribuicoes) ? d.atribuicoes : [],
      expiraEm: d.expira_em ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function activarConviteProfessor(token: string): Promise<string> {
  const codigo = token.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(codigo)) throw new Error('O código do convite é inválido.');
  const { data, error } = await supabase.rpc('activar_convite_professor', { p_token: codigo });
  if (error) throw error;
  return data as string;
}
