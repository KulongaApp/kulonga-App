import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listarTurmas, listarAlunosTurma } from '../../services/turmas';
import { obterEscolaDoUsuario } from '../../services/professores';
import { guardarAssiduidade, EstadoAssiduidade } from '../../services/assiduidade';

type Aluno = { id: string; nome_completo: string };
const ESTADOS: { valor: EstadoAssiduidade; label: string; cor: string }[] = [
  { valor: 'presente', label: 'Presente', cor: '#15803D' },
  { valor: 'ausente', label: 'Falta', cor: '#B91C1C' },
  { valor: 'atrasado', label: 'Atrasado', cor: '#B45309' },
  { valor: 'justificado', label: 'Justificado', cor: '#1D5C8A' },
];

function dataHoje() { return new Date().toISOString().slice(0, 10); }

export default function Assiduidade() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState('');
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoAssiduidade>>({});
  const [dataSessao, setDataSessao] = useState(dataHoje());
  const [carregar, setCarregar] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { (async () => {
    try { const escolaId = await obterEscolaDoUsuario(); const lista = escolaId ? await listarTurmas(escolaId) : []; setTurmas(lista as any[]); setTurmaId((lista as any[])[0]?.id ?? ''); }
    catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar as turmas.'); }
    finally { setCarregar(false); }
  })(); }, []);

  useEffect(() => { if (!turmaId) return; (async () => {
    try { const rows = await listarAlunosTurma(turmaId); const lista = (rows as any[]).map((r) => r.alunos ?? r) as Aluno[]; setAlunos(lista); setEstados(Object.fromEntries(lista.map((a) => [a.id, 'presente']))); }
    catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível carregar os alunos.'); }
  })(); }, [turmaId]);

  const contagem = useMemo(() => ESTADOS.map((e) => ({ ...e, total: alunos.filter((a) => estados[a.id] === e.valor).length })), [alunos, estados]);
  async function guardar() {
    if (!turmaId || !alunos.length) return;
    setGuardando(true);
    try { await guardarAssiduidade({ turmaId, dataSessao, registos: alunos.map((a) => ({ alunoId: a.id, estado: estados[a.id] ?? 'presente' })) }); Alert.alert('Assiduidade guardada', 'A sessão foi registada e pode ser corrigida mais tarde.'); }
    catch (e: any) { Alert.alert('Erro', e?.message ?? 'Não foi possível guardar a assiduidade.'); }
    finally { setGuardando(false); }
  }

  return <SafeAreaView style={s.safe}>
    <View style={s.header}><TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar"><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity><View style={s.headerCopy}><Text style={s.title}>Assiduidade</Text><Text style={s.sub}>Registo real de presença — separado do MAC</Text></View></View>
    {carregar ? <ActivityIndicator style={{ marginTop: 40 }} color="#1D5C8A" /> : <ScrollView contentContainerStyle={s.body}>
      <Text style={s.label}>Turma</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>{turmas.map((t) => <TouchableOpacity key={t.id} style={[s.pill, turmaId === t.id && s.pillActive]} onPress={() => setTurmaId(t.id)}><Text style={[s.pillText, turmaId === t.id && s.pillTextActive]}>{t.nome}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={s.label}>Data da sessão</Text><Text style={s.date}>{dataSessao}</Text>
      <View style={s.summary}>{contagem.map((e) => <View key={e.valor} style={s.summaryItem}><Text style={[s.summaryNumber, { color: e.cor }]}>{e.total}</Text><Text style={s.summaryLabel}>{e.label}</Text></View>)}</View>
      {alunos.map((a, i) => <View key={a.id} style={s.student}><View style={s.avatar}><Text style={s.avatarText}>{i + 1}</Text></View><Text style={s.studentName}>{a.nome_completo}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{ESTADOS.map((e) => <TouchableOpacity key={e.valor} style={[s.status, estados[a.id] === e.valor && { backgroundColor: e.cor, borderColor: e.cor }]} onPress={() => setEstados((old) => ({ ...old, [a.id]: e.valor }))}><Text style={[s.statusText, estados[a.id] === e.valor && s.statusTextActive]}>{e.label}</Text></TouchableOpacity>)}</ScrollView></View>)}
      {!alunos.length && <Text style={s.empty}>Esta turma ainda não tem alunos matriculados.</Text>}
      <TouchableOpacity style={s.save} onPress={guardar} disabled={guardando || !alunos.length}>{guardando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={s.saveText}>Guardar assiduidade</Text></>}</TouchableOpacity>
    </ScrollView>}
  </SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8FAFC' }, header: { backgroundColor: '#1D5C8A', padding: 18, flexDirection: 'row', alignItems: 'center' }, headerCopy: { marginLeft: 12 }, title: { color: '#fff', fontSize: 20, fontWeight: '800' }, sub: { color: '#D9E7FF', fontSize: 12, marginTop: 3 }, body: { padding: 16, paddingBottom: 40 }, label: { color: '#334155', fontWeight: '800', marginTop: 8, marginBottom: 8 }, date: { backgroundColor: '#fff', borderRadius: 10, padding: 13, color: '#111827', fontWeight: '600', borderWidth: 1, borderColor: '#E2E8F0' }, pills: { gap: 8, paddingBottom: 8 }, pill: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' }, pillActive: { backgroundColor: '#E8F1F8', borderColor: '#1D5C8A' }, pillText: { color: '#64748B', fontWeight: '700' }, pillTextActive: { color: '#1D5C8A' }, summary: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginVertical: 16, justifyContent: 'space-around', borderWidth: 1, borderColor: '#E2E8F0' }, summaryItem: { alignItems: 'center' }, summaryNumber: { fontSize: 22, fontWeight: '800' }, summaryLabel: { color: '#64748B', fontSize: 11, marginTop: 3 }, student: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' }, avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F1F8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, avatarText: { color: '#1D5C8A', fontWeight: '800' }, studentName: { color: '#111827', fontWeight: '700', marginBottom: 10 }, status: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8, marginRight: 6 }, statusText: { color: '#64748B', fontSize: 11, fontWeight: '700' }, statusTextActive: { color: '#fff' }, empty: { textAlign: 'center', color: '#64748B', padding: 30 }, save: { minHeight: 50, marginTop: 10, borderRadius: 12, backgroundColor: '#15803D', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, saveText: { color: '#fff', fontWeight: '800' } });
