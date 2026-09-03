import React, { useState } from 'react';
import {
  KeyboardAvoidingView, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Platform
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '../../components';
import { loginComEmail } from '../../services/auth';

const schema = z.object({
  email: z.string().email('Insere um email válido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginProfessor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setErro('');
    const res = await loginComEmail(data.email, data.senha);
    setLoading(false);

    if (!res.sucesso) {
      setErro('Email ou senha incorrectos. Verifica os dados ou regista a tua conta.');
      return;
    }

    const papeis = res.papeis ?? [res.papel ?? 'professor'];
    await AsyncStorage.setItem('kulonga_papeis', JSON.stringify(papeis));
    await AsyncStorage.setItem('kulonga_papel_activo', papeis[0]);

    if (papeis.length > 1 && papeis.includes('encarregado')) {
      router.replace('/(auth)/selector-perfil' as any);
    } else {
      router.replace(`/(${papeis[0]})` as any);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Botão voltar */}
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            style={s.voltarBtn}
          >
            <Text style={s.voltarTxt}>← Voltar</Text>
          </TouchableOpacity>

          {/* Cabeçalho */}
          <Text style={s.logo}>KULONGA</Text>
          <Text style={s.icone}>👨‍🏫</Text>
          <Text style={s.titulo}>Área do Professor</Text>
          <Text style={s.subtitulo}>
            Entra com os dados que a tua escola te forneceu
          </Text>

          {/* Formulário */}
          <View style={s.form}>
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="Email institucional"
                  placeholder="professor@escola.ao"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="mail-outline"
                  teclado="email-address"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="senha"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha"
                  placeholder="A tua senha"
                  valor={field.value}
                  onMudar={field.onChange}
                  seguro={true}
                  icone="lock-closed-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/recuperar-senha' as any)}
              accessibilityLabel="Esqueci a senha"
            >
              <Text style={s.esqueciTxt}>Esqueci a senha</Text>
            </TouchableOpacity>

            {erro ? <Text style={s.erroBox}>{erro}</Text> : null}

            <Button
              titulo="Entrar"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>

          {/* Rodapé */}
          <View style={s.rodape}>
            <Text style={s.rodapeTxt}>Não tens conta?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/cadastro-professor' as any)}
            >
              <Text style={s.link}>Regista-te como professor</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.rodape, { marginTop: 16 }]}>
            <Text style={s.rodapeTxt}>És encarregado de educação?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/token-encarregado' as any)}
              accessibilityLabel="Aceder com código de encarregado"
            >
              <Text style={s.link}>Acede com o teu código</Text>
            </TouchableOpacity>
          </View>

          {/* Dica */}
          <View style={s.dica}>
            <Text style={s.dicaTxt}>
              Usa o email e senha fornecidos pela tua escola.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#fff' },
  scroll:     { padding: 20, alignItems: 'center', paddingBottom: 40 },
  voltarBtn:  { alignSelf: 'flex-start', marginBottom: 8 },
  voltarTxt:  { color: '#6B7280', fontSize: 14 },
  logo:       { color: '#C8511B', fontWeight: '800', fontSize: 22, marginTop: 8 },
  icone:      { fontSize: 64, marginTop: 16 },
  titulo:     { fontSize: 22, fontWeight: '800', marginTop: 12, color: '#111827' },
  subtitulo:  { color: '#6B7280', textAlign: 'center', marginTop: 8,
                fontSize: 14, lineHeight: 20 },
  form:       { width: '100%', marginTop: 24 },
  esqueciTxt: { color: '#6B7280', marginTop: 8, marginBottom: 16, fontSize: 13 },
  erroBox: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  rodape:     { marginTop: 24, alignItems: 'center' },
  rodapeTxt:  { color: '#6B7280', fontSize: 14 },
  link:       { color: '#C8511B', fontWeight: '700', marginTop: 6, fontSize: 14 },
  dica:       { marginTop: 24, backgroundColor: '#F3F4F6', borderRadius: 10,
                padding: 12, width: '100%' },
  dicaTxt:    { color: '#6B7280', fontSize: 12, lineHeight: 20, textAlign: 'center' },
});