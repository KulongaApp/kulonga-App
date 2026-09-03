import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function EscolherPerfil() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>KULONGA</Text>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Escolhe o teu perfil para entrar</Text>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/token-encarregado')}>
          <Text style={styles.icon}>👨‍👩‍👧</Text>
          <Text style={styles.cardTitle}>Sou Encarregado</Text>
          <Text style={styles.cardDesc}>Código de 6 dígitos da escola</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-professor')}>
          <Text style={styles.icon}>👨‍🏫</Text>
          <Text style={styles.cardTitle}>Sou Professor</Text>
          <Text style={styles.cardDesc}>Email e senha de professor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-secretaria')}>
          <Text style={styles.icon}>🏫</Text>
          <Text style={styles.cardTitle}>Sou Secretaria / Direcção</Text>
          <Text style={styles.cardDesc}>Email e senha da direcção</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-aluno')}>
          <Text style={styles.icon}>🎓</Text>
          <Text style={styles.cardTitle}>Sou Aluno</Text>
          <Text style={styles.cardDesc}>Email e senha de aluno</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.noAccountBtn} onPress={() => router.push('/(auth)/criar-conta' as any)}>
          <Text style={styles.noAccountTxt}>Não tens conta? <Text style={styles.noAccountLink}>Criar conta →</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(onboarding)/perfil' as any)} style={styles.mudar}>
          <Text style={styles.mudarTxt}>Mudar preferência de perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 20, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 4, marginBottom: 16, textAlign: 'center' },
  card: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#fff' },
  icon: { fontSize: 32 },
  cardTitle: { fontWeight: '800', marginTop: 8 },
  cardDesc: { color: '#6B7280', marginTop: 6 },
  divider: { width: '100%', height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  noAccountBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', alignItems: 'center' },
  noAccountTxt: { color: '#9A3412', fontWeight: '600' },
  noAccountLink: { color: '#C8511B', fontWeight: '800' },
  mudar: { marginTop: 16 },
  mudarTxt: { color: '#9CA3AF', fontSize: 12 },
});
