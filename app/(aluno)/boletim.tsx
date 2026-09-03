import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { buscarNotasAluno } from '../../services/notas';

export default function BoletimAluno() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: aluno } = await supabase.from('alunos').select('id').eq('user_id', user.id).single();
      if (!aluno) { setLoading(false); return; }
      const notas = await buscarNotasAluno(aluno.id) as any[];
      setDados(notas ?? []);
      setLoading(false);
    })();
  }, []);
  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 40 }} color="#1D5C8A" /></SafeAreaView>;
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.titulo}>Boletim Completo</Text>
        {dados.length===0 ? <Text style={{ color: '#6B7280' }}>Sem notas lançadas.</Text> : (
          <View style={s.table}>
            <View style={s.head}><Text style={s.th}>Disciplina</Text><Text style={s.th}>Trim.</Text><Text style={s.th}>Tipo</Text><Text style={s.th}>Nota</Text></View>
            {dados.map((n:any, i:number) => (
              <View key={i} style={s.row}><Text style={s.td}>{n.disciplina_nome}</Text><Text style={s.td}>{n.trimestre}º</Text><Text style={s.td}>{n.tipo}</Text><Text style={[s.td, { color: n.valor>=10?'#16A34A':'#DC2626', fontWeight:'700' }]}>{Number(n.valor).toFixed(1)}</Text></View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  titulo: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  table: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  head: { flexDirection: 'row', backgroundColor: '#1D5C8A', padding: 10 },
  th: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  td: { flex: 1, fontSize: 12 },
});
