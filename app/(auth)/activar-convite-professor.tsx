import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { supabase } from '../../services';
import { activarConviteProfessor, obterDadosConvite } from '../../services/professores';
import type { DadosConvite } from '../../services/professores';
import { diagnosticarToken, mensagemDoDiagnostico } from '../../services/auth';

const CODIGO_VALIDO = /^[a-f0-9]{32}$/;

// Ativação do convite do professor.
// 1) Cola o token. 2) Vê os dados que a secretaria registou (só leitura). 3) Cria a senha.
export default function ActivarConviteProfessor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ convite?: string }>();
  const conviteInicial = typeof params.convite === 'string' ? params.convite.trim().toLowerCase() : '';

  const [convite, setConvite] = useState(conviteInicial);
  const [dados, setDados] = useState<DadosConvite | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [erroToken, setErroToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fim, setFim] = useState<null | 'activa' | 'confirmar-email'>(null);

  async function verificar(valor: string) {
    const codigo = valor.trim().toLowerCase();
    if (!CODIGO_VALIDO.test(codigo)) {
      setErroToken('Introduz o código completo de 32 caracteres recebido da escola.');
      return;
    }
    setVerificando(true);
    setErroToken('');
    setDados(null);
    try {
      const diag = await diagnosticarToken(codigo, 'professor');
      if (diag && diag.motivo !== 'ok') {
        setErroToken(mensagemDoDiagnostico(diag, 'professor'));
        return;
      }
      const d = await obterDadosConvite(codigo);
      if (!d) {
        setErroToken('Não foi possível carregar os teus dados. Tenta outra vez ou fala com a secretaria da escola.');
        return;
      }
      setConvite(codigo);
      setDados(d);
    } finally {
      setVerificando(false);
    }
  }

  // Link com o código já preenchido: verifica logo
  useEffect(() => {
    if (CODIGO_VALIDO.test(conviteInicial)) verificar(conviteInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conviteInicial]);

  function outroToken() {
    setDados(null);
    setSenha('');
    setConfirmar('');
    setErroForm('');
  }

  async function criarConta() {
    if (!dados) return;
    setErroForm('');
    if (senha.length < 8) { setErroForm('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (senha !== confirmar) { setErroForm('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      // Valida o convite ANTES de criar a conta, para não deixar contas sem escola
      const diag = await diagnosticarToken(convite, 'professor', dados.email);
      if (diag && diag.motivo !== 'ok') throw new Error(mensagemDoDiagnostico(diag, 'professor'));

      await AsyncStorage.setItem('kulonga_convite_professor_pendente', convite);
      // O email e o nome vêm sempre da secretaria, nunca do que o professor escreve
      const { data: authData, error } = await supabase.auth.signUp({
        email: dados.email.trim().toLowerCase(),
        password: senha,
        options: { data: { papeis: ['professor'], nome: dados.nome } },
      });
      if (error) throw error;
      if (!authData.user) throw new Error('Não foi possível criar a conta.');
      if (authData.session) {
        await activarConviteProfessor(convite);
        await AsyncStorage.removeItem('kulonga_convite_professor_pendente');
        setFim('activa');
      } else {
        setFim('confirmar-email');
      }
    } catch (e: any) {
      await AsyncStorage.removeItem('kulonga_convite_professor_pendente');
      const msg = String(e?.message ?? '');
      setErroForm(/already|registered/i.test(msg)
        ? 'Este email já tem conta. Usa "Entrar como professor".'
        : msg || 'Não foi possível criar a conta. Verifica o convite e tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Agrupa as disciplinas por turma
  const porTurma: Record<string, string[]> = {};
  (dados?.atribuicoes ?? []).forEach((a) => {
    (porTurma[a.turma] = porTurma[a.turma] ?? []).push(a.disciplina);
  });

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.shell}>
            <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar" style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#0B2A4A" />
              <Text style={s.back}>Voltar</Text>
            </TouchableOpacity>

            <View style={s.brandRow}>
              <Image source={require('../../assets/logo-mark.png')} style={s.logo} accessibilityLabel="Kulonga" />
              <Text style={s.wordmark}>KULONGA</Text>
            </View>

            {fim ? (
              <View style={s.card}>
                <Ionicons name="checkmark-circle" size={44} color="#1A7358" />
                <Text style={s.title}>{fim === 'activa' ? 'Conta criada' : 'Confirma o teu email'}</Text>
                <Text style={s.subtitle}>
                  {fim === 'activa'
                    ? 'A tua conta ficou associada à escola, com as tuas turmas e disciplinas. Já podes entrar.'
                    : 'Enviámos-te uma mensagem. Confirma o email e depois entra como professor para concluir a ativação.'}
                </Text>
                <View style={{ height: 18 }} />
                <Button titulo="Entrar como professor" onPress={() => router.replace('/(auth)/login-professor' as any)} variante="primario" tamanho="grande" />
              </View>
            ) : !dados ? (
              <>
                <Text style={s.eyebrow}>PRIMEIRO ACESSO · PROFESSOR</Text>
                <Text style={s.title}>Ativar o teu acesso</Text>
                <Text style={s.subtitle}>
                  Cola o código que a secretaria te enviou. Vais ver os dados que a escola registou sobre ti e só precisas de criar uma senha.
                </Text>
                <View style={s.form}>
                  <Input
                    label="Código do convite"
                    placeholder="Código de 32 caracteres"
                    valor={convite}
                    onMudar={(v: string) => { setConvite(v.trim().toLowerCase()); if (erroToken) setErroToken(''); }}
                    icone="key-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                    erro={erroToken || undefined}
                  />
                  <Button titulo="Verificar convite" onPress={() => verificar(convite)} variante="primario" tamanho="grande" carregando={verificando} />
                </View>
              </>
            ) : (
              <>
                <Text style={s.eyebrow}>CONVITE VÁLIDO</Text>
                <Text style={s.title}>Estes dados são teus?</Text>
                <Text style={s.subtitle}>
                  A secretaria registou estes dados. Não podem ser alterados aqui. Se algo estiver errado, fala com a secretaria antes de continuar.
                </Text>

                <View style={s.card}>
                  <View style={s.cardTop}>
                    <Ionicons name="lock-closed-outline" size={16} color="#55667A" />
                    <Text style={s.cardTopTxt}>REGISTADOS PELA SECRETARIA</Text>
                  </View>
                  <Linha rotulo="Nome" valor={dados.nome} />
                  <Linha rotulo="Email" valor={dados.email} />
                  {dados.telefone ? <Linha rotulo="Telefone" valor={dados.telefone} /> : null}
                  {dados.escola ? <Linha rotulo="Escola" valor={dados.escola} /> : null}
                  <Text style={s.rotulo}>TURMAS E DISCIPLINAS</Text>
                  {Object.keys(porTurma).length ? (
                    Object.entries(porTurma).map(([turma, discs]) => (
                      <Text key={turma} style={s.valor}>{turma}: <Text style={s.valorSuave}>{discs.join(', ')}</Text></Text>
                    ))
                  ) : (
                    <Text style={s.valorSuave}>Ainda sem turmas atribuídas. A secretaria pode atribuí-las depois.</Text>
                  )}
                </View>

                <View style={s.form}>
                  <Input label="Criar senha" placeholder="Mínimo 8 caracteres" valor={senha} onMudar={setSenha} seguro icone="lock-closed-outline" />
                  <Input label="Confirmar senha" placeholder="Repete a senha" valor={confirmar} onMudar={setConfirmar} seguro icone="lock-closed-outline" />
                  {erroForm ? <Text style={s.erro} accessibilityRole="alert">{erroForm}</Text> : null}
                  <Button titulo="Confirmo que sou eu e criar conta" onPress={criarConta} variante="primario" tamanho="grande" carregando={loading} />
                  <TouchableOpacity onPress={outroToken} style={s.outro} accessibilityRole="button">
                    <Text style={s.link}>Não sou eu / usar outro token</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!fim ? (
              <View style={s.footer}>
                <Text style={s.muted}>Já tens conta?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login-professor' as any)}>
                  <Text style={s.link}>Entrar como professor</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View>
      <Text style={s.rotulo}>{rotulo.toUpperCase()}</Text>
      <Text style={s.valor} selectable>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  scroll: { padding: 20, paddingBottom: 50, alignItems: 'center' },
  shell: { width: '100%', maxWidth: 520 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginBottom: 6 },
  back: { color: '#0B2A4A', fontSize: 16, fontWeight: '600' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  logo: { width: 40, height: 40, borderRadius: 11 },
  wordmark: { color: '#0B2A4A', fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  eyebrow: { color: '#8F5F00', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#0B1F33', fontSize: 25, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#55667A', fontSize: 15, lineHeight: 22, marginTop: 8 },
  form: { marginTop: 20 },
  card: { backgroundColor: '#FFFBF3', borderRadius: 16, borderWidth: 1, borderColor: '#E3DACB', padding: 18, marginTop: 18, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardTopTxt: { color: '#55667A', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  rotulo: { color: '#55667A', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 10 },
  valor: { color: '#0B1F33', fontSize: 16, fontWeight: '700', marginTop: 3, lineHeight: 22 },
  valorSuave: { color: '#55667A', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  erro: { color: '#B83F28', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  outro: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  muted: { color: '#55667A', fontSize: 15 },
  link: { color: '#123C69', fontSize: 15, fontWeight: '800' },
});
