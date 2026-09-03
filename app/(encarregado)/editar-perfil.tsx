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
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
});

type FormData = z.infer<typeof schema>;

export default function EditarPerfilEncarregado() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: 'Encarregado',
      telefone: '924 567 890',
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
              <Text style={s.avatarTexto}>👨‍👩‍👧</Text>
            </View>
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

            <Button
              titulo="Guardar Alterações"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>

          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => Alert.alert('Sair', 'Terminar sessão?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: () => {
                AsyncStorage.multiRemove([
                  'kulonga_sessao_activa', 'kulonga_papel_activo',
                  'kulonga_papeis', 'kulonga_nome',
                ]);
                router.replace('/(auth)/escolher-perfil' as any);
              }},
            ])}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={s.logoutTxt}>Terminar sessão</Text>
          </TouchableOpacity>
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
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#C8511B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTexto: { fontSize: 36 },
  form: { width: '100%' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 32, paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  logoutTxt: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
});
