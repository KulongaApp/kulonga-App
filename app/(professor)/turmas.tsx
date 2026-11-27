import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { obterEscolaDoUsuario } from '../../services/professores';
import { listarTurmasDoProfessor } from '../../services/turmas';
import { supabase } from '../../services/supabase';

export default function Turmas() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const escolaId = await obterEscolaDoUsuario();
        if (!escolaId) throw new Error('Escola não encontrada');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sessão não encontrada');
        const { data: professor } = await supabase.from('professores').select('id').eq('user_id', user.id).eq('escola_id', escolaId).single();
        if (!professor) throw new Error('Perfil de professor não encontrado');
        const data = await listarTurmasDoProfessor(professor.id);
        setTurmas(data as any[]);
      } catch (e: any) { setErro(e?.message ?? 'Erro ao carregar turmas'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Turmas</Text></View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#8F5F00" /> : erro ? <Text style={{ color: '#B83F28', textAlign: 'center', marginTop: 24 }}>{erro}</Text> : turmas.length === 0 ? <Text style={{ textAlign: 'center', marginTop: 24, color: '#55667A' }}>Nenhuma turma encontrada</Text> : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {turmas.map((t: any) => (
            <TouchableOpacity key={t.id} style={styles.card} onPress={() => router.push('/(professor)/lancar-notas' as any)}>
              <View><Text style={styles.cardTitle}>{t.nome}</Text><Text style={styles.cardSub}>{t.serie ?? ''} · {t.ano_lectivo}</Text><Text style={styles.cardSub}>{(t.disciplinas_atribuidas ?? []).map((d: any) => d.nome).join(', ') || 'Sem disciplina definida'}</Text></View>
              <Text style={styles.toca}>Toca para lançar notas →</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F6EFE3' },
  title: { fontWeight: '700', fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardSub: { color: '#55667A', marginTop: 4 },
  toca: { color: '#8F5F00', fontSize: 12, marginTop: 8 },
});
