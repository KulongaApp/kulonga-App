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
          <Image source={require('../../assets/icon.png')} style={styles.icon} />
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
              <View style={[styles.cardCircle, { backgroundColor: '#1D5C8A22' }]}> 
                <Text style={styles.cardEmoji}>👨‍🏫</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: '#1D5C8A' }]}>Professor</Text>
                <Text style={styles.cardSubtitle}>Aceder às minhas turmas e notas</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1D5C8A" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardEncarregado]}
            onPress={() => escolherPerfil('encarregado')}
            accessibilityLabel="Entrar como encarregado"
          >
            <View style={styles.cardRow}>
              <View style={[styles.cardCircle, { backgroundColor: '#C8511B22' }]}> 
                <Text style={styles.cardEmoji}>👨‍👩‍👧</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: '#C8511B' }]}>Encarregado</Text>
                <Text style={styles.cardSubtitle}>{filhoLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C8511B" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Podes mudar de perfil a qualquer momento</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 24, paddingBottom: 40 },
  topo: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  icon: { width: 52, height: 52 },
  titulo: { marginTop: 16, fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitulo: { marginTop: 4, color: '#6B7280', fontSize: 14, textAlign: 'center' },
  cards: { marginTop: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, borderWidth: 2, marginBottom: 16 },
  cardProfessor: { borderColor: '#1D5C8A' },
  cardEncarregado: { borderColor: '#C8511B' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSubtitle: { marginTop: 4, color: '#6B7280', fontSize: 13, lineHeight: 18 },
  footer: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
});