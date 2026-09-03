import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '../../components';
import { adicionarProfessor, obterEscolaDoUsuario } from '../../services/professores';

const schema = z.object({
  nomeCompleto: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(9, 'Telemóvel inválido'),
  disciplina: z.string().min(2, 'Disciplina inválida'),
  turmas: z.string().min(2, 'Indica pelo menos uma turma'),
  coordenador: z.boolean(),
  turmaCoord: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdicionarProfessor() {
  const router = useRouter();
  const { control, handleSubmit, watch } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nomeCompleto: '', email: '', telefone: '', disciplina: '', turmas: '', coordenador: false, turmaCoord: '' } });
  const coordenador = watch('coordenador');

  function gerarSenha() {
    return Math.random().toString(36).slice(-8);
  }

  async function onSubmit(data: FormData) {
    const senha = gerarSenha();
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) { Alert.alert('Erro', 'Escola não encontrada.'); return; }
      await adicionarProfessor({ escolaId, nome: data.nomeCompleto, email: data.email, telefone: data.telefone, disciplinas: data.disciplina ? [data.disciplina] : [] });
      Alert.alert('Professor adicionado!', `✅ ${data.nomeCompleto} foi ligado à escola.\n\nCredenciais para o professor:\nEmail: ${data.email}\nSenha temporária: ${senha}\n\n→ Entrega ao professor. Ele vai em "Criar conta → Professor — Ativar conta" e cria a senha com este email. Depois faz Login e já vê as turmas.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Falha'); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>Adicionar Professor</Text>
          <Text style={styles.sub}>Preenche os dados do professor. Credenciais serão geradas.</Text>
        </View>

        <View style={styles.form}>
          <Controller control={control} name="nomeCompleto" render={({ field, fieldState }) => (
            <Input label="Nome completo" placeholder="Nome do professor" valor={field.value} onMudar={field.onChange} icone="person-outline" erro={fieldState.error?.message} />
          )} />

          <Controller control={control} name="email" render={({ field, fieldState }) => (
            <Input label="Email institucional" placeholder="professor@escola.ao" valor={field.value} onMudar={field.onChange} icone="mail-outline" erro={fieldState.error?.message} />
          )} />

          <Controller control={control} name="telefone" render={({ field, fieldState }) => (
            <Input label="Telemóvel" placeholder="+244 9XX XXX XXX" valor={field.value} onMudar={field.onChange} icone="call-outline" erro={fieldState.error?.message} />
          )} />

          <Controller control={control} name="disciplina" render={({ field, fieldState }) => (
            <Input label="Disciplina principal" placeholder="Matemática" valor={field.value} onMudar={field.onChange} icone="book-outline" erro={fieldState.error?.message} />
          )} />

          <Controller control={control} name="turmas" render={({ field, fieldState }) => (
            <Input label="Turmas (vírgula)" placeholder="10ªA, 11ªB" valor={field.value} onMudar={field.onChange} icone="layers-outline" erro={fieldState.error?.message} />
          )} />

          <View style={styles.rowSwitch}>
            <Text style={styles.label}>É coordenador de turma?</Text>
            <Controller control={control} name="coordenador" render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} />
            )} />
          </View>

          {coordenador && (
            <Controller control={control} name="turmaCoord" render={({ field, fieldState }) => (
              <Input label="Turma que coordena" placeholder="10ªA" valor={field.value ?? ''} onMudar={field.onChange} icone="ribbon-outline" erro={fieldState.error?.message} />
            )} />
          )}

          <Button titulo="Cadastrar Professor" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 100 },
  headerRow: { marginBottom: 12 },
  titulo: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#6B7280', marginTop: 6 },
  form: { marginTop: 12 },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  label: { fontWeight: '700' },
});
