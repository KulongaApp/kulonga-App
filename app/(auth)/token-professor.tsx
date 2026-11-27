import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { diagnosticarToken, mensagemDoDiagnostico } from '../../services/auth';

const TAMANHO = 32;
const normalizar = (valor: string) => valor.replace(/[^a-fA-F0-9]/g, '').toLowerCase().slice(0, TAMANHO);

// Primeiro acesso do professor: valida o token emitido pela secretaria e segue para criar a conta.
export default function TokenProfessor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ codigo?: string }>();
  const [codigo, setCodigo] = useState(() => normalizar(String(params.codigo ?? '')));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sugestao, setSugestao] = useState<null | { tipo: 'aluno' | 'encarregado'; rotulo: string }>(null);
  const inputRef = useRef<TextInput>(null);
  const completo = codigo.length === TAMANHO;

  async function validar() {
    if (!completo || loading) return;
    setLoading(true);
    setErro('');
    setSugestao(null);
    const diag = await diagnosticarToken(codigo, 'professor');
    setLoading(false);
    if (diag && diag.motivo !== 'ok') {
      setErro(mensagemDoDiagnostico(diag, 'professor'));
      if (diag.motivo === 'tipo_errado' && (diag.tipoReal === 'aluno' || diag.tipoReal === 'encarregado')) {
        setSugestao({ tipo: diag.tipoReal, rotulo: diag.tipoReal === 'aluno' ? 'Ir para o acesso de aluno' : 'Ir para o acesso de encarregado' });
      }
      return;
    }
    // Token válido (ou diagnóstico indisponível: o registo volta a validar o convite no servidor)
    router.push({ pathname: '/(auth)/activar-convite-professor', params: { convite: codigo } } as any);
  }

  function irParaOutroTipo() {
    if (!sugestao) return;
    const alvo = sugestao.tipo;
    setSugestao(null);
    setErro('');
    router.replace({ pathname: '/(auth)/token-encarregado', params: { tipo: alvo, codigo } } as any);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={20} color="#0B2A4A" />
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>

            <View style={styles.brandRow}>
              <Image source={require('../../assets/logo-mark.png')} style={styles.logo} accessibilityLabel="Kulonga" />
              <View>
                <Text style={styles.wordmark}>KULONGA</Text>
                <Text style={styles.wordmarkSub}>A escola no teu bolso</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>PRIMEIRO ACESSO · PROFESSOR</Text>
            <Text style={styles.title}>Entra com o token da escola</Text>
            <Text style={styles.subtitle}>
              A secretaria da tua escola gera este token. Cola o código completo e, no passo seguinte, cria a tua conta com o mesmo email do convite.
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>TOKEN DE PROFESSOR</Text>
              <TextInput
                ref={inputRef}
                value={codigo}
                onChangeText={(valor) => { setCodigo(normalizar(valor)); if (erro) { setErro(''); setSugestao(null); } }}
                onSubmitEditing={validar}
                style={styles.input}
                maxLength={TAMANHO}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                placeholder="Cola aqui o código de 32 caracteres"
                placeholderTextColor="#7A8CA0"
                accessibilityLabel="Token de professor"
              />
              <Text style={styles.contador}>{codigo.length}/{TAMANHO}</Text>

              {erro ? (
                <View style={styles.erroBox} accessibilityRole="alert">
                  <Ionicons name="alert-circle-outline" size={20} color="#B83F28" />
                  <Text style={styles.erroTxt}>{erro}</Text>
                </View>
              ) : null}

              {sugestao ? (
                <Pressable onPress={irParaOutroTipo} style={styles.sugestao} accessibilityRole="button">
                  <Text style={styles.sugestaoTxt}>{sugestao.rotulo}</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.botao, !completo && styles.botaoOff]}
                disabled={!completo || loading}
                onPress={validar}
                accessibilityRole="button"
                accessibilityLabel="Validar token"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTxt}>Validar token</Text>}
              </Pressable>
            </View>

            <View style={styles.rodape}>
              <Text style={styles.rodapeTxt}>Já tens conta?</Text>
              <Pressable onPress={() => router.replace('/(auth)/login-professor' as any)} accessibilityRole="link">
                <Text style={styles.link}>Entrar como professor</Text>
              </Pressable>
            </View>
            <Text style={styles.ajuda}>Sem token? Pede à secretaria da escola para gerar um em Convites de professores.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  page: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  shell: { width: '100%', maxWidth: 520 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginBottom: 8 },
  backText: { color: '#0B2A4A', fontSize: 16, fontWeight: '600' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  wordmark: { color: '#0B2A4A', fontSize: 18, fontWeight: '900', letterSpacing: 2.2 },
  wordmarkSub: { color: '#55667A', fontSize: 12 },
  eyebrow: { color: '#8F5F00', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#0B1F33', fontSize: 26, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#55667A', fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: { backgroundColor: '#FFFBF3', borderRadius: 16, borderWidth: 1, borderColor: '#E3DACB', padding: 18, marginTop: 20 },
  label: { color: '#55667A', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#123C69', borderRadius: 12, minHeight: 52, paddingHorizontal: 14, fontSize: 16, color: '#0B1F33', letterSpacing: 0.5 },
  contador: { color: '#55667A', fontSize: 12, textAlign: 'right', marginTop: 6 },
  erroBox: { flexDirection: 'row', gap: 9, backgroundColor: '#FBE9E4', borderRadius: 12, padding: 13, marginTop: 10 },
  erroTxt: { flex: 1, color: '#7A2616', fontSize: 14, lineHeight: 20 },
  sugestao: { backgroundColor: '#E4EEF8', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  sugestaoTxt: { color: '#123C69', fontSize: 15, fontWeight: '800' },
  botao: { backgroundColor: '#123C69', borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  botaoOff: { opacity: 0.45 },
  botaoTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  rodapeTxt: { color: '#55667A', fontSize: 15 },
  link: { color: '#123C69', fontSize: 15, fontWeight: '800' },
  ajuda: { color: '#55667A', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 14 },
});
