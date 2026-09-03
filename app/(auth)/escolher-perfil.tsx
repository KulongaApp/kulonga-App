import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function EscolherPerfil() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>KULONGA</Text>
      <Text style={styles.title}>Como queres entrar?</Text>

      <TouchableOpacity accessibilityLabel="Sou Encarregado" style={styles.card} onPress={() => router.push('/(auth)/token-encarregado')}>
        <Text style={styles.icon}>👨‍👩‍👧</Text>
        <Text style={styles.cardTitle}>Sou Encarregado</Text>
        <Text style={styles.cardDesc}>Tenho o código de 6 dígitos da escola</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityLabel="Sou Professor" style={styles.card} onPress={() => router.push('/(auth)/login-professor')}>
        <Text style={styles.icon}>👨‍🏫</Text>
        <Text style={styles.cardTitle}>Sou Professor ou Secretaria</Text>
        <Text style={styles.cardDesc}>Tenho email e senha da escola</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/cadastro-escola' as any)}>
        <Text style={styles.link}>Criar conta de escola</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(onboarding)/provincia')}>
        <Text style={styles.linkSecondary}>Quero mudar as minhas preferências</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center' },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 20, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 12 },
  card: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  icon: { fontSize: 32 },
  cardTitle: { fontWeight: '800', marginTop: 8 },
  cardDesc: { color: '#6B7280', marginTop: 6 },
  link: { color: '#C8511B', marginTop: 12 },
  linkSecondary: { color: '#6B7280', marginTop: 12, fontSize: 13 },
});
