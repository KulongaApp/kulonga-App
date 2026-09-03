import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConectividade } from '../../hooks/useConectividade';
import { sincronizarPendentes } from '../../services/notas';
import { database } from '../../db';
import { Q } from '@nozbe/watermelondb';

export default function Sync() {
  const { isOnline } = useConectividade();
  const [loading, setLoading] = useState(false);
  const [pendentes, setPendentes] = useState<any[]>([]);

  const carregar = useCallback(async () => {
    try {
      const col = database.get('notas_pendentes' as any) as any;
      const list: any[] = await col.query(Q.where('status', 'pendente')).fetch();
      setPendentes(list);
    } catch { setPendentes([]); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (isOnline) carregar(); }, [isOnline]);

  async function sincronizar() {
    if (!isOnline) { Alert.alert('Sem internet', 'Liga a internet para sincronizar.'); return; }
    setLoading(true);
    const res = await sincronizarPendentes();
    await carregar();
    setLoading(false);
    if (res.erros === 0) Alert.alert('Sucesso!', `${res.sincronizadas} notas enviadas!`);
    else Alert.alert('Parcial', `${res.sincronizadas} enviadas, ${res.erros} erros.`);
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

        <Text style={styles.pendingTitle}>{pendentes.length} notas por sincronizar</Text>

        {pendentes.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 24 }}><Text style={{ color: '#16A34A' }}>✓ Tudo sincronizado</Text></View>
        ) : pendentes.map((n: any) => (
          <View key={n.id} style={styles.pendingCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alunoName}>{n.alunoId}</Text>
              <Text style={styles.metaText}>{n.disciplinaId} · {n.turmaId}</Text>
              <Text style={styles.metaText}>Trimestre {n.trimestre} · {n.tipo}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.valorBox}>
                <Text style={styles.valorText}>{n.valor}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>/20</Text>
              </View>
              <View style={styles.badge}><Text style={{ fontSize: 11, color: '#92400E' }}>{n.status}</Text></View>
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
