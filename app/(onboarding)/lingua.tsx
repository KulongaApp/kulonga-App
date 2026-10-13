import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTraducao } from '../../hooks/useTraducao';
import Button from '../../components/ui/Button';
import AudioPlayButton from '../../components/AudioPlayButton';
import { CORES } from '../../constants/marca';

// Só português, umbundu e kimbundu têm tradução carregada em hooks/useTraducao.
// As restantes ficam marcadas como "em breve" — antes eram seleccionáveis mas
// caíam silenciosamente em português.
const LINGUAS = [
  { chave: 'pt', nome: 'Português', descricao: 'Língua oficial de Angola', suportado: true },
  { chave: 'umbundu', nome: 'Umbundu', descricao: 'Falada no Huambo, Bié e Namibe', suportado: true },
  { chave: 'kimbundu', nome: 'Kimbundu', descricao: 'Falada em Luanda e Malanje', suportado: true },
  { chave: 'kikongo', nome: 'Kikongo', descricao: 'Falada no Uíge, Zaire e Cabinda', suportado: false },
  { chave: 'cokwe', nome: 'Cokwe', descricao: 'Falada no Moxico e Lunda', suportado: false },
];

export default function LinguaScreen() {
  const router = useRouter();
  const { setLingua } = useTraducao();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinuar = async () => {
    if (!selected) return;
    await setLingua(selected);
    router.push('/(onboarding)/perfil');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.progress}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.titulo}>Qual é a tua língua?</Text>
        <Text style={styles.sub}>Vamos falar contigo como te sentires melhor</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {LINGUAS.map((l) => {
          const ativo = selected === l.chave;
          return (
            <TouchableOpacity
              key={l.chave}
              accessibilityRole="button"
              accessibilityState={{ disabled: !l.suportado, selected: ativo }}
              accessibilityLabel={
                l.suportado ? `Seleccionar língua ${l.nome}` : `${l.nome} — em breve`
              }
              disabled={!l.suportado}
              onPress={() => setSelected(l.chave)}
              style={[styles.card, !l.suportado && styles.cardIndisponivel, ativo && styles.cardActivo]}
            >
              <View style={styles.cardText}>
                <Text style={styles.nome}>{l.nome}</Text>
                <Text style={styles.desc}>{l.descricao}</Text>
              </View>
              {l.suportado ? (
                <AudioPlayButton texto={l.nome} />
              ) : (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Em breve</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.aviso}>
        <Text style={styles.avisoText}>
          Estamos a traduzir para Kikongo e Cokwe. Podes mudar a língua a qualquer momento nas
          definições.
        </Text>
      </View>

      <View style={styles.foot}>
        <Button
          titulo="Continuar"
          onPress={handleContinuar}
          variante="primario"
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
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 10,
    backgroundColor: CORES.branco,
  },
  cardIndisponivel: { opacity: 0.55 },
  cardActivo: {
    borderLeftWidth: 6,
    borderLeftColor: CORES.laranja,
    backgroundColor: CORES.laranjaFraco,
  },
  cardText: { flex: 1, marginRight: 12 },
  nome: { fontSize: 16, fontWeight: '800', color: CORES.texto },
  desc: { color: CORES.textoSuave },
  badge: {
    backgroundColor: CORES.borda,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: CORES.textoSuave, fontSize: 11, fontWeight: '700' },
  aviso: { backgroundColor: CORES.azulFraco, padding: 10, borderRadius: 8, marginTop: 8 },
  avisoText: { color: CORES.azul, fontSize: 12 },
  foot: { paddingVertical: 12 },
});
