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
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { loginComEmail } from '../../services/auth';
import { activarConviteProfessor } from '../../services/professores';
import { supabase } from '../../services/supabase';

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

    const convitePendente = await AsyncStorage.getItem('kulonga_convite_professor_pendente');
    if (convitePendente) {
      try {
        await activarConviteProfessor(convitePendente);
        await AsyncStorage.removeItem('kulonga_convite_professor_pendente');
      } catch (e: any) {
        setErro(e?.message ?? 'Não foi possível activar o convite.');
        return;
      }
    }

    // O professor tem de estar associado a uma escola (convite activado) e activo.
    // Só bloqueia quando a consulta correu bem e confirmou que não há perfil.
    if (res.userId) {
      const { data: perfil, error: erroPerfil } = await supabase
        .from('professores').select('id, activo').eq('user_id', res.userId).maybeSingle();
      if (!erroPerfil && !perfil) {
        await supabase.auth.signOut();
        setErro('Esta conta não está associada a nenhuma escola como professor. Se és professor, usa o token que a escola te enviou. Se és encarregado ou aluno, escolhe o teu perfil.');
        return;
      }
      if (!erroPerfil && perfil?.activo === false) {
        await supabase.auth.signOut();
        setErro('Esta conta de professor está desactivada. Fala com a secretaria da escola.');
        return;
      }
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
          <Ionicons name="school-outline" size={42} color="#123C69" />
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

          <View style={[s.rodape, { marginTop: 16 }]}>
            <Text style={s.rodapeTxt}>Primeiro acesso?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/token-professor' as any)}
              accessibilityLabel="Entrar com o token de professor"
            >
              <Text style={s.link}>Tenho um token de professor</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.rodape, { marginTop: 12 }]}>
            <Text style={s.rodapeTxt}>És encarregado ou aluno?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/escolher-perfil' as any)}
              accessibilityLabel="Escolher o meu perfil"
            >
              <Text style={s.link}>Escolhe o teu perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Dica */}
          <View style={s.dica}>
            <Text style={s.dicaTxt}>
              Primeiro acesso? Usa o token que a secretaria da tua escola te enviou.
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
  voltarTxt:  { color: '#55667A', fontSize: 14 },
  logo:       { color: '#8F5F00', fontWeight: '800', fontSize: 22, marginTop: 8 },
  icone:      { fontSize: 64, marginTop: 16 },
  titulo:     { fontSize: 22, fontWeight: '800', marginTop: 12, color: '#0B1F33' },
  subtitulo:  { color: '#55667A', textAlign: 'center', marginTop: 8,
                fontSize: 14, lineHeight: 20 },
  form:       { width: '100%', marginTop: 24 },
  esqueciTxt: { color: '#55667A', marginTop: 8, marginBottom: 16, fontSize: 13 },
  erroBox: { color: '#B83F28', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  rodape:     { marginTop: 24, alignItems: 'center' },
  rodapeTxt:  { color: '#55667A', fontSize: 14 },
  link:       { color: '#8F5F00', fontWeight: '700', marginTop: 6, fontSize: 14 },
  dica:       { marginTop: 24, backgroundColor: '#F6EFE3', borderRadius: 10,
                padding: 12, width: '100%' },
  dicaTxt:    { color: '#55667A', fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
