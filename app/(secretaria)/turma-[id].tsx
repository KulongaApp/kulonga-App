import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { buscarTurma, listarAlunosTurma } from '../../services/turmas';

export default function TurmaDetalhe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [turma, setTurma] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error('ID em falta');
        const t = await buscarTurma(id as string);
        setTurma(t);
        const a = await listarAlunosTurma(id as string);
        setAlunos((a as any[]).map((r: any) => r.alunos ?? r));
      } catch (e: any) { setErro(e?.message ?? 'Turma não encontrada'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 40 }} color="#1D5C8A" /></SafeAreaView>;
  if (erro || !turma) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.erro}>{erro}</Text><TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#1D5C8A' }}>Voltar</Text></TouchableOpacity></View></SafeAreaView>;

  const totalM = alunos.filter(a => a.genero === 'M').length;
  const totalF = alunos.filter(a => a.genero === 'F').length;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1D1D1F" /></TouchableOpacity>
          <Text style={s.headerTitulo}>Detalhe da Turma</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.turmaHeader}>
          <View style={s.turmaIcone}><Text style={s.turmaIconeTexto}>{turma.nome}</Text></View>
          <Text style={s.turmaNome}>{turma.nome}</Text>
          <Text style={s.turmaSerie}>{turma.serie ?? ''} · {turma.ano_lectivo}</Text>
        </View>
        <View style={s.metricas}>
          <View style={s.metrica}><Text style={s.metricaNumero}>{alunos.length}</Text><Text style={s.metricaLabel}>Alunos</Text></View>
          <View style={s.metricaDivider} />
          <View style={s.metrica}><Text style={[s.metricaNumero, { color: '#1D5C8A' }]}>{totalM}</Text><Text style={s.metricaLabel}>Masculino</Text></View>
          <View style={s.metricaDivider} />
          <View style={s.metrica}><Text style={[s.metricaNumero, { color: '#C8511B' }]}>{totalF}</Text><Text style={s.metricaLabel}>Feminino</Text></View>
        </View>
        <View style={s.card}>
          <Text style={s.cardTitulo}>Alunos ({alunos.length})</Text>
          {alunos.length === 0 ? <Text style={{ color: '#6B7280' }}>Nenhum aluno matriculado</Text> : alunos.map((a: any) => (
            <TouchableOpacity key={a.id} style={s.alunoRow} onPress={() => router.push(`/(secretaria)/aluno-${a.id}` as any)}>
              <View style={[s.alunoAvatar, { backgroundColor: a.genero === 'M' ? '#1D5C8A' : '#C8511B' }]}><Text style={s.alunoAvatarTexto}>{a.nome_completo?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Text></View>
              <Text style={s.alunoNome}>{a.nome_completo}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  erro: { fontSize: 16, color: '#DC2626', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  turmaHeader: { alignItems: 'center', marginBottom: 20 },
  turmaIcone: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#1D5C8A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  turmaIconeTexto: { color: '#fff', fontSize: 22, fontWeight: '800' },
  turmaNome: { fontSize: 22, fontWeight: '800', color: '#111827' },
  turmaSerie: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  metricas: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  metrica: { flex: 1, alignItems: 'center' },
  metricaDivider: { width: 1, backgroundColor: '#E5E7EB' },
  metricaNumero: { fontSize: 24, fontWeight: '800', color: '#111827' },
  metricaLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827' },
  alunoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  alunoAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alunoAvatarTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },
  alunoNome: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
});
