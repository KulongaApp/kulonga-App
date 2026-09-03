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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Insere um email válido'),
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  senhaActual: z.string().min(6, 'Insere a senha actual'),
  novaSenha: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres').optional(),
  confirmarSenha: z.string().min(6, 'Confirma a nova senha').optional(),
}).refine((data) => {
  if (data.novaSenha && data.novaSenha !== data.confirmarSenha) return false;
  return true;
}, { message: 'As senhas não coincidem', path: ['confirmarSenha'] });

type FormData = z.infer<typeof schema>;

export default function EditarPerfilProfessor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: 'Prof. Carlos Manuel',
      email: 'prof@kulonga.ao',
      telefone: '923 456 789',
      senhaActual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);

    await AsyncStorage.setItem('kulonga_nome', data.nome);
    Alert.alert('Perfil actualizado', 'Os teus dados foram guardados com sucesso.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
            </TouchableOpacity>
            <Text style={s.headerTitulo}>Editar Perfil</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={s.avatarSection}>
            <View style={s.avatar}>
              <Text style={s.avatarTexto}>CM</Text>
            </View>
            <TouchableOpacity style={s.mudarFotoBtn}>
              <Ionicons name="camera-outline" size={20} color="#1D5C8A" />
              <Text style={s.mudarFotoTxt}>Mudar foto</Text>
            </TouchableOpacity>
          </View>

          <View style={s.form}>
            <Controller
              control={control}
              name="nome"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome completo"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="person-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="Email"
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
              name="telefone"
              render={({ field, fieldState }) => (
                <Input
                  label="Telefone"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="call-outline"
                  teclado="phone-pad"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <View style={s.divider} />
            <Text style={s.seccao}>Alterar Senha</Text>
            <Text style={s.seccaoSub}>Deixa em branco se não quiseres alterar</Text>

            <Controller
              control={control}
              name="senhaActual"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha actual"
                  placeholder="Insere a senha actual"
                  valor={field.value}
                  onMudar={field.onChange}
                  seguro={true}
                  icone="lock-closed-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="novaSenha"
              render={({ field, fieldState }) => (
                <Input
                  label="Nova senha"
                  placeholder="Mínimo 6 caracteres"
                  valor={field.value ?? ''}
                  onMudar={field.onChange}
                  seguro={true}
                  icone="lock-closed-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field, fieldState }) => (
                <Input
                  label="Confirmar nova senha"
                  placeholder="Repita a nova senha"
                  valor={field.value ?? ''}
                  onMudar={field.onChange}
                  seguro={true}
                  icone="lock-closed-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Button
              titulo="Guardar Alterações"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#111827' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D5C8A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarTexto: { color: '#fff', fontSize: 28, fontWeight: '700' },
  mudarFotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mudarFotoTxt: { fontSize: 14, color: '#1D5C8A', fontWeight: '600' },
  form: { width: '100%' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  seccao: { fontSize: 16, fontWeight: '700', color: '#111827' },
  seccaoSub: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
});
