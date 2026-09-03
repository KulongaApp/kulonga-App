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
import { supabase, registarEscola } from '../../services';

const PROVINCIAS = [
  'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Namibe', 'Cabinda',
  'Malanje', 'Uíge', 'Bié', 'Moxico', 'Kwanza Norte', 'Kwanza Sul',
  'Lunda Norte', 'Lunda Sul', 'Cunene', 'Cuando Cubango', 'Bengo', 'Zaire',
];

const schema = z.object({
  nomeEscola: z.string().min(3, 'Nome da escola deve ter pelo menos 3 caracteres'),
  provincia: z.string().min(1, 'Selecciona uma província'),
  municipio: z.string().min(2, 'Insere o município'),
  endereco: z.string().optional(),
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  email: z.string().email('Insere um email válido'),
  nomeDirector: z.string().min(3, 'Nome do director deve ter pelo menos 3 caracteres'),
  telefoneDirector: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  emailDirector: z.string().email('Insere um email válido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirma a senha'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

export default function CadastroEscola() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provinciaVisivel, setProvinciaVisivel] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeEscola: '',
      provincia: '',
      municipio: '',
      endereco: '',
      telefone: '',
      email: '',
      nomeDirector: '',
      telefoneDirector: '',
      emailDirector: '',
      senha: '',
      confirmarSenha: '',
    },
  });

  const provinciaSeleccionada = watch('provincia');

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    // 1. Criar conta do director (secretaria) no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.emailDirector,
      password: data.senha,
      options: {
        data: { papeis: ['secretaria'], nome: data.nomeDirector },
      },
    });
    if (authError) {
      setLoading(false);
      Alert.alert('Erro', authError.message);
      return;
    }
    if (!authData.user) {
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível criar a conta do director.');
      return;
    }

    // 2. Registar escola + director (professor) via RPC
    try {
      const escolaId = await registarEscola({
        nome: data.nomeEscola,
        provincia: data.provincia,
        municipio: data.municipio,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        direccaoNome: data.nomeDirector,
        direccaoTelefone: data.telefoneDirector,
      });

      await AsyncStorage.setItem('kulonga_escola_id', escolaId);
      await AsyncStorage.setItem('kulonga_perfil', 'secretaria');
      await AsyncStorage.setItem('kulonga_onboarding_feito', 'true');
      setLoading(false);

      Alert.alert(
        'Escola registada!',
        `${data.nomeEscola} foi registada com sucesso.\n\nAgora podes fazer login com os dados do director.`,
        [
          {
            text: 'Ir para o login',
            onPress: () => router.replace('/(auth)/login-secretaria' as any),
          },
        ]
      );
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Erro', e?.message ?? 'Falhou ao registar a escola.');
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
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            style={s.voltarBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={s.logo}>KULONGA</Text>
          <Text style={s.icone}>🏫</Text>
          <Text style={s.titulo}>Registar Escola</Text>
          <Text style={s.subtitulo}>
            Preenche os dados da tua escola para começar a usar o Kulonga
          </Text>

          <View style={s.form}>
            <Text style={s.seccao}>Dados da Escola</Text>

            <Controller
              control={control}
              name="nomeEscola"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome da Escola"
                  placeholder="Ex: Escola Secundária de Luanda"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="school-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="provincia"
              render={({ field, fieldState }) => (
                <View style={s.wrapper}>
                  <Text style={s.label}>Província</Text>
                  <TouchableOpacity
                    style={[s.select, fieldState.error ? { borderColor: '#DC2626' } : {}]}
                    onPress={() => setProvinciaVisivel(!provinciaVisivel)}
                    accessibilityLabel="Seleccionar província"
                  >
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                    <Text style={[s.selectText, !field.value && { color: '#9CA3AF' }]}>
                      {field.value || 'Selecciona a província'}
                    </Text>
                    <Ionicons
                      name={provinciaVisivel ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {fieldState.error && (
                    <Text style={s.error}>{fieldState.error.message}</Text>
                  )}
                </View>
              )}
            />

            {provinciaVisivel && (
              <View style={s.dropdown}>
                <ScrollView style={s.dropdownScroll} nestedScrollEnabled>
                  {PROVINCIAS.map((prov) => (
                    <TouchableOpacity
                      key={prov}
                      style={[
                        s.dropdownItem,
                        provinciaSeleccionada === prov && s.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setValue('provincia', prov, { shouldValidate: true });
                        setProvinciaVisivel(false);
                      }}
                    >
                      <Text
                        style={[
                          s.dropdownText,
                          provinciaSeleccionada === prov && s.dropdownTextActive,
                        ]}
                      >
                        {prov}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Controller
              control={control}
              name="municipio"
              render={({ field, fieldState }) => (
                <Input
                  label="Município"
                  placeholder="Ex: Ingombota"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="map-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="endereco"
              render={({ field }) => (
                <Input
                  label="Endereço (opcional)"
                  placeholder="Ex: Rua Major Kanhangulo, 123"
                  valor={field.value ?? ''}
                  onMudar={field.onChange}
                  icone="navigate-outline"
                />
              )}
            />

            <Controller
              control={control}
              name="telefone"
              render={({ field, fieldState }) => (
                <Input
                  label="Telefone da Escola"
                  placeholder="Ex: 923 456 789"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="call-outline"
                  teclado="phone-pad"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="Email da Escola"
                  placeholder="Ex: info@escola.ao"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="mail-outline"
                  teclado="email-address"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <View style={s.divider} />
            <Text style={s.seccao}>Dados do Director</Text>

            <Controller
              control={control}
              name="nomeDirector"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome do Director"
                  placeholder="Ex: Dr. Carlos Manuel"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="person-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="telefoneDirector"
              render={({ field, fieldState }) => (
                <Input
                  label="Telefone do Director"
                  placeholder="Ex: 923 456 789"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="call-outline"
                  teclado="phone-pad"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="emailDirector"
              render={({ field, fieldState }) => (
                <Input
                  label="Email do Director (para login)"
                  placeholder="Ex: director@escola.ao"
                  valor={field.value}
                  onMudar={field.onChange}
                  icone="mail-outline"
                  teclado="email-address"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <View style={s.divider} />
            <Text style={s.seccao}>Criar Senha</Text>

            <Controller
              control={control}
              name="senha"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha"
                  placeholder="Mínimo 6 caracteres"
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
              name="confirmarSenha"
              render={({ field, fieldState }) => (
                <Input
                  label="Confirmar Senha"
                  placeholder="Repita a senha"
                  valor={field.value}
                  onMudar={field.onChange}
                  seguro={true}
                  icone="lock-closed-outline"
                  erro={fieldState.error?.message}
                />
              )}
            />

            <Button
              titulo="Registar Escola"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeTxt}>Já tens conta?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login-secretaria' as any)}
            >
              <Text style={s.link}>Fazer login</Text>
            </TouchableOpacity>
          </View>

          <View style={s.dica}>
            <Text style={s.dicaTxt}>
              🧪 Modo de teste{'\n'}
              Preenche todos os campos e usa um email válido{'\n'}
              para testar o registo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 40 },
  voltarBtn: { marginBottom: 8 },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 22 },
  icone: { fontSize: 48, marginTop: 12 },
  titulo: { fontSize: 22, fontWeight: '800', marginTop: 12, color: '#111827' },
  subtitulo: { color: '#6B7280', textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 },
  form: { width: '100%', marginTop: 20 },
  seccao: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  wrapper: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: '600' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  selectText: { flex: 1, fontSize: 14, color: '#374151' },
  error: { color: '#DC2626', marginTop: 6, fontSize: 12 },
  dropdown: {
    marginTop: -8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: { backgroundColor: '#FEF3EC' },
  dropdownText: { fontSize: 14, color: '#374151' },
  dropdownTextActive: { color: '#C8511B', fontWeight: '600' },
  rodape: { marginTop: 24, alignItems: 'center' },
  rodapeTxt: { color: '#6B7280', fontSize: 14 },
  link: { color: '#C8511B', fontWeight: '700', marginTop: 6, fontSize: 14 },
  dica: { marginTop: 24, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, width: '100%' },
  dicaTxt: { color: '#6B7280', fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
