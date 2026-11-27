import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type Perfil = {
  titulo: string;
  descricao: string;
  detalhe: string;
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  fundo: string;
  rota: any;
};

const perfis: Perfil[] = [
  {
    titulo: 'Encarregado',
    descricao: 'Acompanha o percurso escolar',
    detalhe: 'Entrar com email e senha',
    icone: 'people-outline',
    cor: '#123C69',
    fundo: '#E4EEF8',
    rota: '/(auth)/login-encarregado',
  },
  {
    titulo: 'Professor',
    descricao: 'Turmas, notas e trabalhos num só lugar',
    detalhe: 'Entrar com email e senha',
    icone: 'school-outline',
    cor: '#123C69',
    fundo: '#E4EEF8',
    rota: '/(auth)/login-professor',
  },
  {
    titulo: 'Secretaria / Direcção',
    descricao: 'Gere a escola com visão de conjunto',
    detalhe: 'Entrar com credenciais da escola',
    icone: 'business-outline',
    cor: '#123C69',
    fundo: '#E4EEF8',
    rota: '/(auth)/login-secretaria',
  },
  {
    titulo: 'Aluno',
    descricao: 'Consulta aulas, tarefas e resultados',
    detalhe: 'Entrar com email e senha',
    icone: 'person-outline',
    cor: '#123C69',
    fundo: '#E4EEF8',
    rota: '/(auth)/login-aluno',
  },
];

export default function EscolherPerfil() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.brandLockup}>
              <Image source={require('../../assets/logo-mark.png')} style={styles.brandLogo} accessibilityLabel="Kulonga" />
              <View>
                <Text style={styles.wordmark}>KULONGA</Text>
                <Text style={styles.wordmarkSub}>A escola no teu bolso</Text>
              </View>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#1A7358" />
              <Text style={styles.secureText}>Acesso seguro</Text>
            </View>
          </View>

          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>PORTAL KULONGA</Text>
              <Text style={styles.title}>A tua escola começa aqui.</Text>
              <Text style={styles.subtitle}>
                Escolhe o teu espaço para continuares. Cada perfil tem as ferramentas certas para o teu dia.
              </Text>
            </View>
            <Image
              source={require('../../assets/kulonga-onboarding-illustration.png')}
              resizeMode="contain"
              style={[styles.heroImage, isWide ? styles.heroImageWide : styles.heroImageMobile]}
              accessibilityLabel="Ilustração de uma comunidade escolar a caminhar para a escola"
            />
            <View style={styles.heroShapeOne} />
            <View style={styles.heroShapeTwo} />
          </View>

          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionKicker}>ACESSO POR PERFIL</Text>
              <Text style={styles.sectionTitle}>Como queres entrar?</Text>
            </View>
            <Text style={styles.sectionHint}>Selecciona uma opção</Text>
          </View>

          <View style={[styles.grid, isWide && styles.gridWide]}>
            {perfis.map((perfil) => (
              <Pressable
                key={perfil.titulo}
                accessibilityRole="button"
                accessibilityLabel={`Entrar como ${perfil.titulo}`}
                style={({ pressed }) => [styles.card, isWide && styles.cardWide, pressed && styles.cardPressed]}
                onPress={() => router.push(perfil.rota)}
              >
                <View style={[styles.cardAccent, { backgroundColor: perfil.cor }]} />
                <View style={[styles.iconBox, { backgroundColor: perfil.fundo }]}>
                  <Ionicons name={perfil.icone} size={25} color={perfil.cor} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{perfil.titulo}</Text>
                  <Text style={styles.cardDescription}>{perfil.descricao}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardDetail, { color: perfil.cor }]}>{perfil.detalhe}</Text>
                    <Ionicons name="arrow-forward" size={16} color={perfil.cor} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.createAccount}>
            <View style={styles.createIcon}><Ionicons name="add" size={20} color="#8F5F00" /></View>
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>Primeiro acesso?</Text>
              <Text style={styles.createSubtitle}>Usa o token entregue pela secretaria para criar a conta.</Text>
              <View style={styles.tokenLinks}>
                <Pressable onPress={() => router.push({ pathname: '/(auth)/token-encarregado', params: { tipo: 'aluno' } } as any)}><Text style={styles.tokenLink}>Criar conta de aluno</Text></Pressable>
                <Pressable onPress={() => router.push({ pathname: '/(auth)/token-encarregado', params: { tipo: 'encarregado' } } as any)}><Text style={styles.tokenLink}>Criar conta de encarregado</Text></Pressable>
                <Pressable onPress={() => router.push('/(auth)/token-professor' as any)}><Text style={styles.tokenLink}>Criar conta de professor</Text></Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>KULONGA · Educação com clareza, proximidade e impacto</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  page: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 42 },
  content: { width: '100%', maxWidth: 1080, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 40, height: 40, borderRadius: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#8F5F00', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  brandMarkText: { color: '#fff', fontSize: 23, fontWeight: '900', transform: [{ rotate: '6deg' }] },
  wordmark: { color: '#0B2A4A', fontSize: 16, letterSpacing: 2.4, fontWeight: '900' },
  wordmarkSub: { color: '#7A879A', fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
  securePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 30, backgroundColor: '#E8F7F1', paddingHorizontal: 11, paddingVertical: 7 },
  secureText: { color: '#117B59', fontSize: 11, fontWeight: '800' },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: 28, backgroundColor: '#0B2A4A', padding: 26, minHeight: 250, justifyContent: 'space-between', marginBottom: 30 },
  heroWide: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 34, paddingVertical: 30, minHeight: 260 },
  heroCopy: { maxWidth: 570, zIndex: 2 },
  eyebrow: { color: '#F5A477', fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 12 },
  title: { color: '#fff', fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: '#C7D0E0', fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 560 },
  heroLine: { width: 34, height: 4, borderRadius: 4, backgroundColor: '#8F5F00', marginBottom: 12 },
  heroImage: { position: 'absolute', zIndex: 1 },
  heroImageWide: { width: 430, height: 285, right: -28, bottom: -24, opacity: 0.98 },
  heroImageMobile: { width: 220, height: 145, right: -18, bottom: -10, opacity: 0.72 },
  heroShapeOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 34, borderColor: 'rgba(36,87,214,0.34)', right: -70, top: -70 },
  heroShapeTwo: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(230,106,36,0.2)', right: 90, bottom: -55 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  sectionKicker: { color: '#8F5F00', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  sectionTitle: { color: '#0B2A4A', fontSize: 23, fontWeight: '900', letterSpacing: -0.3 },
  sectionHint: { color: '#7A879A', fontSize: 12, paddingBottom: 2 },
  grid: { gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: { position: 'relative', overflow: 'hidden', minHeight: 142, width: '100%', flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E3DACB', padding: 18, shadowColor: '#0B2A4A', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.07, shadowRadius: 18, elevation: 2 },
  cardWide: { width: '48.8%' },
  cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  iconBox: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1, paddingTop: 1 },
  cardTitle: { color: '#0B2A4A', fontSize: 17, fontWeight: '900' },
  cardDescription: { color: '#65738A', fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 240 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#E3DACB' },
  cardDetail: { fontSize: 11, fontWeight: '800' },
  createAccount: { flexDirection: 'row', alignItems: 'center', marginTop: 22, padding: 16, borderRadius: 18, backgroundColor: '#FFF7F1', borderWidth: 1, borderColor: '#F2C4A4' },
  createAccountPressed: { backgroundColor: '#FDEBDD' },
  createIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  createCopy: { flex: 1 },
  createTitle: { color: '#8E3D16', fontSize: 13, fontWeight: '900' },
  createSubtitle: { color: '#A4694B', fontSize: 11, marginTop: 3 },
  tokenLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  tokenLink: { color: '#123C69', fontSize: 11, fontWeight: '900' },
  footer: { color: '#9AA5B5', fontSize: 10, textAlign: 'center', marginTop: 24, letterSpacing: 0.3 },
});
