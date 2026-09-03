// services/escolas.ts — FASE 5
import { supabase } from './supabase';

export interface EscolaDados {
  nome: string;
  provincia: string;
  municipio: string;
  endereco?: string;
  telefone: string;
  email: string;
  direccaoNome: string;
  direccaoTelefone: string;
}

// Cria escola + director (usa RPC SECURITY DEFINER — resolve o bootstrap de RLS)
export async function registarEscola(d: EscolaDados): Promise<string> {
  const { data, error } = await supabase.rpc('registar_escola', {
    p_nome: d.nome,
    p_provincia: d.provincia,
    p_municipio: d.municipio,
    p_endereco: d.endereco ?? null,
    p_telefone: d.telefone,
    p_email: d.email,
    p_direccao_nome: d.direccaoNome,
    p_direccao_telefone: d.direccaoTelefone,
  });
  if (error) throw error;
  return data as string;
}

export async function buscarEscola(escolaId: string) {
  const { data, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('id', escolaId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarEscola(
  escolaId: string,
  dados: Partial<EscolaDados>
) {
  const { error } = await supabase
    .from('escolas')
    .update({
      nome: dados.nome,
      provincia: dados.provincia,
      municipio: dados.municipio,
      endereco: dados.endereco,
      telefone: dados.telefone,
      email: dados.email,
      direccao_nome: dados.direccaoNome,
      direccao_telefone: dados.direccaoTelefone,
      actualizada_em: new Date().toISOString(),
    })
    .eq('id', escolaId);
  if (error) throw error;
}

// Directório público de escolas (para o professor escolher a sua)
export async function listarEscolas() {
  const { data, error } = await supabase
    .from('escolas')
    .select('id, nome, provincia, municipio');
  if (error) throw error;
  return data;
}
