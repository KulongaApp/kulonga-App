import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { criarAviso, listarAvisos, listarNotificacoes, marcarNotificacaoLida } from '../services/escola-comunicacao';
import { obterEscolaDoUsuario } from '../services/professores';

type Papel = 'secretaria' | 'professor' | 'aluno' | 'encarregado';

async function escolaDoUtilizador() {
  const staff = await obterEscolaDoUsuario().catch(() => null);
  if (staff) return staff;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: aluno } = await supabase.from('alunos').select('escola_id').eq('user_id', user.id).maybeSingle();
  if (aluno?.escola_id) return aluno.escola_id;
  const { data: enc } = await supabase.from('encarregados').select('id').eq('user_id', user.id).maybeSingle();
  if (!enc) return null;
  const { data: rel } = await supabase.from('encarregado_aluno').select('alunos(escola_id)').eq('encarregado_id', enc.id).limit(1).maybeSingle();
  return (rel as any)?.alunos?.escola_id ?? null;
}

export function AvisosScreen({ papel }: { papel: Papel }) {
  const [avisos, setAvisos] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false); const [titulo, setTitulo] = useState(''); const [mensagem, setMensagem] = useState(''); const [schoolId, setSchoolId] = useState<string | null>(null);
  const podePublicar = papel === 'secretaria' || papel === 'professor';
  async function carregar() { try { const id = await escolaDoUtilizador(); setSchoolId(id); if (id) setAvisos(await listarAvisos(id)); } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar os avisos.'); } finally { setLoading(false); } }
  useEffect(() => { carregar(); }, []);
  async function publicar() { try { const { data: { user } } = await supabase.auth.getUser(); if (!user || !schoolId) throw new Error('Sessão ou escola não encontrada.'); await criarAviso({ escolaId: schoolId, autorId: user.id, autorPapel: papel as 'secretaria' | 'professor', titulo, mensagem, publico: 'escola' }); setTitulo(''); setMensagem(''); setModal(false); await carregar(); } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível publicar o aviso.'); } }
  return <View style={s.screen}><View style={s.titleRow}><View><Text style={s.title}>Avisos</Text><Text style={s.subtitle}>Comunicação oficial da escola</Text></View>{podePublicar && <TouchableOpacity style={s.primarySmall} onPress={() => setModal(true)}><Ionicons name="add" size={18} color="#fff" /><Text style={s.primaryText}>Novo aviso</Text></TouchableOpacity>}</View>{loading ? <ActivityIndicator style={{ marginTop: 32 }} color="#2457D6" /> : avisos.length ? avisos.map((a) => <View key={a.id} style={s.card}><View style={s.cardTop}><Ionicons name="megaphone-outline" size={20} color="#E66A24" /><Text style={s.cardDate}>{new Date(a.publicado_em).toLocaleDateString('pt-PT')}</Text></View><Text style={s.cardTitle}>{a.titulo}</Text><Text style={s.cardMessage}>{a.mensagem}</Text></View>) : <View style={s.empty}><Ionicons name="megaphone-outline" size={34} color="#94A3B8" /><Text style={s.emptyTitle}>Ainda não há avisos</Text><Text style={s.emptyText}>Quando a escola publicar um comunicado, aparecerá aqui.</Text></View>}
    <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}><View style={s.overlay}><View style={s.modal}><Text style={s.modalTitle}>Novo aviso escolar</Text><TextInput style={s.input} placeholder="Título" value={titulo} onChangeText={setTitulo} /><TextInput style={[s.input, s.multiline]} placeholder="Mensagem" value={mensagem} onChangeText={setMensagem} multiline /><View style={s.modalActions}><TouchableOpacity onPress={() => setModal(false)}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={s.primarySmall} onPress={publicar}><Text style={s.primaryText}>Publicar</Text></TouchableOpacity></View></View></View></Modal>
  </View>;
}

export function NotificacoesScreen() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  async function carregar() { try { setItems(await listarNotificacoes()); } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar as notificações.'); } finally { setLoading(false); } }
  useEffect(() => { carregar(); }, []);
  async function ler(item: any) { if (!item.lida_em) { await marcarNotificacaoLida(item.id); setItems((old) => old.map((n) => n.id === item.id ? { ...n, lida_em: new Date().toISOString() } : n)); } }
  return <View style={s.screen}><Text style={s.title}>Notificações</Text><Text style={s.subtitle}>Acompanha o que precisa da tua atenção</Text>{loading ? <ActivityIndicator style={{ marginTop: 32 }} color="#2457D6" /> : items.length ? items.map((item) => <TouchableOpacity key={item.id} style={[s.notification, !item.lida_em && s.unread]} onPress={() => ler(item)}><View style={s.notificationIcon}><Ionicons name={item.lida_em ? 'notifications-outline' : 'notifications'} size={19} color={item.lida_em ? '#64748B' : '#2457D6'} /></View><View style={{ flex: 1 }}><Text style={s.notificationTitle}>{item.titulo}</Text><Text style={s.notificationMessage}>{item.mensagem}</Text><Text style={s.notificationDate}>{new Date(item.criada_em).toLocaleString('pt-PT')}</Text></View>{!item.lida_em && <View style={s.dot} />}</TouchableOpacity>) : <View style={s.empty}><Ionicons name="notifications-off-outline" size={34} color="#94A3B8" /><Text style={s.emptyTitle}>Sem notificações</Text><Text style={s.emptyText}>As novidades importantes aparecerão aqui.</Text></View>}</View>;
}

const s = StyleSheet.create({ screen: { flex: 1, padding: 24, backgroundColor: '#F5F7FB' }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, title: { color: '#14213D', fontSize: 26, fontWeight: '900' }, subtitle: { color: '#64748B', marginTop: 5 }, primarySmall: { minHeight: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#2457D6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, primaryText: { color: '#fff', fontWeight: '800' }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, cardDate: { color: '#94A3B8', fontSize: 12 }, cardTitle: { color: '#14213D', fontSize: 16, fontWeight: '800' }, cardMessage: { color: '#475569', lineHeight: 21, marginTop: 7 }, empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 }, emptyTitle: { color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 14 }, emptyText: { color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20 }, overlay: { flex: 1, backgroundColor: '#0F172A88', justifyContent: 'flex-end' }, modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 }, modalTitle: { fontSize: 20, fontWeight: '900', color: '#14213D', marginBottom: 16 }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, minHeight: 48, padding: 12, marginBottom: 12, fontSize: 15 }, multiline: { minHeight: 120, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 }, cancel: { color: '#64748B', fontWeight: '700' }, notification: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 }, unread: { borderColor: '#BFD0FF', backgroundColor: '#F8FAFF' }, notificationIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center' }, notificationTitle: { color: '#14213D', fontWeight: '800' }, notificationMessage: { color: '#64748B', marginTop: 4, lineHeight: 18 }, notificationDate: { color: '#94A3B8', fontSize: 11, marginTop: 7 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E66A24', marginTop: 5 } });
