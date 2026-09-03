import React, { useState, useEffect } from 'react';
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
import { supabase, registarProfessor, listarEscolas } from '../../services';

const DISCIPLINAS = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia',
  'História', 'Geografia', 'Inglês', 'Francês', 'Educação Visual',
  'Educação Física', 'Informática', 'Filosofia', 'Sociologia',
];

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Insere um email válido'),
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  disciplinas: z.array(z.string()).min(1, 'Selecciona pelo menos uma disciplina'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirma a senha'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

export default function CadastroProfessor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);
  const [escolaId, setEscolaId] = useState('');
  const [escolaVisivel, setEscolaVisivel] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      disciplinas: [],
      senha: '',
      confirmarSenha: '',
    },
  });

  useEffect(() => {
    listarEscolas()
      .then((d) => setEscolas(d ?? []))
      .catch(() => setEscolas([]));
  }, []);

  const disciplinasSeleccionadas = watch('disciplinas');

  function toggleDisciplina(disc: string) {
    const actual = disciplinasSeleccionadas;
    if (actual.includes(disc)) {
      setValue('disciplinas', actual.filter((d) => d !== disc), { shouldValidate: true });
    } else {
      setValue('disciplinas', [...actual, disc], { shouldValidate: true });
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!escolaId) {
      Alert.alert('Selecciona a tua escola', 'Escolhe a escola onde leccionas.');
      return;
    }
    setLoading(true);

    // 1. Criar conta do professor no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: { data: { papeis: ['professor'], nome: data.nome } },
    });
    if (authError) {
      setLoading(false);
      Alert.alert('Erro', authError.message);
      return;
    }
    if (!authData.user) {
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível criar a conta.');
      return;
    }

    // 2. Registar professor na escola seleccionada (RPC)
    try {
      await registarProfessor({
        escolaId,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        disciplinas: data.disciplinas,
      });
      await AsyncStorage.setItem('kulonga_perfil', 'professor');
      await AsyncStorage.setItem('kulonga_onboarding_feito', 'true');
      setLoading(false);

      Alert.alert(
        'Professor registado!',
        `${data.nome} foi registado com sucesso.\n\nAgora podes fazer login.`,
        [
          {
            text: 'Ir para o login',
            onPress: () => router.replace('/(auth)/login-professor' as any),
          },
        ]
      );
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Erro', e?.message ?? 'Falhou ao registar o professor.');
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
          <Text style={s.icone}>👨‍🏫</Text>
          <Text style={s.titulo}>Registar Professor</Text>
          <Text style={s.subtitulo}>
            Cria a tua conta para começar a lançar notas
          </Text>

          <View style={s.form}>
            <View style={s.wrapper}>
              <Text style={s.label}>Escola onde leccionas</Text>
              <TouchableOpacity
                style={s.select}
                onPress={() => setEscolaVisivel(!escolaVisivel)}
                accessibilityLabel="Seleccionar escola"
              >
                <Ionicons name="school-outline" size={18} color="#6B7280" />
                <Text style={[s.selectText, !escolaId && { color: '#9CA3AF' }]}>
                  {escolas.find((e) => e.id === escolaId)?.nome || 'Selecciona a escola'}
                </Text>
                <Ionicons
                  name={escolaVisivel ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {escolaVisivel && (
              <View style={s.dropdown}>
                <ScrollView style={s.dropdownScroll} nestedScrollEnabled>
                  {escolas.map((esc) => (
                    <TouchableOpacity
                      key={esc.id}
                      style={[s.dropdownItem, escolaId === esc.id && s.dropdownItemActive]}
                      onPress={() => {
                        setEscolaId(esc.id);
                        setEscolaVisivel(false);
                      }}
                    >
                      <Text
                        style={[s.dropdownText, escolaId === esc.id && s.dropdownTextActive]}
                      >
                        {esc.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Controller
              control={control}
              name="nome"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome completo"
                  placeholder="Ex: Carlos Manuel"
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
                  label="Email institucional"
                  placeholder="Ex: professor@escola.ao"
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
              name="disciplinas"
              render={({ field, fieldState }) => (
                <View style={s.wrapper}>
                  <Text style={s.label}>Disciplinas que lecciona</Text>
                  <View style={s.disciplinasGrid}>
                    {DISCIPLINAS.map((disc) => {
                      const seleccionada = disciplinasSeleccionadas.includes(disc);
                      return (
                        <TouchableOpacity
                          key={disc}
                          style={[s.discChip, seleccionada && s.discChipActive]}
                          onPress={() => toggleDisciplina(disc)}
                          accessibilityLabel={`Disciplina ${disc}`}
                        >
                          <Text style={[s.discText, seleccionada && s.discTextActive]}>
                            {disc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {fieldState.error && (
                    <Text style={s.error}>{fieldState.error.message}</Text>
                  )}
                </View>
              )}
            />

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
              titulo="Registar"
              onPress={handleSubmit(onSubmit) as any}
              variante="primario"
              tamanho="grande"
              carregando={loading}
            />
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeTxt}>Já tens conta?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login-professor' as any)}
            >
              <Text style={s.link}>Fazer login</Text>
            </TouchableOpacity>
          </View>

          <View style={s.dica}>
            <Text style={s.dicaTxt}>
              🧪 Modo de teste{'\n'}
              Preenche todos os campos, selecciona disciplinas{'\n'}
              e usa um email válido para testar.
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
  form: { width: '100%', marginTop: 24 },
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
  disciplinasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  discChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  discChipActive: {
    borderColor: '#1D5C8A',
    backgroundColor: '#1D5C8A15',
  },
  discText: { fontSize: 13, color: '#6B7280' },
  discTextActive: { color: '#1D5C8A', fontWeight: '600' },
  error: { color: '#DC2626', marginTop: 6, fontSize: 12 },
  rodape: { marginTop: 24, alignItems: 'center' },
  rodapeTxt: { color: '#6B7280', fontSize: 14 },
  link: { color: '#1D5C8A', fontWeight: '700', marginTop: 6, fontSize: 14 },
  dica: { marginTop: 24, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, width: '100%' },
  dicaTxt: { color: '#6B7280', fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
