import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { criarConviteParaProfessor, listarProfessores, obterEscolaDoUsuario } from '../../services/professores';

export default function ConvitesProfessores() {
  const router = useRouter();
  const [professores, setProfessores] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [convite, setConvite] = useState<{ nome: string; link: string; token: string; validade: string } | null>(null);
  const [erroGerar, setErroGerar] = useState('');
  const [copiado, setCopiado] = useState('');
  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try { const escolaId = await obterEscolaDoUsuario(); if (!escolaId) throw new Error('Escola não encontrada.'); const todos = await listarProfessores(escolaId); setProfessores((todos as any[]).filter((p) => !p.user_id && p.activo !== false)); }
    catch (e: any) { setErro(e?.message ?? 'Não foi possível carregar os professores pendentes.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const filtrados = useMemo(() => professores.filter((p) => `${p.nome ?? ''} ${p.email ?? ''}`.toLowerCase().includes(query.toLowerCase())), [professores, query]);
  async function gerar(professor: any) {
    setGerando(professor.id); setErroGerar(''); setConvite(null);
    try {
      const novo = await criarConviteParaProfessor(professor.id);
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://kulonga-app.vercel.app';
      const link = `${base}/activar-convite-professor?convite=${encodeURIComponent(novo.token)}`;
      const validade = new Date(novo.expira_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
      setConvite({ nome: professor.nome, link, token: novo.token, validade });
    } catch (e: any) { setErroGerar(e?.message ?? 'Não foi possível gerar o token. Tenta novamente.'); }
    finally { setGerando(null); }
  }
  async function copiar(texto: string, etiqueta: string) {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    try {
      if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(texto); setCopiado(etiqueta); setTimeout(() => setCopiado(''), 2500); return; }
    } catch {}
    try { await Share.share({ message: texto }); } catch {}
  }
  return <ScrollView contentContainerStyle={s.page}>
    <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={18} color="#55667A" /><Text style={s.backText}>Voltar</Text></TouchableOpacity>
    <Text style={s.kicker}>ACESSO DE PROFESSORES</Text><Text style={s.title}>Convites e tokens</Text><Text style={s.sub}>Pesquisa um professor pendente e gera o token de activação numa área separada da gestão.</Text>
    <View style={s.info}><Ionicons name="information-circle-outline" size={19} color="#123C69" /><Text style={s.infoText}>O token é único e válido durante 24 horas. A secretaria pode gerar um novo token quando necessário.</Text></View>
    <View style={s.search}><Ionicons name="search-outline" size={18} color="#55667A" /><TextInput value={query} onChangeText={setQuery} placeholder="Pesquisar professor pendente" style={s.input} /></View>
    {erroGerar ? <View style={s.erroBox}><Ionicons name="alert-circle-outline" size={19} color="#B83F28" /><Text style={s.erroBoxText}>{erroGerar}</Text></View> : null}
    {convite ? <View style={s.painel}>
      <View style={s.painelTop}><Ionicons name="checkmark-circle" size={22} color="#1A7358" /><Text style={s.painelTitulo}>Token criado para {convite.nome}</Text></View>
      <Text style={s.painelLabel}>CÓDIGO (enviar ao professor)</Text>
      <Text selectable style={s.codigo}>{convite.token}</Text>
      <Text style={s.painelLabel}>LINK DE ACTIVAÇÃO</Text>
      <Text selectable style={s.linkTxt}>{convite.link}</Text>
      <Text style={s.validade}>Válido até {convite.validade}. Gerar outro token anula este.</Text>
      <View style={s.acoes}>
        <TouchableOpacity style={s.btnPrim} onPress={() => copiar(convite.link, 'link')}><Text style={s.btnPrimTxt}>{copiado === 'link' ? 'Link copiado ✓' : 'Copiar link'}</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnSec} onPress={() => copiar(convite.token, 'codigo')}><Text style={s.btnSecTxt}>{copiado === 'codigo' ? 'Código copiado ✓' : 'Copiar código'}</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnSec} onPress={() => setConvite(null)}><Text style={s.btnSecTxt}>Fechar</Text></TouchableOpacity>
      </View>
    </View> : null}
    {loading ? <View style={s.state}><ActivityIndicator color="#123C69" /><Text style={s.muted}>A carregar pendentes…</Text></View> : erro ? <View style={s.state}><Text style={s.error}>{erro}</Text><TouchableOpacity onPress={carregar}><Text style={s.retry}>Tentar novamente</Text></TouchableOpacity></View> : filtrados.length === 0 ? <View style={s.empty}><Ionicons name="checkmark-circle-outline" size={30} color="#1A7358" /><Text style={s.emptyTitle}>Não existem professores pendentes</Text><Text style={s.muted}>Adiciona primeiro o professor na área de Gestão de Professores.</Text><TouchableOpacity style={s.manage} onPress={() => router.push('/(secretaria)/professores' as any)}><Text style={s.manageText}>Abrir gestão de professores</Text></TouchableOpacity></View> : filtrados.map((p) => <View key={p.id} style={s.card}><View style={s.avatar}><Text style={s.avatarText}>{(p.nome ?? 'P').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={s.name}>{p.nome}</Text><Text style={s.email}>{p.email}</Text><Text style={s.pending}>Convite pendente</Text></View><TouchableOpacity style={s.tokenBtn} onPress={() => gerar(p)} disabled={gerando === p.id}>{gerando === p.id ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="key-outline" size={16} color="#fff" /><Text style={s.tokenText}>Gerar token</Text></>}</TouchableOpacity></View>)}
  </ScrollView>;
}
const s = StyleSheet.create({ erroBox: { flexDirection: 'row', gap: 9, backgroundColor: '#FBE9E4', borderRadius: 13, padding: 13, marginBottom: 15 }, erroBoxText: { flex: 1, color: '#7A2616', fontSize: 13, lineHeight: 19 }, painel: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#1A7358', gap: 6 }, painelTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }, painelTitulo: { flex: 1, color: '#0B2A4A', fontWeight: '900', fontSize: 16 }, painelLabel: { color: '#55667A', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 6 }, codigo: { color: '#0B1F33', fontSize: 20, fontWeight: '800', letterSpacing: 1.5, backgroundColor: '#F6EFE3', borderRadius: 10, padding: 12 }, linkTxt: { color: '#123C69', fontSize: 12, lineHeight: 18 }, validade: { color: '#55667A', fontSize: 12, marginTop: 6 }, acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, btnPrim: { backgroundColor: '#123C69', borderRadius: 10, minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, btnPrimTxt: { color: '#fff', fontWeight: '800', fontSize: 13 }, btnSec: { backgroundColor: '#E4EEF8', borderRadius: 10, minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, btnSecTxt: { color: '#123C69', fontWeight: '800', fontSize: 13 }, page: { padding: 20, paddingBottom: 100, backgroundColor: '#F6EFE3', minHeight: '100%' }, back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }, backText: { color: '#55667A', fontWeight: '700' }, kicker: { color: '#8F5F00', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { color: '#0B2A4A', fontSize: 28, fontWeight: '900', marginTop: 5 }, sub: { color: '#55667A', lineHeight: 20, marginTop: 7, marginBottom: 16 }, info: { flexDirection: 'row', gap: 9, backgroundColor: '#E4EEF8', borderRadius: 13, padding: 13, marginBottom: 15 }, infoText: { flex: 1, color: '#52627A', fontSize: 12, lineHeight: 18 }, search: { backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 13, minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, input: { flex: 1, marginLeft: 8, color: '#0B2A4A' }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10, borderWidth: 1, borderColor: '#E3DACB' }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF1E8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#8F5F00', fontWeight: '900', fontSize: 18 }, name: { color: '#0B2A4A', fontWeight: '900' }, email: { color: '#55667A', fontSize: 12, marginTop: 3 }, pending: { color: '#8F5F00', fontSize: 11, fontWeight: '800', marginTop: 5 }, tokenBtn: { backgroundColor: '#123C69', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, tokenText: { color: '#fff', fontSize: 11, fontWeight: '800' }, state: { alignItems: 'center', padding: 35, gap: 10 }, muted: { color: '#55667A', textAlign: 'center', lineHeight: 19 }, error: { color: '#B91C1C', textAlign: 'center' }, retry: { color: '#123C69', fontWeight: '800' }, empty: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, padding: 25, gap: 8 }, emptyTitle: { color: '#0B2A4A', fontWeight: '900', fontSize: 16 }, manage: { marginTop: 8, backgroundColor: '#E4EEF8', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }, manageText: { color: '#123C69', fontWeight: '800', fontSize: 12 } });
