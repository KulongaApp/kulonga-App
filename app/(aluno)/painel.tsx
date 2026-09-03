import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { buscarNotasAluno } from '../../services/notas';
import { logout } from '../../services/auth';

export default function PainelAluno() {
  const router = useRouter();
  const [nome, setNome] = useState('Aluno');
  const [alunoId, setAlunoId] = useState('');
  const [trimestre, setTrimestre] = useState<1|2|3>(1);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sem sessão');
        const { data: aluno } = await supabase.from('alunos').select('id,nome_completo').eq('user_id', user.id).single();
        if (!aluno) throw new Error('Aluno não encontrado. Liga a conta na secretaria.');
        setAlunoId(aluno.id); setNome(aluno.nome_completo);
        const notas = await buscarNotasAluno(aluno.id) as any[];
        const mapa: Record<string, any> = {};
        for (const n of (notas ?? [])) {
          const id = n.disciplina_id ?? n.disciplina_nome;
          if (!mapa[id]) mapa[id] = { id, nome: n.disciplina_nome, notas: [] };
          mapa[id].notas.push({ trimestre: n.trimestre, valor: n.valor });
        }
        setDisciplinas(Object.values(mapa));
      } catch (e: any) { Alert.alert('Erro', e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const notaDisc = (d: any) => d.notas.find((x: any) => x.trimestre === trimestre)?.valor ?? null;
  const sair = async () => { await logout(); router.replace('/(auth)/escolher-perfil' as any); };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View><Text style={s.ola}>Olá, {nome} 👋</Text><Text style={s.sub}>Área do Aluno</Text></View>
        <TouchableOpacity onPress={sair}><Ionicons name="log-out-outline" size={22} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 32 }} color="#1D5C8A" /> : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={s.trimRow}>{([1,2,3] as const).map(t => (
            <TouchableOpacity key={t} style={[s.trimBtn, trimestre===t && s.trimAct]} onPress={() => setTrimestre(t)}><Text style={[s.trimTxt, trimestre===t && s.trimActTxt]}>{t}º Trim.</Text></TouchableOpacity>
          ))}</View>
          {disciplinas.length===0 ? <Text style={{ color: '#9CA3AF', marginTop: 16 }}>Ainda sem notas.</Text> : disciplinas.map((d:any) => {
            const v = notaDisc(d);
            return <View key={d.id} style={s.card}><Text style={s.discNome}>{d.nome}</Text><Text style={[s.nota, { color: v===null?'#9CA3AF': v>=10?'#16A34A':'#DC2626' }]}>{v!==null? v.toFixed(1):'—'}/20</Text></View>;
          })}
          <TouchableOpacity style={s.btn} onPress={() => router.push('/(aluno)/boletim' as any)}><Text style={s.btnTxt}>Ver boletim completo</Text></TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1D5C8A', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ola: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sub: { color: '#BFDBFE', fontSize: 12 },
  trimRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  trimBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  trimAct: { backgroundColor: '#C8511B', borderColor: '#C8511B' },
  trimTxt: { color: '#6B7280', fontWeight: '600' },
  trimActTxt: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discNome: { fontWeight: '600' },
  nota: { fontWeight: '800', fontSize: 18 },
  btn: { backgroundColor: '#1D5C8A', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
