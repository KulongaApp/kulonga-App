import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTraducao } from '../../hooks/useTraducao';
import Button from '../../components/ui/Button';
import AudioPlayButton from '../../components/AudioPlayButton';

const LINGUAS = [
  { chave: 'pt', nome: 'Português', descricao: 'Língua oficial de Angola' },
  { chave: 'umbundu', nome: 'Umbundu', descricao: 'Falada no Huambo, Bié e Namibe' },
  { chave: 'kimbundu', nome: 'Kimbundu', descricao: 'Falada em Luanda e Malanje' },
  { chave: 'kikongo', nome: 'Kikongo', descricao: 'Falada no Uíge, Zaire e Cabinda' },
  { chave: 'cokwe', nome: 'Cokwe', descricao: 'Falada no Moxico e Lunda' },
];

export default function LinguaScreen() {
  const router = useRouter();
  const { setLingua } = useTraducao();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinuar = async () => {
    if (!selected) return;
    // Guarda a língua no hook useTraducao
    setLingua(selected);
    router.push('/(onboarding)/perfil');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.progress}>
          <View style={[styles.dot]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot]} />
        </View>
        <Text style={styles.titulo}>Qual é a tua língua?</Text>
        <Text style={styles.sub}>Vamos falar contigo como te sentires melhor</Text>
      </View>

      <View style={styles.list}>
        {LINGUAS.map((l) => {
          const ativo = selected === l.chave;
          return (
            <TouchableOpacity
              key={l.chave}
              accessibilityLabel={`Seleccionar língua ${l.nome}`}
              onPress={() => setSelected(l.chave)}
              style={[styles.card, ativo ? { borderLeftWidth: 6, borderLeftColor: '#C8511B', backgroundColor: '#FFF3ED' } : undefined]}
            >
              <View style={styles.cardText}>
                <Text style={styles.nome}>{l.nome}</Text>
                <Text style={styles.desc}>{l.descricao}</Text>
              </View>
              <AudioPlayButton texto={l.nome} lingua={l.chave === 'pt' ? 'pt-PT' : 'pt-PT'} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.aviso}>
        <Text style={styles.avisoText}>Podes mudar a língua a qualquer momento nas definições.</Text>
      </View>

      <View style={styles.foot}>
        <Button titulo="Continuar" onPress={handleContinuar} variante="primario" desactivado={!selected} />
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
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  cardText: { flex: 1, marginRight: 12 },
  nome: { fontSize: 16, fontWeight: '800' },
  desc: { color: '#6B7280' },
  aviso: { backgroundColor: '#E6F0FF', padding: 10, borderRadius: 8, marginTop: 8 },
  avisoText: { color: '#1D4ED8' },
  foot: { paddingVertical: 12 },
});
