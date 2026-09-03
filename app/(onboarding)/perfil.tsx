import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERFIS = [
  { chave: 'encarregado', icone: '👨‍👩‍👧', titulo: 'Encarregado de Educação', desc: 'Acompanha as notas e fala com os professores do teu filho', cor: '#C8511B' },
  { chave: 'professor', icone: '👨‍🏫', titulo: 'Professor', desc: 'Lança notas, gere as tuas turmas e comunica com as famílias', cor: '#1D5C8A' },
  { chave: 'secretaria', icone: '🏫', titulo: 'Secretaria / Direcção', desc: 'Gere a escola, os alunos e gera os códigos de acesso', cor: '#16A34A' },
  { chave: 'aluno', icone: '🎓', titulo: 'Aluno', desc: 'Vê as tuas notas, boletim e perfil', cor: '#7C3AED' },
];

export default function Perfil() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleComecar = async () => {
    if (!selected) return;
    // Guarda perfil no AsyncStorage e assinala onboarding como feito
    await AsyncStorage.setItem('kulonga_perfil', selected);
    await AsyncStorage.setItem('kulonga_onboarding_feito', 'true');

    // Debug: ver qual perfil foi seleccionado
    console.log('Perfil seleccionado:', selected);

    router.replace('/(auth)/escolher-perfil' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.progress}>
          <View style={[styles.dot]} />
          <View style={[styles.dot]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
        <Text style={styles.titulo}>Como vais usar o Kulonga?</Text>
        <Text style={styles.sub}>Escolhe o teu perfil para começar</Text>
      </View>

      <View style={styles.list}>
        {PERFIS.map((p) => {
          const ativo = selected === p.chave;
          return (
            <TouchableOpacity
              key={p.chave}
              accessibilityLabel={`Seleccionar perfil ${p.titulo}`}
              onPress={() => setSelected(p.chave)}
              style={[styles.card, ativo ? { transform: [{ scale: 1.02 }], borderColor: p.cor, backgroundColor: '#FFF9F5' } : undefined]}
            >
              <Text style={[styles.icone, { fontSize: 48 }]}>{p.icone}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.nome, { color: p.cor }]}>{p.titulo}</Text>
                <Text style={styles.desc}>{p.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.foot}>
        <TouchableOpacity accessibilityLabel={`Começar`} onPress={handleComecar} disabled={!selected} style={[styles.startButton, !selected ? { opacity: 0.6 } : undefined]}>
          <Text style={styles.startText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topo: { alignItems: 'center', marginBottom: 12 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  dotActive: { backgroundColor: '#C8511B' },
  titulo: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#6B7280' },
  list: { marginTop: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  icone: { marginRight: 12 },
  cardText: { marginLeft: 12, flex: 1 },
  nome: { fontSize: 16, fontWeight: '800' },
  desc: { color: '#6B7280' },
  foot: { paddingVertical: 12 },
  startButton: { backgroundColor: '#C8511B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '800' },
});
