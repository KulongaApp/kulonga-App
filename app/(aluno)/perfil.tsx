import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { logout } from '../../services/auth';

export default function PerfilAluno() {
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from('alunos').select('*').eq('user_id', user.id).single();
      setAluno(data); setLoading(false);
    })();
  }, []);
  const sair = async () => { await logout(); router.replace('/(auth)/escolher-perfil' as any); };
  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 40 }} /></SafeAreaView>;
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.card}>
        {aluno?.foto_url ? <Image source={{ uri: aluno.foto_url }} style={s.foto} /> : null}
        <Text style={s.nome}>{aluno?.nome_completo ?? 'Aluno'}</Text>
        <Text style={s.info}>{aluno?.email ?? ''}</Text>
        <Text style={s.info}>{aluno?.genero === 'M' ? 'Masculino' : 'Feminino'}</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={sair}><Text style={s.btnTxt}>Sair</Text></TouchableOpacity>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  nome: { fontSize: 18, fontWeight: '800' },
  info: { color: '#55667A', marginTop: 4 },
  foto: { width: 84, height: 84, borderRadius: 42, marginBottom: 12, backgroundColor: '#E4EEF8' },
  btn: { backgroundColor: '#B83F28', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
