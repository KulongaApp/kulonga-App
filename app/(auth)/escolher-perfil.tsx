import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function EscolherPerfil() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>KULONGA</Text>
      <Text style={styles.title}>Como queres entrar?</Text>
      <Text style={styles.subtitle}>Já tens conta? Entra. Se não, cria uma.</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/token-encarregado')}>
        <Text style={styles.icon}>👨‍👩‍👧</Text>
        <Text style={styles.cardTitle}>Sou Encarregado — Já tenho código</Text>
        <Text style={styles.cardDesc}>Tenho o código de 6 dígitos da escola</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-professor')}>
        <Text style={styles.icon}>👨‍🏫</Text>
        <Text style={styles.cardTitle}>Sou Professor — Já tenho conta</Text>
        <Text style={styles.cardDesc}>Email e senha de professor</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-secretaria')}>
        <Text style={styles.icon}>🏫</Text>
        <Text style={styles.cardTitle}>Sou Secretaria / Direcção — Já tenho conta</Text>
        <Text style={styles.cardDesc}>Email e senha da direcção</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(auth)/login-aluno')}>
        <Text style={styles.icon}>🎓</Text>
        <Text style={styles.cardTitle}>Sou Aluno — Já tenho conta</Text>
        <Text style={styles.cardDesc}>Email e senha de aluno</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.noAccount}>Não tens conta?</Text>

      <TouchableOpacity onPress={() => router.push('/(auth)/cadastro-escola' as any)} style={styles.cardCreate}>
        <Text style={styles.cardCreateTitle}>🏫 Criar conta de escola</Text>
        <Text style={styles.cardCreateDesc}>Registar nova escola (direcção)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/cadastro-professor' as any)} style={styles.cardCreate}>
        <Text style={styles.cardCreateTitle}>👨‍🏫 Criar conta de professor</Text>
        <Text style={styles.cardCreateDesc}>Registar como professor</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/cadastro-aluno' as any)} style={styles.cardCreate}>
        <Text style={styles.cardCreateTitle}>🎓 Criar conta de aluno</Text>
        <Text style={styles.cardCreateDesc}>Registar como aluno</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center' },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 20, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 4, marginBottom: 16 },
  card: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  icon: { fontSize: 32 },
  cardTitle: { fontWeight: '800', marginTop: 8 },
  cardDesc: { color: '#6B7280', marginTop: 6 },
  divider: { width: '100%', height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  noAccount: { fontWeight: '700', color: '#374151', marginBottom: 8 },
  cardCreate: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#C8511B', borderStyle: 'dashed', marginBottom: 10, backgroundColor: '#FFF7ED' },
  cardCreateTitle: { fontWeight: '800', color: '#C8511B' },
  cardCreateDesc: { color: '#9CA3AF', marginTop: 4, fontSize: 12 },
});
