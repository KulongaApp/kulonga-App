import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { prevalidarToken, TipoConvite } from '../../services/auth';

const TOKEN_LENGTH = 32;

export default function TokenEncarregado() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tipo?: string; codigo?: string }>();
  const tipo: TipoConvite = params.tipo === 'aluno' ? 'aluno' : 'encarregado';
  const [codigo, setCodigo] = useState(() => normalizar(String(params.codigo ?? '')));
  const [sugestao, setSugestao] = useState<null | { tipo: 'aluno' | 'encarregado' | 'professor'; rotulo: string }>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const compacto = width < 420;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(t);
  }, []);

  function animarErro() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  }

  function normalizar(valor: string) {
    return valor.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, TOKEN_LENGTH);
  }

  const codigoCompleto = codigo.length === TOKEN_LENGTH || codigo.length === 6;
  const grupos = Array.from({ length: 4 }, (_, index) => codigo.slice(index * 8, index * 8 + 8));

  function irParaTipo() {
    if (!sugestao) return;
    const alvo = sugestao.tipo;
    setSugestao(null);
    setErro('');
    if (alvo === 'professor') router.replace({ pathname: '/(auth)/token-professor', params: { codigo: codigo.toLowerCase() } } as any);
    else router.replace({ pathname: '/(auth)/token-encarregado', params: { tipo: alvo, codigo } } as any);
  }

  async function validar() {
    if (!codigoCompleto) return;
    setLoading(true);
    setErro('');
    setSugestao(null);
    const res = await prevalidarToken(codigo, tipo);
    setLoading(false);

    if (res.valido && res.alunoId) {
      router.push({
        pathname: '/(auth)/cadastro-token' as any,
        params: { codigo, tipo, nomeAluno: res.nomeAluno ?? '' },
      });
      return;
    }

    setErro(res.erro ?? 'Token não aceite. Confirma os caracteres ou pede um novo à secretaria.');
    if (res.motivo === 'tipo_errado' && res.tipoReal) {
      const rotulos = { professor: 'Ir para o acesso de professor', aluno: 'Ir para o acesso de aluno', encarregado: 'Ir para o acesso de encarregado' } as const;
      setSugestao({ tipo: res.tipoReal, rotulo: rotulos[res.tipoReal] });
    }
    animarErro();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={20} color="#0B2A4A" />
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>

            <View style={styles.brandRow}>
              <Image source={require('../../assets/logo-mark.png')} style={styles.brandLogo} accessibilityLabel="Kulonga" />
              <View><Text style={styles.wordmark}>KULONGA</Text><Text style={styles.wordmarkSub}>A escola no teu bolso</Text></View>
            </View>

            <View style={[styles.hero, compacto && styles.heroCompact]}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>PRIMEIRO ACESSO</Text>
                <Text style={styles.title}>{tipo === 'aluno' ? 'Entrar como aluno' : 'Entrar como encarregado'}</Text>
                <Text style={styles.subtitle}>Usa o token entregue pela secretaria para ligar a tua conta ao aluno correcto.</Text>
              </View>
              <Image source={require('../../assets/kulonga-onboarding-illustration.png')} resizeMode="contain" style={styles.heroImage} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeading}>
                <View style={styles.headingIcon}><Ionicons name="key-outline" size={20} color="#123C69" /></View>
                <View style={styles.headingCopy}>
                  <Text style={styles.cardTitle}>Introduz o teu token</Text>
                  <Text style={styles.cardSubtitle}>Cola o código completo. Não precisas de o escrever carácter a carácter.</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <Pressable onPress={() => inputRef.current?.focus()} style={styles.tokenPreview} accessibilityLabel="Campo do token">
                  <View style={styles.groupsRow}>
                    {grupos.map((grupo, index) => (
                      <View key={index} style={[styles.groupBox, grupo ? styles.groupFilled : undefined]}>
                        <Text style={[styles.groupText, grupo ? styles.groupTextFilled : undefined]}>{grupo || '••••••••'}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    ref={inputRef}
                    value={codigo}
                    onChangeText={(valor) => { setCodigo(normalizar(valor)); if (erro) setErro(''); }}
                    style={styles.hiddenInput}
                    maxLength={TOKEN_LENGTH}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                    textContentType="oneTimeCode"
                    placeholder=""
                    accessibilityLabel="Token de acesso da escola"
                  />
                </Pressable>
              </Animated.View>

              <View style={styles.tokenInfo}>
                <Ionicons name="information-circle-outline" size={16} color="#123C69" />
                <Text style={styles.tokenInfoText}>O novo formato tem 32 caracteres. Tokens antigos de 6 dígitos continuam compatíveis.</Text>
              </View>

              {erro ? <Text style={styles.error}>{erro}</Text> : null}
              {sugestao ? <Pressable onPress={irParaTipo} style={styles.sugestao} accessibilityRole="button"><Text style={styles.sugestaoTxt}>{sugestao.rotulo}</Text></Pressable> : null}

              <Pressable style={[styles.validate, !codigoCompleto && styles.validateDisabled]} disabled={!codigoCompleto || loading} onPress={validar}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.validateText}>Validar token</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
              </Pressable>
            </View>

            <View style={styles.help}>
              <Ionicons name="help-circle-outline" size={18} color="#8F5F00" />
              <Text style={styles.helpText}>Ainda não tens um token? Pede à secretaria da escola para gerar um novo acesso.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sugestao: { backgroundColor: '#E4EEF8', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  sugestaoTxt: { color: '#123C69', fontSize: 15, fontWeight: '800' },
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  flex: { flex: 1 },
  page: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 46 },
  shell: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 5, marginBottom: 16 },
  backText: { color: '#0B2A4A', fontSize: 13, fontWeight: '800' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  brandLogo: { width: 38, height: 38, borderRadius: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#8F5F00', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 21, fontWeight: '900' },
  wordmark: { color: '#0B2A4A', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  wordmarkSub: { color: '#7A879A', fontSize: 10, marginTop: 2 },
  hero: { minHeight: 168, overflow: 'hidden', position: 'relative', backgroundColor: '#0B2A4A', borderRadius: 24, padding: 24, justifyContent: 'center', marginBottom: 16 },
  heroCompact: { padding: 20, minHeight: 190 },
  heroCopy: { maxWidth: 430, zIndex: 2 },
  eyebrow: { color: '#F5A477', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 9 },
  title: { color: '#fff', fontSize: 27, lineHeight: 32, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: '#C7D0E0', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 400 },
  heroImage: { position: 'absolute', width: 270, height: 180, right: -8, bottom: -12, opacity: 0.9 },
  card: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#E3DACB', padding: 20, shadowColor: '#0B2A4A', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headingIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4EEF8', marginRight: 12 },
  headingCopy: { flex: 1 },
  cardTitle: { color: '#0B2A4A', fontSize: 17, fontWeight: '900' },
  cardSubtitle: { color: '#718096', fontSize: 12, lineHeight: 17, marginTop: 3 },
  tokenPreview: { borderWidth: 1.5, borderColor: '#C9D7F8', borderRadius: 16, padding: 12, backgroundColor: '#FFFBF3' },
  groupsRow: { flexDirection: 'row', gap: 8 },
  groupBox: { flex: 1, minHeight: 48, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3DACB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  groupFilled: { borderColor: '#123C69', backgroundColor: '#E4EEF8' },
  groupText: { color: '#C3CBD8', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  groupTextFilled: { color: '#0B2A4A' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  tokenInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 12 },
  tokenInfoText: { flex: 1, color: '#55667A', fontSize: 11, lineHeight: 16 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  validate: { minHeight: 50, borderRadius: 14, backgroundColor: '#123C69', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
  validateDisabled: { backgroundColor: '#B8C4D8' },
  validateText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  help: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, paddingHorizontal: 5 },
  helpText: { flex: 1, color: '#718096', fontSize: 12, lineHeight: 17 },
});
