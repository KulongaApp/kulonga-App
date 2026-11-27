import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '../../components';
import { adicionarProfessorPendente, obterEscolaDoUsuario } from '../../services/professores';

const schema = z.object({
  nome: z.string().trim().min(3, 'Nome muito curto'),
  email: z.string().trim().email('Email inválido'),
  telefone: z.string().trim().min(9, 'Telemóvel inválido'),
});
type FormData = z.infer<typeof schema>;

export default function AdicionarProfessor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: '', email: '', telefone: '' } });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      await adicionarProfessorPendente({ escolaId, nome: data.nome, email: data.email, telefone: data.telefone });
      Alert.alert(
        'Professor adicionado',
        'O professor foi registado na gestão da escola como pendente. Para criar o token de activação, abre a área separada de Convites de professores.',
        [{ text: 'Fechar', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Não foi possível criar o convite', e?.message ?? 'Tenta novamente.');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Adicionar professor</Text>
        <Text style={s.subtitle}>Regista o professor na escola. Depois podes gerar o convite de activação na área separada de Convites de professores.</Text>
        <View style={s.form}>
          <Controller control={control} name="nome" render={({ field, fieldState }) => <Input label="Nome completo" placeholder="Nome do professor" valor={field.value} onMudar={field.onChange} icone="person-outline" erro={fieldState.error?.message} />} />
          <Controller control={control} name="email" render={({ field, fieldState }) => <Input label="Email institucional" placeholder="professor@escola.ao" valor={field.value} onMudar={field.onChange} icone="mail-outline" teclado="email-address" erro={fieldState.error?.message} />} />
          <Controller control={control} name="telefone" render={({ field, fieldState }) => <Input label="Telemóvel" placeholder="+244 9XX XXX XXX" valor={field.value} onMudar={field.onChange} icone="call-outline" teclado="phone-pad" erro={fieldState.error?.message} />} />
          <Button titulo="Adicionar professor" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" carregando={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F6EFE3' }, scroll: { padding: 20, paddingBottom: 80 }, title: { color: '#0B2A4A', fontSize: 24, fontWeight: '900' }, subtitle: { color: '#55667A', lineHeight: 21, marginTop: 8, marginBottom: 22 }, form: { backgroundColor: '#fff', borderRadius: 16, padding: 18 }, });
