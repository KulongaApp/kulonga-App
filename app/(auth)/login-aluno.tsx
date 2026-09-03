import React, { useState } from 'react';
import { KeyboardAvoidingView, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '../../components';
import { loginComEmail } from '../../services/auth';

const schema = z.object({ email: z.string().email('Email inválido'), senha: z.string().min(6, 'Mínimo 6 caracteres') });
type FormData = z.infer<typeof schema>;

export default function LoginAluno() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '', senha: '' } });
  const onSubmit = async (data: FormData) => {
    setLoading(true); setErro('');
    const res = await loginComEmail(data.email, data.senha);
    setLoading(false);
    if (!res.sucesso) { setErro('Email ou senha incorrectos.'); return; }
    const papeis = res.papeis ?? [res.papel ?? 'aluno'];
    await AsyncStorage.setItem('kulonga_papeis', JSON.stringify(papeis));
    await AsyncStorage.setItem('kulonga_papel_activo', papeis.includes('aluno') ? 'aluno' : papeis[0]);
    await AsyncStorage.setItem('kulonga_sessao_activa', 'true');
    router.replace(papeis.includes('aluno') ? '/(aluno)/painel' as any : `/( ${papeis[0]})` as any);
  };
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}><Text style={s.voltar}>← Voltar</Text></TouchableOpacity>
          <Text style={s.logo}>KULONGA</Text><Text style={s.icone}>🎓</Text>
          <Text style={s.titulo}>Área do Aluno</Text><Text style={s.sub}>Entra com o email e senha que a secretaria registou</Text>
          <View style={s.form}>
            <Controller control={control} name="email" render={({ field, fieldState }) => <Input label="Email" placeholder="aluno@escola.ao" valor={field.value} onMudar={field.onChange} icone="mail-outline" teclado="email-address" erro={fieldState.error?.message} />} />
            <Controller control={control} name="senha" render={({ field, fieldState }) => <Input label="Senha" placeholder="A tua senha" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} />
            <TouchableOpacity onPress={() => router.push('/(auth)/recuperar-senha' as any)}><Text style={s.esqueci}>Esqueci a senha</Text></TouchableOpacity>
            {erro ? <Text style={s.erro}>{erro}</Text> : null}
            <Button titulo="Entrar" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" carregando={loading} />
          </View>
          <View style={s.rodape}><Text style={s.rodapeTxt}>Não tens conta?</Text><TouchableOpacity onPress={() => router.push('/(auth)/cadastro-aluno' as any)}><Text style={s.link}>Registar aluno</Text></TouchableOpacity></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  voltar: { alignSelf: 'flex-start', color: '#6B7280' },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 22, marginTop: 8 },
  icone: { fontSize: 64, marginTop: 16 },
  titulo: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  sub: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  form: { width: '100%', marginTop: 24 },
  esqueci: { color: '#6B7280', marginTop: 8, marginBottom: 16, fontSize: 13 },
  erro: { color: '#DC2626', textAlign: 'center', marginBottom: 8 },
  rodape: { marginTop: 24, alignItems: 'center' },
  rodapeTxt: { color: '#6B7280' },
  link: { color: '#C8511B', fontWeight: '700', marginTop: 6 },
});
