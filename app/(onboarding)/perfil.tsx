import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/ui/Button';
import { CORES } from '../../constants/marca';

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
        <Text style={styles.titulo}>Qual é o teu perfil principal?</Text>
        <Text style={styles.sub}>Isto só guarda a tua preferência — depois vais escolher Entrar ou Criar conta</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      <View style={styles.foot}>
        <Button
          titulo="Começar"
          onPress={handleComecar}
          variante="primario"
          tamanho="grande"
          desactivado={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: CORES.branco },
  topo: { alignItems: 'center', marginBottom: 12 },
  progress: { flexDirection: 'row', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: CORES.borda, marginHorizontal: 6 },
  dotActive: { backgroundColor: CORES.laranja },
  titulo: { fontSize: 20, fontWeight: '800', color: CORES.texto },
  sub: { color: CORES.textoSuave, textAlign: 'center' },
  scroll: { flex: 1 },
  list: { marginTop: 12, paddingBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 12,
    backgroundColor: CORES.branco,
  },
  icone: { marginRight: 12 },
  cardText: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '800' },
  desc: { color: CORES.textoSuave },
  foot: { paddingVertical: 12 },
});
