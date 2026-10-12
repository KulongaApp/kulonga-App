import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EscolherPerfil() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>KULONGA</Text>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Escolhe o teu perfil para entrar</Text>

        <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => router.push({ pathname: '/(auth)/token-encarregado', params: { tipo: 'encarregado' } })}>
          <View style={[styles.iconBox, styles.iconBlue]}><Ionicons name="people-outline" size={24} color="#1D5C8A" /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Sou Encarregado</Text><Text style={styles.cardDesc}>Código de 6 dígitos da escola</Text></View>
          <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => router.push('/(auth)/login-professor')}>
          <View style={[styles.iconBox, styles.iconOrange]}><Ionicons name="school-outline" size={24} color="#C8511B" /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Sou Professor</Text><Text style={styles.cardDesc}>Email e senha de professor</Text></View>
          <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => router.push('/(auth)/login-secretaria')}>
          <View style={[styles.iconBox, styles.iconGreen]}><Ionicons name="business-outline" size={24} color="#15803D" /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Sou Secretaria / Direcção</Text><Text style={styles.cardDesc}>Email e senha da direcção</Text></View>
          <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => router.push({ pathname: '/(auth)/token-encarregado', params: { tipo: 'aluno' } })}>
          <View style={[styles.iconBox, styles.iconPurple]}><Ionicons name="person-outline" size={24} color="#7C3AED" /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Sou Aluno</Text><Text style={styles.cardDesc}>Código da escola para criar a tua conta</Text></View>
          <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />
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
  scroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  logo: { color: '#1D5C8A', fontWeight: '800', fontSize: 18, letterSpacing: 2, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 22 },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 4, marginBottom: 16, textAlign: 'center' },
  card: { width: '100%', minHeight: 78, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBlue: { backgroundColor: '#E8F1F8' },
  iconOrange: { backgroundColor: '#FFF1E8' },
  iconGreen: { backgroundColor: '#ECFDF3' },
  iconPurple: { backgroundColor: '#F3E8FF' },
  cardCopy: { flex: 1, marginHorizontal: 12 },
  cardTitle: { fontWeight: '800', color: '#111827', fontSize: 15 },
  cardDesc: { color: '#6B7280', marginTop: 4, fontSize: 13, lineHeight: 18 },
  divider: { width: '100%', height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  noAccountBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', alignItems: 'center' },
  noAccountTxt: { color: '#9A3412', fontWeight: '600' },
  noAccountLink: { color: '#C8511B', fontWeight: '800' },
  mudar: { marginTop: 16 },
  mudarTxt: { color: '#9CA3AF', fontSize: 12 },
});
