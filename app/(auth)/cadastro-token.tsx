import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input, Button } from '../../components';
import { activarContaPorToken, prevalidarToken, TipoConvite } from '../../services/auth';
import { supabase } from '../../services/supabase';

const schema = z.object({
  nome: z.string().min(3, 'Indica o teu nome completo'),
  telefone: z.string().trim().min(9, 'Indica um número de telefone válido'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirma a senha'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

export default function CadastroPorToken() {
  const router = useRouter();
  const params = useLocalSearchParams<{ codigo?: string; tipo?: string; nomeAluno?: string }>();
  const tipo: TipoConvite = params.tipo === 'aluno' ? 'aluno' : 'encarregado';
  const codigo = String(params.codigo ?? '').trim();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { control, handleSubmit, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: tipo === 'aluno' ? params.nomeAluno ?? '' : '', telefone: '', email: '', senha: '', confirmarSenha: '' },
  });

  useEffect(() => {
    if (params.nomeAluno) setValue('nome', String(params.nomeAluno));
  }, [params.nomeAluno, setValue]);

  const titulo = tipo === 'aluno' ? 'Criar conta de aluno' : 'Criar conta de encarregado';
  const papel = tipo === 'aluno' ? 'aluno' : 'encarregado';

  async function onSubmit(data: FormData) {
    if (!codigo) {
      setErro('Convite em falta. Volta atrás e introduz o código novamente.');
      return;
    }

    setLoading(true);
    setErro('');
    try {
      const convite = await prevalidarToken(codigo, tipo);
      if (!convite.valido) throw new Error(convite.erro ?? 'Convite inválido ou expirado');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.senha,
        options: { data: { papeis: [papel], papel, nome: data.nome.trim() } },
      });
      if (authError) throw new Error(authError.message.includes('already') ? 'Este email já tem conta. Usa a opção Entrar.' : authError.message);
      if (!authData.user || !authData.session) {
        throw new Error('A conta foi criada, mas é necessário confirmar o email. A escola deve activar o acesso por email ou desligar essa confirmação no Supabase.');
      }

      const activacao = await activarContaPorToken(codigo, tipo, data.email, data.nome, data.telefone);
      if (!activacao.sucesso || !activacao.alunoId) throw new Error(activacao.erro ?? 'Não foi possível ligar a conta ao aluno');

      await AsyncStorage.multiSet([
        ['kulonga_papeis', JSON.stringify([papel])],
        ['kulonga_papel_activo', papel],
        ['kulonga_sessao_activa', 'true'],
        ['kulonga_onboarding_feito', 'true'],
        ['kulonga_aluno_id', activacao.alunoId],
      ]);
      router.replace(tipo === 'aluno' ? '/(aluno)' as any : '/(encarregado)' as any);
    } catch (e: any) {
      await supabase.auth.signOut().catch(() => undefined);
      setErro(e?.message ?? 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.voltar}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.logo}>KULONGA</Text>
          <Text style={styles.icone}>{tipo === 'aluno' ? '' : ''}</Text>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.sub}>O convite foi validado. Confirma os dados da família e cria as tuas credenciais pessoais.</Text>
          <View style={styles.form}>
            {tipo === 'encarregado' && params.nomeAluno ? <View style={styles.alunoCard}><Text style={styles.alunoLabel}>ALUNO ASSOCIADO</Text><Text style={styles.alunoNome}>{String(params.nomeAluno)}</Text><Text style={styles.alunoHint}>Este é o aluno indicado pela escola para este token.</Text></View> : null}
            <Controller control={control} name="nome" render={({ field, fieldState }) => <Input label={tipo === 'aluno' ? 'Nome confirmado pela escola' : 'Nome completo do encarregado'} placeholder="Nome completo" valor={field.value} onMudar={field.onChange} icone="person-outline" erro={fieldState.error?.message} />} />
            <Controller control={control} name="telefone" render={({ field, fieldState }) => <Input label={tipo === 'encarregado' ? 'Telefone do encarregado' : 'Telefone'} placeholder="+244 9XX XXX XXX" valor={field.value} onMudar={field.onChange} icone="call-outline" teclado="phone-pad" erro={fieldState.error?.message} />} />
            <Controller control={control} name="email" render={({ field, fieldState }) => <Input label="Email" placeholder="o-teu@email.com" valor={field.value} onMudar={field.onChange} icone="mail-outline" teclado="email-address" erro={fieldState.error?.message} />} />
            <Controller control={control} name="senha" render={({ field, fieldState }) => <Input label="Criar senha" placeholder="Mínimo 6 caracteres" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} />
            <Controller control={control} name="confirmarSenha" render={({ field, fieldState }) => <Input label="Confirmar senha" placeholder="Repete a senha" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} />
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            <Button titulo="Criar conta e entrar" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" carregando={loading} />
          </View>
          <Text style={styles.ajuda}>A escola só recebe a confirmação de que a conta foi associada. A tua senha é privada.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  scroll: { padding: 20, alignItems: 'center', paddingBottom: 48 },
  voltar: { alignSelf: 'flex-start', color: '#55667A' },
  logo: { color: '#0B2A4A', fontWeight: '900', fontSize: 18, letterSpacing: 2, marginTop: 8 },
  icone: { fontSize: 54, marginTop: 18 },
  titulo: { color: '#0B2A4A', fontSize: 25, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  sub: { color: '#55667A', textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 560 },
  form: { width: '100%', maxWidth: 560, marginTop: 24, backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E3DACB' },
  alunoCard: { backgroundColor: '#E4EEF8', borderRadius: 14, padding: 13, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#123C69' },
  alunoLabel: { color: '#123C69', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  alunoNome: { color: '#0B2A4A', fontSize: 16, fontWeight: '900', marginTop: 4 },
  alunoHint: { color: '#55667A', fontSize: 11, lineHeight: 16, marginTop: 3 },
  erro: { color: '#B83F28', textAlign: 'center', marginBottom: 12, lineHeight: 19 },
  ajuda: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
