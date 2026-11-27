import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProfessorContactCard } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarAluno } from '../../services/alunos';
import { supabase } from '../../services/supabase';

export default function ContactosEncarregado() {
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [profs, setProfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const alunoId = await AsyncStorage.getItem('kulonga_aluno_id');
        if (!alunoId) throw new Error('Sem aluno');
        const a = await buscarAluno(alunoId);
        setAluno(a);
        const { data } = await supabase.from('disciplina_professor').select('professor_id, disciplinas(nome), professores(nome, telefone)').limit(20);
        setProfs((data as any[]) ?? []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator style={{ marginTop: 40 }} color="#123C69" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(encarregado)/painel')}><Ionicons name="arrow-back" size={22} color="#123C69" /></TouchableOpacity>
          <Text style={styles.title}>Professores e Contactos</Text>
          <Text style={styles.subtitle}>{aluno?.nome_completo ?? ''}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeading}><Ionicons name="people-outline" size={20} color="#123C69" /><Text style={styles.sectionTitle}>Professores por disciplina</Text></View>
          {profs.length === 0 ? <Text style={{ color: '#55667A' }}>Nenhum contacto disponível ainda.</Text> : profs.map((p: any, i: number) => (
            <ProfessorContactCard key={i} nome={p.professores?.nome ?? 'Professor'} telefone={p.professores?.telefone ?? ''} disciplina={p.disciplinas?.nome ?? '—'} coordenador={false} />
          ))}
        </View>
        <Card estilo={styles.infoCard} sombra><Text style={styles.infoText}>Liga directamente carregando no botão de telefone.</Text></Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { color: '#123C69', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#55667A', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0B1F33' },
  infoCard: { marginTop: 12, backgroundColor: '#EFF6FF' },
  infoText: { color: '#1E3A8A', lineHeight: 20 },
});
