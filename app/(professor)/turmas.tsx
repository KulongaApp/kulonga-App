import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const turmasMock = [
  { id: 't1', nome: '10ªA', disciplina: 'Matemática' },
  { id: 't2', nome: '11ªB', disciplina: 'Física' },
  { id: 't3', nome: '12ªC', disciplina: 'Química' },
];

export default function Turmas() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turmas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {turmasMock.map((t) => (
          <TouchableOpacity key={t.id} style={styles.card} onPress={() => router.push('/(professor)/lancar-notas' as any)}>
            <View>
              <Text style={styles.cardTitle}>{t.nome}</Text>
              <Text style={styles.cardSub}>{t.disciplina}</Text>
            </View>
            <Text style={styles.toca}>Toca para lançar notas →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontWeight: '700', fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardSub: { color: '#6B7280', marginTop: 4 },
  toca: { color: '#C8511B', fontSize: 12, marginTop: 8 },
});
