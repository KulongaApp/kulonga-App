import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';

const schema = z.object({
  email: z.string().email('Insere um email válido'),
});

type FormData = z.infer<typeof schema>;

export default function RecuperarSenha() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: 'kulonga://recuperar-senha' });
      if (error) throw error;
      setEnviado(true);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível enviar o email.');
    } finally { setLoading(false); }
  };

  if (enviado) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <View style={s.iconContainer}>
            <Ionicons name="mail-open-outline" size={64} color="#16A34A" />
          </View>
          <Text style={s.titulo}>Email enviado!</Text>
          <Text style={s.subtitulo}>
            Verifica a tua caixa de entrada e segue as instruções para repor a senha.
          </Text>
          <Text style={s.nota}>
            Não recebeste? Verifica a pasta de spam ou tenta de novo.
          </Text>
          <Button
            titulo="Voltar ao login"
            onPress={() => router.replace('/(auth)/escolher-perfil' as any)}
            variante="primario"
            tamanho="grande"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            style={s.voltarBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={s.topo}>
            <View style={s.iconContainer}>
              <Ionicons name="key-outline" size={48} color="#1D5C8A" />
            </View>
            <Text style={s.titulo}>Recuperar Senha</Text>
            <Text style={s.subtitulo}>
              Insere o email associado à tua conta e enviar-te-emos um link para repor a senha.
            </Text>
          </View>

          <View style={s.form}>
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="Email"
                  placeholder="exemplo@email.ao"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="mail-outline"
                  teclado="email-address"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Button
              titulo="Enviar link de recuperação"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeTxt}>Lembraste da senha?</Text>
            <TouchableOpacity
              onPress={() => router.back()}
            >
              <Text style={s.link}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  voltarBtn: { marginBottom: 8 },
  topo: { alignItems: 'center', marginBottom: 32 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitulo: {
    color: '#6B7280', textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20,
  },
  nota: { color: '#9CA3AF', textAlign: 'center', marginTop: 8, fontSize: 13 },
  form: { width: '100%' },
  rodape: { marginTop: 24, alignItems: 'center' },
  rodapeTxt: { color: '#6B7280', fontSize: 14 },
  link: { color: '#1D5C8A', fontWeight: '700', marginTop: 6, fontSize: 14 },
});
