import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock de notas pendentes — substituir por WatermelonDB
const notasPendentes = [
  { id: 'n1', aluno: 'João Manuel Sebastião', disciplina: 'Matemática', turma: '10ªA', trimestre: 1, valor: 15, lancadoEm: '2025-01-15T09:30:00' },
  { id: 'n2', aluno: 'Pedro António Kiala', disciplina: 'Matemática', turma: '10ªA', trimestre: 1, valor: 12, lancadoEm: '2025-01-15T09:31:00' },
  { id: 'n3', aluno: 'Carlos Eduardo Mbanza', disciplina: 'Matemática', turma: '10ªA', trimestre: 1, valor: 9, lancadoEm: '2025-01-15T09:32:00' },
];

export default function Sync() {
  const [isOnline, setIsOnline] = useState(true); // TODO: usar hook useConectividade
  const [loading, setLoading] = useState(false);

  async function sincronizar() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    Alert.alert('Sucesso!', `${notasPendentes.length} notas enviadas com sucesso!`);
    // TODO: chamar função real de sincronização
  }

  function formatarData(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT') + ' às ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sincronização</Text>
        <Text style={styles.headerSub}>Estado das notas por enviar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cardState}>
          {isOnline ? (
            <>
              <Ionicons name="wifi" size={48} color="#16A34A" />
              <Text style={styles.stateTitle}>Estás online</Text>
              <Text style={styles.stateSub}>Pronto para sincronizar</Text>
              <TouchableOpacity style={styles.syncBtn} onPress={sincronizar} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncText}>Sincronizar agora</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="cloud-offline" size={48} color="#D97706" />
              <Text style={[styles.stateTitle, { color: '#D97706' }]}>Sem internet</Text>
              <Text style={styles.stateSub}>As notas ficam guardadas aqui</Text>
              <Text style={{ color: '#6B7280', fontStyle: 'italic', marginTop: 8 }}>Quando a internet voltar, as notas são enviadas automaticamente.</Text>
            </>
          )}
        </View>

        <Text style={styles.pendingTitle}>{notasPendentes.length} notas por sincronizar</Text>

        {notasPendentes.map((n) => (
          <View key={n.id} style={styles.pendingCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alunoName}>{n.aluno}</Text>
              <Text style={styles.metaText}>{n.disciplina} · Turma {n.turma}</Text>
              <Text style={styles.metaText}>Trimestre {n.trimestre}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.valorBox}>
                <Text style={styles.valorText}>{n.valor}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>/20</Text>
              </View>
              <View style={styles.badge}><Text style={{ fontSize: 11, color: '#92400E' }}>Pendente</Text></View>
            </View>
            <Text style={styles.lancado}>Lançado em: {formatarData(n.lancadoEm)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#16A34A', padding: 16 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerSub: { color: '#D1FAE5' },
  scroll: { padding: 16, paddingBottom: 100 },
  cardState: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  stateTitle: { fontWeight: '700', fontSize: 18, marginTop: 8 },
  stateSub: { color: '#6B7280', marginTop: 4 },
  syncBtn: { marginTop: 16, backgroundColor: '#16A34A', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  syncText: { color: '#fff', fontWeight: '700' },
  pendingTitle: { fontWeight: '700', color: '#1D5C8A', margin: 16, marginBottom: 8 },
  pendingCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, marginHorizontal: 16, borderLeftWidth: 3, borderLeftColor: '#D97706' },
  alunoName: { fontWeight: '700', color: '#111827' },
  metaText: { color: '#6B7280', marginTop: 2 },
  valorBox: { backgroundColor: '#FEF3EC', borderRadius: 8, padding: 8, alignItems: 'center' },
  valorText: { fontWeight: '700', fontSize: 18, color: '#C8511B' },
  badge: { backgroundColor: '#FEEBC8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  lancado: { color: '#6B7280', fontSize: 11, marginTop: 8 },
});
