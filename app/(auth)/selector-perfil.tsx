import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SelectorPerfil() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [filhos, setFilhos] = useState<{ nome: string; turma: string }[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const storedNome = await AsyncStorage.getItem('kulonga_nome');
      const papeis = await AsyncStorage.getItem('kulonga_papeis');
      const filhosJson = await AsyncStorage.getItem('kulonga_filhos');
      setNome(storedNome ?? 'Utilizador');
      setRoles(papeis ? JSON.parse(papeis) : []);
      setFilhos(filhosJson ? JSON.parse(filhosJson) : []);
    })();
  }, []);

  const primeiroFilho = filhos[0];
  const filhoLabel = primeiroFilho ? `${primeiroFilho.nome} · ${primeiroFilho.turma}` : 'Filho(a) registado(a)';

  async function escolherPerfil(papel: 'professor' | 'encarregado') {
    await AsyncStorage.setItem('kulonga_papel_activo', papel);
    await AsyncStorage.setItem('kulonga_sessao_activa', 'true');
    if (papel === 'professor') {
      router.replace('/(professor)' as any);
    } else {
      router.replace('/(encarregado)' as any);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topo}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.icon} />
          <Text style={styles.eyebrow}>ESPAÇO PESSOAL</Text>
          <Text style={styles.titulo}>Como queres entrar hoje?</Text>
          <Text style={styles.subtitulo}>{nome}</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, styles.cardProfessor]}
            onPress={() => escolherPerfil('professor')}
            accessibilityLabel="Entrar como professor"
          >
            <View style={styles.cardRow}>
              <View style={[styles.cardCircle, { backgroundColor: '#123C6922' }]}>
                <Ionicons name="school-outline" size={28} color="#123C69" />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: '#123C69' }]}>Professor</Text>
                <Text style={styles.cardSubtitle}>Aceder às minhas turmas e notas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#123C69" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardEncarregado]}
            onPress={() => escolherPerfil('encarregado')}
            accessibilityLabel="Entrar como encarregado"
          >
            <View style={styles.cardRow}>
              <View style={[styles.cardCircle, { backgroundColor: '#8F5F0022' }]}>
                <Ionicons name="people-outline" size={28} color="#8F5F00" />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: '#8F5F00' }]}>Encarregado</Text>
                <Text style={styles.cardSubtitle}>{filhoLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8F5F00" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Podes mudar de perfil a qualquer momento</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  topo: { alignItems: 'center', paddingTop: 28, paddingBottom: 18 },
  icon: { width: 56, height: 56, marginBottom: 14 },
  eyebrow: { color: '#8F5F00', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 7 },
  titulo: { fontSize: 28, fontWeight: '900', color: '#0B2A4A', textAlign: 'center', letterSpacing: -0.4 },
  subtitulo: { marginTop: 6, color: '#65738A', fontSize: 14, textAlign: 'center' },
  cards: { marginTop: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 19, padding: 19, elevation: 2, borderWidth: 1, marginBottom: 0, shadowColor: '#0B2A4A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14 },
  cardProfessor: { borderColor: '#C9D7FF', borderLeftWidth: 5 },
  cardEncarregado: { borderColor: '#F4CBB3', borderLeftWidth: 5 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardCircle: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSubtitle: { marginTop: 4, color: '#55667A', fontSize: 13, lineHeight: 18 },
  footer: { color: '#55667A', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
