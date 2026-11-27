import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../services/supabase';
import { obterEscolaDoUsuario } from '../services/professores';
import { listarTurmas } from '../services/turmas';
import { corrigirEntrega, criarTrabalho, entregarTrabalho, listarEntregasDoTrabalho, listarTrabalhosDoAluno, listarTrabalhosDoProfessor, type EntregaTrabalho } from '../services/escola-comunicacao';

type Disciplina = { id: string; nome: string };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function dataValida(value: string) {
  if (!value.trim()) return null;
  const data = new Date(`${value.trim()}T23:59:59`);
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
}

export function TrabalhosProfessorScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prazo, setPrazo] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [entregas, setEntregas] = useState<Record<string, EntregaTrabalho[]>>({});
  const [corrigir, setCorrigir] = useState<EntregaTrabalho | null>(null);
  const [nota, setNota] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const escola = await obterEscolaDoUsuario();
      if (!user || !escola) throw new Error('Sessão ou escola não encontrada.');
      const prof = await supabase.from('professores').select('id').eq('user_id', user.id).single();
      if (prof.error) throw prof.error;
      const [lista, ts, ds] = await Promise.all([
        listarTrabalhosDoProfessor(prof.data.id),
        listarTurmas(escola),
        supabase.from('disciplinas').select('id,nome').eq('escola_id', escola).order('nome'),
      ]);
      if (ds.error) throw ds.error;
      setItems(lista); setTurmas(ts as any[]); setDisciplinas((ds.data ?? []) as Disciplina[]);
      setTurmaId((ts as any[])[0]?.id ?? ''); setDisciplinaId((ds.data ?? [])[0]?.id ?? '');
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar os trabalhos.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function guardar() {
    const prazoIso = dataValida(prazo);
    if (prazoIso === undefined) { Alert.alert('Prazo inválido', 'Usa o formato AAAA-MM-DD.'); return; }
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      const escola = await obterEscolaDoUsuario();
      const prof = user ? await supabase.from('professores').select('id').eq('user_id', user.id).single() : null;
      if (!user || !escola || !prof?.data?.id || !turmaId) throw new Error('Selecciona uma turma.');
      await criarTrabalho({ escolaId: escola, turmaId, professorId: prof.data.id, disciplinaId: disciplinaId || null, titulo, descricao, prazo: prazoIso });
      setModal(false); setTitulo(''); setDescricao(''); setPrazo(''); await carregar();
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível criar o trabalho.'); }
    finally { setSaving(false); }
  }

  async function abrirEntregas(id: string) {
    if (aberto === id) { setAberto(null); return; }
    try { setAberto(id); const lista = await listarEntregasDoTrabalho(id); setEntregas((old) => ({ ...old, [id]: lista })); }
    catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar as entregas.'); }
  }

  async function guardarCorrecao() {
    if (!corrigir) return;
    try {
      setSaving(true);
      await corrigirEntrega({ entregaId: corrigir.id, nota: Number(nota.replace(',', '.')), feedback });
      setEntregas((old) => ({ ...old, [corrigir.trabalho_id]: (old[corrigir.trabalho_id] ?? []).map((item) => item.id === corrigir.id ? { ...item, nota: Number(nota.replace(',', '.')), feedback, estado: 'corrigido' } : item) }));
      setCorrigir(null); setNota(''); setFeedback('');
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível guardar a correcção.'); }
    finally { setSaving(false); }
  }

  return <View style={s.screen}>
    <View style={s.titleRow}><View style={{ flex: 1 }}><Text style={s.title}>Trabalhos e tarefas</Text><Text style={s.subtitle}>Cria, acompanha e corrige actividades</Text></View><TouchableOpacity style={s.primary} onPress={() => setModal(true)}><Ionicons name="add" size={18} color="#fff" /><Text style={s.primaryText}>Novo</Text></TouchableOpacity></View>
    {loading ? <ActivityIndicator style={{ marginTop: 30 }} color="#123C69" /> : items.length ? items.map((item) => <View style={s.card} key={item.id}>
      <Text style={s.cardTitle}>{item.titulo}</Text><Text style={s.cardMeta}>{item.turmas?.nome ?? 'Turma'} · {item.disciplinas?.nome ?? 'Sem disciplina'}{item.prazo ? ` · Prazo ${new Date(item.prazo).toLocaleDateString('pt-PT')}` : ' · Sem prazo'}</Text><Text style={s.cardBody}>{item.descricao || 'Sem instruções adicionais.'}</Text>
      <TouchableOpacity style={s.secondary} onPress={() => abrirEntregas(item.id)}><Ionicons name="documents-outline" size={17} color="#123C69" /><Text style={s.secondaryText}>{aberto === item.id ? 'Ocultar entregas' : 'Ver entregas'}</Text></TouchableOpacity>
      {aberto === item.id && <View style={s.deliveries}>{(entregas[item.id] ?? []).length ? entregas[item.id].map((entrega) => <View key={entrega.id} style={s.delivery}><View style={{ flex: 1 }}><Text style={s.deliveryName}>{entrega.alunos?.nome_completo ?? 'Aluno'}</Text><Text style={s.deliveryMeta}>{entrega.estado}{entrega.nota !== null && entrega.nota !== undefined ? ` · ${entrega.nota}/20` : ''}</Text>{entrega.resposta ? <Text style={s.deliveryAnswer}>{entrega.resposta}</Text> : null}{entrega.feedback ? <Text style={s.feedback}>Feedback: {entrega.feedback}</Text> : null}</View><TouchableOpacity style={s.smallPrimary} onPress={() => { setCorrigir(entrega); setNota(entrega.nota?.toString() ?? ''); setFeedback(entrega.feedback ?? ''); }}><Text style={s.smallPrimaryText}>Corrigir</Text></TouchableOpacity></View>) : <Text style={s.emptyText}>Ainda não há entregas.</Text>}</View>}
    </View>) : <Empty title="Ainda não criaste trabalhos" text="Publica a primeira tarefa para uma turma." />}
    <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}><View style={s.overlay}><View style={s.modal}><Text style={s.modalTitle}>Novo trabalho</Text><TextInput style={s.input} placeholder="Título do trabalho" value={titulo} onChangeText={setTitulo} /><TextInput style={[s.input, s.multiline]} placeholder="Instruções para os alunos" value={descricao} onChangeText={setDescricao} multiline /><TextInput style={s.input} placeholder="Prazo (AAAA-MM-DD), opcional" value={prazo} onChangeText={setPrazo} keyboardType="numbers-and-punctuation" /><Text style={s.label}>Turma</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{turmas.map((t) => <TouchableOpacity key={t.id} style={[s.pill, turmaId === t.id && s.pillActive]} onPress={() => setTurmaId(t.id)}><Text style={[s.pillText, turmaId === t.id && s.pillTextActive]}>{t.nome}</Text></TouchableOpacity>)}</ScrollView><Text style={s.label}>Disciplina</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{disciplinas.map((d) => <TouchableOpacity key={d.id} style={[s.pill, disciplinaId === d.id && s.pillActive]} onPress={() => setDisciplinaId(d.id)}><Text style={[s.pillText, disciplinaId === d.id && s.pillTextActive]}>{d.nome}</Text></TouchableOpacity>)}</ScrollView><View style={s.actions}><TouchableOpacity onPress={() => setModal(false)} disabled={saving}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={s.primary} onPress={guardar} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Criar</Text>}</TouchableOpacity></View></View></View></Modal>
    <Modal visible={Boolean(corrigir)} transparent animationType="slide" onRequestClose={() => setCorrigir(null)}><View style={s.overlay}><View style={s.modal}><Text style={s.modalTitle}>Corrigir entrega</Text><TextInput style={s.input} placeholder="Nota de 0 a 20" value={nota} onChangeText={setNota} keyboardType="decimal-pad" /><TextInput style={[s.input, s.multiline]} placeholder="Feedback para o aluno" value={feedback} onChangeText={setFeedback} multiline /><View style={s.actions}><TouchableOpacity onPress={() => setCorrigir(null)} disabled={saving}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={s.primary} onPress={guardarCorrecao} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Guardar</Text>}</TouchableOpacity></View></View></View></Modal>
  </View>;
}

export function TrabalhosAlunoScreen() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [alunoId, setAlunoId] = useState(''); const [userId, setUserId] = useState(''); const [respostas, setRespostas] = useState<Record<string, string>>({}); const [ficheiros, setFicheiros] = useState<Record<string, DocumentPicker.DocumentPickerAsset>>({});
  useEffect(() => { (async () => { try { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sessão não encontrada.'); setUserId(user.id); const aluno = await supabase.from('alunos').select('id').eq('user_id', user.id).single(); if (aluno.error) throw aluno.error; setAlunoId(aluno.data.id); setItems(await listarTrabalhosDoAluno(aluno.data.id)); } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar as tarefas.'); } finally { setLoading(false); } })(); }, []);
  async function escolherFicheiro(id: string) {
    const result = await DocumentPicker.getDocumentAsync({ type: Array.from(ALLOWED_UPLOAD_TYPES), copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];
    if (!file.mimeType || !ALLOWED_UPLOAD_TYPES.has(file.mimeType)) {
      Alert.alert('Formato não permitido', 'Aceitamos PDF, imagens JPG/PNG, texto, Word e Excel.');
      return;
    }
    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
      Alert.alert('Ficheiro demasiado grande', 'O tamanho máximo é 10 MB.');
      return;
    }
    setFicheiros((old) => ({ ...old, [id]: file }));
  }
  async function entregar(id: string) {
    try {
      const file = ficheiros[id]; let ficheiroUrl: string | null = null;
      if (file) {
        if (!file.mimeType || !ALLOWED_UPLOAD_TYPES.has(file.mimeType)) throw new Error('Formato de ficheiro não permitido.');
        if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) throw new Error('O ficheiro ultrapassa o limite de 10 MB.');
        const caminho = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
        const escolaResult = await supabase.from('alunos').select('escola_id').eq('id', alunoId).single();
        if (escolaResult.error || !escolaResult.data?.escola_id) throw new Error('Não foi possível validar a escola.');
        const path = `${escolaResult.data.escola_id}/${id}/${userId}/${Date.now()}-${caminho}`;
        const blob = await fetch(file.uri).then((response) => response.arrayBuffer());
        const upload = await supabase.storage.from('trabalhos-entregas').upload(path, blob, { contentType: file.mimeType, upsert: false });
        if (upload.error) throw upload.error;
        ficheiroUrl = path;
      }
      await entregarTrabalho({ trabalhoId: id, alunoId, resposta: respostas[id], ficheiroUrl });
      Alert.alert('Entregue', 'A tua resposta foi enviada ao professor.'); setItems((old) => old.map((item) => item.id === id ? { ...item, entrega_local: true } : item));
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível entregar.'); }
  }
  return <View style={s.screen}><Text style={s.title}>Trabalhos e tarefas</Text><Text style={s.subtitle}>Consulta prazos, entrega respostas e vê feedback</Text>{loading ? <ActivityIndicator style={{ marginTop: 30 }} color="#123C69" /> : items.length ? items.map((item) => <View style={s.card} key={item.id}><Text style={s.cardTitle}>{item.titulo}</Text><Text style={s.cardMeta}>{item.disciplinas?.nome ?? 'Disciplina'}{item.prazo ? ` · Prazo ${new Date(item.prazo).toLocaleDateString('pt-PT')}` : ''}</Text><Text style={s.cardBody}>{item.descricao || 'Sem instruções adicionais.'}</Text><TextInput style={[s.input, s.multiline]} placeholder="Escreve a tua resposta" value={respostas[item.id] ?? ''} onChangeText={(value) => setRespostas((old) => ({ ...old, [item.id]: value }))} multiline /><View style={s.fileRow}><TouchableOpacity style={s.secondary} onPress={() => escolherFicheiro(item.id)}><Ionicons name="attach-outline" size={17} color="#123C69" /><Text style={s.secondaryText}>{ficheiros[item.id] ? 'Ficheiro escolhido' : 'Anexar ficheiro'}</Text></TouchableOpacity><TouchableOpacity style={[s.primary, { alignSelf: 'flex-start' }]} onPress={() => entregar(item.id)}><Ionicons name="send-outline" size={17} color="#fff" /><Text style={s.primaryText}>Enviar</Text></TouchableOpacity></View></View>) : <Empty title="Sem tarefas pendentes" text="Quando um professor publicar um trabalho, ele aparecerá aqui." />}</View>;
}

function Empty({ title, text }: { title: string; text: string }) { return <View style={s.empty}><Ionicons name="school-outline" size={36} color="#7A8CA0" /><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyText}>{text}</Text></View>; }

const s = StyleSheet.create({ screen: { flex: 1, padding: 24, backgroundColor: '#F6EFE3' }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, title: { color: '#0B2A4A', fontSize: 26, fontWeight: '900' }, subtitle: { color: '#55667A', marginTop: 5 }, primary: { minHeight: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#123C69', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, primaryText: { color: '#fff', fontWeight: '800' }, secondary: { minHeight: 38, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#E4EEF8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, alignSelf: 'flex-start' }, secondaryText: { color: '#123C69', fontWeight: '800' }, fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E3DACB' }, cardTitle: { color: '#0B2A4A', fontSize: 16, fontWeight: '800' }, cardMeta: { color: '#123C69', fontSize: 12, fontWeight: '700', marginTop: 6 }, cardBody: { color: '#475569', lineHeight: 21, marginTop: 9, marginBottom: 14 }, empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 }, emptyTitle: { color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 14 }, emptyText: { color: '#55667A', textAlign: 'center', marginTop: 6, lineHeight: 20 }, overlay: { flex: 1, backgroundColor: '#0F172A88', justifyContent: 'flex-end' }, modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, maxHeight: '90%' }, modalTitle: { fontSize: 20, fontWeight: '900', color: '#0B2A4A', marginBottom: 16 }, input: { borderWidth: 1, borderColor: '#CFC4B0', borderRadius: 10, minHeight: 48, padding: 12, marginBottom: 12, fontSize: 15 }, multiline: { minHeight: 100, textAlignVertical: 'top' }, label: { color: '#334155', fontWeight: '800', marginBottom: 8, marginTop: 4 }, pill: { borderWidth: 1, borderColor: '#CFC4B0', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 10 }, pillActive: { backgroundColor: '#E4EEF8', borderColor: '#123C69' }, pillText: { color: '#55667A', fontWeight: '700' }, pillTextActive: { color: '#123C69' }, actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 18, marginTop: 18 }, cancel: { color: '#55667A', fontWeight: '700' }, deliveries: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E3DACB', paddingTop: 8 }, delivery: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }, deliveryName: { color: '#0B2A4A', fontWeight: '800' }, deliveryMeta: { color: '#123C69', fontSize: 12, marginTop: 3, textTransform: 'capitalize' }, deliveryAnswer: { color: '#475569', marginTop: 7, lineHeight: 19 }, feedback: { color: '#1A7358', marginTop: 5, fontSize: 12 }, smallPrimary: { backgroundColor: '#123C69', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'center' }, smallPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '800' } });
