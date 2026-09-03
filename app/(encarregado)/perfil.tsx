import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarAluno } from '../../services/alunos';
import { logout } from '../../services/auth';

export default function PerfilEncarregado() {
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem('kulonga_aluno_id');
        if (!id) throw new Error('Sem aluno');
        const a = await buscarAluno(id);
        setAluno(a);
      } catch {} finally { setLoading(false); }
    })();
  }, []);
  async function sair() {
    await logout();
    router.replace('/(auth)/escolher-perfil' as any);
  }
  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator style={{ marginTop: 40 }} /></SafeAreaView>;
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push('/(encarregado)/painel')}><Ionicons name="arrow-back" size={24} color="#1D5C8A" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{(aluno?.nome_completo ?? 'AL').split(' ').slice(0,2).map((p:string)=>p[0]).join('').toUpperCase()}</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{aluno ? `Encarregado de ${aluno.nome_completo}` : 'Encarregado'}</Text>
            <Text style={styles.profileSubtitle}>{aluno?.genero === 'F' ? 'Feminino' : 'Masculino'} · {aluno?.data_nascimento ?? ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={sair}><Text style={styles.logoutText}>Terminar sessão</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  profileCard: { borderRadius: 16, backgroundColor: '#F8FAFC', padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#1D5C8A22', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1D5C8A', fontSize: 22, fontWeight: '800' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  profileSubtitle: { fontSize: 13, color: '#6B7280' },
  logoutButton: { backgroundColor: '#C8511B', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
