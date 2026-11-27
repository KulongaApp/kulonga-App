import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { actualizarProfessor, definirEstadoProfessor, listarProfessores, obterEscolaDoUsuario, removerProfessor } from '../../services/professores';

export default function ProfessoresSecretaria() {
  const router = useRouter();
  const [professores, setProfessores] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aProcessar, setAProcessar] = useState<string | null>(null);
  const [editarId, setEditarId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      setProfessores((await listarProfessores(escolaId)) as any[]);
    } catch (e: any) { setErro(e?.message ?? 'Não foi possível carregar os professores.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = useMemo(() => professores.filter((p) => `${p.nome ?? ''} ${p.email ?? ''}`.toLowerCase().includes(query.toLowerCase())), [professores, query]);
  const iniciarEdicao = (p: any) => { setEditarId(p.id); setForm({ nome: p.nome ?? '', email: p.email ?? '', telefone: p.telefone ?? '' }); };
  const guardarEdicao = async () => {
    if (!editarId || !form.nome.trim() || !form.email.trim()) return Alert.alert('Dados incompletos', 'Indica o nome e o email institucional.');
    setAProcessar(editarId);
    try { await actualizarProfessor(editarId, form); setEditarId(null); await carregar(); }
    catch (e: any) { Alert.alert('Não foi possível guardar', e?.message ?? 'Tenta novamente.'); }
    finally { setAProcessar(null); }
  };
  const alternarEstado = async (p: any) => {
    setAProcessar(p.id);
    try { await definirEstadoProfessor(p.id, p.activo === false); await carregar(); }
    catch (e: any) { Alert.alert('Não foi possível actualizar', e?.message ?? 'Verifica as permissões da secretaria.'); }
    finally { setAProcessar(null); }
  };
  const apagar = (p: any) => Alert.alert('Remover professor', `Queres remover ${p.nome ?? 'este professor'} da escola?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: async () => { setAProcessar(p.id); try { await removerProfessor(p.id); await carregar(); } catch (e: any) { Alert.alert('Não foi possível remover', e?.message ?? 'Tenta novamente.'); } finally { setAProcessar(null); } } },
  ]);

  return <ScrollView contentContainerStyle={s.page}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.kicker}>GESTÃO ESCOLAR</Text><Text style={s.title}>Professores</Text><Text style={s.sub}>Pesquisa, adiciona, edita e controla o acesso dos professores.</Text></View><TouchableOpacity style={s.addBtn} onPress={() => router.push('/(secretaria)/adicionar-professor' as any)}><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={s.addTxt}>Adicionar</Text></TouchableOpacity></View>
    <View style={s.search}><Ionicons name="search-outline" size={18} color="#55667A" /><TextInput value={query} onChangeText={setQuery} placeholder="Pesquisar por nome ou email" style={s.input} /></View>
    <TouchableOpacity style={s.tokensLink} onPress={() => router.push('/(secretaria)/convites-professores' as any)}><Ionicons name="key-outline" size={18} color="#123C69" /><View style={{ flex: 1 }}><Text style={s.tokensTitle}>Convites e tokens de professores</Text><Text style={s.tokensSub}>Área separada para pesquisar pendentes e gerar ou regenerar o token de activação.</Text></View><Ionicons name="chevron-forward" size={18} color="#123C69" /></TouchableOpacity>
    {loading ? <View style={s.state}><ActivityIndicator color="#123C69" /><Text style={s.muted}>A carregar professores…</Text></View> : erro ? <View style={s.state}><Text style={s.error}>{erro}</Text><TouchableOpacity onPress={carregar}><Text style={s.retry}>Tentar novamente</Text></TouchableOpacity></View> : filtrados.length === 0 ? <Text style={s.empty}>Nenhum professor encontrado.</Text> : filtrados.map((p) => <View key={p.id} style={s.card}>
      <TouchableOpacity style={s.cardTop} onPress={() => Alert.alert(p.nome ?? 'Professor', `${p.email ?? 'Sem email'}\n${p.telefone ?? 'Sem telefone'}\n${p.user_id ? 'Conta associada' : 'Ainda sem conta activa'}`)}><View style={s.avatar}><Text style={s.avatarText}>{(p.nome ?? 'P').split(' ').slice(0, 2).map((x: string) => x[0]).join('').toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={s.name}>{p.nome}</Text><Text style={s.email}>{p.email ?? 'Sem email'}</Text><Text style={[s.status, p.activo === false ? s.off : p.user_id ? s.active : s.pending]}>{p.activo === false ? 'Desactivado' : p.user_id ? 'Conta activa' : 'Convite pendente'}</Text></View><Ionicons name="chevron-forward" size={18} color="#7A8CA0" /></TouchableOpacity>
      {editarId === p.id ? <View style={s.editBox}><TextInput value={form.nome} onChangeText={(v) => setForm({ ...form, nome: v })} placeholder="Nome completo" style={s.editInput} /><TextInput value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="Email institucional" autoCapitalize="none" style={s.editInput} /><TextInput value={form.telefone} onChangeText={(v) => setForm({ ...form, telefone: v })} placeholder="Telemóvel" style={s.editInput} /><View style={s.editActions}><TouchableOpacity onPress={() => setEditarId(null)}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={s.save} onPress={guardarEdicao}><Text style={s.saveText}>Guardar</Text></TouchableOpacity></View></View> : <View style={s.actions}><TouchableOpacity onPress={() => iniciarEdicao(p)}><Ionicons name="create-outline" size={16} color="#123C69" /><Text style={s.actionText}>Editar</Text></TouchableOpacity><TouchableOpacity onPress={() => alternarEstado(p)} disabled={aProcessar === p.id}><Ionicons name={p.activo === false ? 'lock-open-outline' : 'lock-closed-outline'} size={16} color="#8F5F00" /><Text style={s.actionText}>{p.activo === false ? 'Desbloquear' : 'Bloquear'}</Text></TouchableOpacity><TouchableOpacity onPress={() => apagar(p)} disabled={aProcessar === p.id}><Ionicons name="trash-outline" size={16} color="#B91C1C" /><Text style={[s.actionText, { color: '#B91C1C' }]}>Remover</Text></TouchableOpacity></View>}
    </View>)}
  </ScrollView>;
}

const s = StyleSheet.create({ page: { padding: 20, paddingBottom: 100, backgroundColor: '#F6EFE3', minHeight: '100%' }, header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }, kicker: { color: '#8F5F00', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { color: '#0B2A4A', fontSize: 28, fontWeight: '900', marginTop: 4 }, sub: { color: '#55667A', marginTop: 6, lineHeight: 20 }, addBtn: { backgroundColor: '#123C69', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 6 }, addTxt: { color: '#fff', fontWeight: '800', fontSize: 12 }, search: { backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 13, minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, input: { flex: 1, marginLeft: 8, color: '#0B2A4A' }, tokensLink: { backgroundColor: '#E4EEF8', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }, tokensTitle: { color: '#123C69', fontWeight: '900', fontSize: 13 }, tokensSub: { color: '#52627A', fontSize: 11, marginTop: 4, lineHeight: 16 }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E3DACB' }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E4EEF8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#123C69', fontWeight: '900' }, name: { color: '#0B2A4A', fontWeight: '900' }, email: { color: '#55667A', fontSize: 12, marginTop: 3 }, status: { fontSize: 11, fontWeight: '800', marginTop: 5 }, active: { color: '#1A7358' }, pending: { color: '#8F5F00' }, off: { color: '#B91C1C' }, actions: { borderTopWidth: 1, borderTopColor: '#E3DACB', marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }, actionsText: { color: '#123C69' }, actionText: { color: '#123C69', fontSize: 11, fontWeight: '800', marginLeft: 4 }, actionsTouchable: { flexDirection: 'row', alignItems: 'center' }, editBox: { borderTopWidth: 1, borderTopColor: '#E3DACB', marginTop: 12, paddingTop: 10, gap: 8 }, editInput: { backgroundColor: '#F6EFE3', borderRadius: 9, paddingHorizontal: 10, minHeight: 40, color: '#0B2A4A' }, editActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 3 }, cancel: { color: '#55667A', fontWeight: '800' }, save: { backgroundColor: '#123C69', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 }, saveText: { color: '#fff', fontWeight: '800' }, state: { alignItems: 'center', padding: 35, gap: 10 }, muted: { color: '#55667A' }, error: { color: '#B91C1C', textAlign: 'center' }, retry: { color: '#123C69', fontWeight: '800' }, empty: { color: '#55667A', textAlign: 'center', padding: 30 } });
