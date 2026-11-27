import React, { useState } from 'react';
import { KeyboardAvoidingView, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { loginComEmail } from '../../services/auth';

const schema = z.object({ email: z.string().email('Email inválido'), senha: z.string().min(6, 'Mínimo 6 caracteres') });
type FormData = z.infer<typeof schema>;

export default function LoginEncarregado() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '', senha: '' } });
  const onSubmit = async (data: FormData) => {
    setLoading(true); setErro('');
    const res = await loginComEmail(data.email.trim().toLowerCase(), data.senha, 'encarregado');
    setLoading(false);
    if (!res.sucesso) { setErro('Email ou senha incorrectos.'); return; }
    const papeis = res.papeis ?? [res.papel ?? 'encarregado'];
    if (!papeis.includes('encarregado')) { setErro('Esta conta não está registada como encarregado.'); return; }
    await AsyncStorage.multiSet([['kulonga_papeis', JSON.stringify(papeis)], ['kulonga_papel_activo', 'encarregado'], ['kulonga_sessao_activa', 'true']]);
    router.replace('/(encarregado)/painel' as any);
  };
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"><TouchableOpacity onPress={() => router.back()}><Text style={s.voltar}>← Voltar</Text></TouchableOpacity><Text style={s.logo}>KULONGA</Text><Ionicons name="people-outline" size={42} color="#123C69" /><Text style={s.titulo}>Área do Encarregado</Text><Text style={s.sub}>Entra com o email e senha que criaste no primeiro acesso</Text><View style={s.form}><Controller control={control} name="email" render={({ field, fieldState }) => <Input label="Email" placeholder="encarregado@email.com" valor={field.value} onMudar={field.onChange} icone="mail-outline" teclado="email-address" erro={fieldState.error?.message} />} /><Controller control={control} name="senha" render={({ field, fieldState }) => <Input label="Senha" placeholder="A tua senha" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} /><TouchableOpacity onPress={() => router.push('/(auth)/recuperar-senha' as any)}><Text style={s.esqueci}>Esqueci a senha</Text></TouchableOpacity>{erro ? <Text style={s.erro}>{erro}</Text> : null}<Button titulo="Entrar" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" carregando={loading} /></View><View style={s.rodape}><Text style={s.rodapeTxt}>Primeiro acesso?</Text><TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/token-encarregado', params: { tipo: 'encarregado' } } as any)}><Text style={s.link}>Usar token da escola</Text></TouchableOpacity></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#fff' }, scroll: { padding: 20, alignItems: 'center', paddingBottom: 40 }, voltar: { alignSelf: 'flex-start', color: '#55667A' }, logo: { color: '#8F5F00', fontWeight: '800', fontSize: 22, marginTop: 8 }, titulo: { fontSize: 22, fontWeight: '800', marginTop: 12, color: '#0B2A4A' }, sub: { color: '#55667A', textAlign: 'center', marginTop: 8, lineHeight: 20 }, form: { width: '100%', marginTop: 24 }, esqueci: { color: '#55667A', marginTop: 8, marginBottom: 16, fontSize: 13 }, erro: { color: '#B83F28', textAlign: 'center', marginBottom: 8 }, rodape: { marginTop: 24, alignItems: 'center' }, rodapeTxt: { color: '#55667A' }, link: { color: '#8F5F00', fontWeight: '700', marginTop: 6 } });
