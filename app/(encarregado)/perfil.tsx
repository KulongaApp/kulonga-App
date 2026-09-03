import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { alunoMock } from '../../mocks/aluno';

function iniciados(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export default function PerfilEncarregado() {
  const router = useRouter();
  const aluno = alunoMock;

  async function sair() {
    Alert.alert('Sair', 'Tens a certeza que queres sair da tua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['kulonga_onboarding_feito', 'kulonga_perfil']);
          router.replace('/(onboarding)/provincia' as any);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push('/(encarregado)/painel')} accessibilityLabel="Voltar ao painel">
            <Ionicons name="arrow-back" size={24} color="#1D5C8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciados(aluno.nomeCompleto)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Encarregado do {aluno.nomeCompleto}</Text>
            <Text style={styles.profileSubtitle}>Turma {aluno.turma} · {aluno.anoLetivo}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <TouchableOpacity style={styles.optionCard} accessibilityLabel="Ver detalhes da conta">
            <View style={styles.optionIcon}>
              <Ionicons name="person-outline" size={18} color="#1D5C8A" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Dados do encarregado</Text>
              <Text style={styles.optionSubtitle}>Nome, telefone e email que a escola tem registado</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} accessibilityLabel="Configurar notificações">
            <View style={styles.optionIcon}>
              <Ionicons name="notifications-outline" size={18} color="#1D5C8A" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Notificações</Text>
              <Text style={styles.optionSubtitle}>Receber avisos de faltas, notas e eventos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} accessibilityLabel="Ver preferências de idioma">
            <View style={styles.optionIcon}>
              <Ionicons name="globe-outline" size={18} color="#1D5C8A" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Idioma</Text>
              <Text style={styles.optionSubtitle}>Português (Angola)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          <TouchableOpacity style={styles.optionCard} accessibilityLabel="Ver ajuda e suporte">
            <View style={styles.optionIcon}>
              <Ionicons name="help-circle-outline" size={18} color="#1D5C8A" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Ajuda e Suporte</Text>
              <Text style={styles.optionSubtitle}>Precisas de ajuda? Envia um pedido à secretaria</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={sair} accessibilityLabel="Sair da conta">
          <Text style={styles.logoutText}>Terminar sessão</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>As tuas preferências e dados de contacto serão guardados localmente até a escola sincronizar com o Kulonga.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  profileCard: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1D5C8A22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1D5C8A', fontSize: 22, fontWeight: '800' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  profileSubtitle: { fontSize: 13, color: '#6B7280' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1D5C8A', marginBottom: 12 },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  optionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  logoutButton: {
    backgroundColor: '#C8511B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerText: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});