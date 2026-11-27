import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AppShell, TabBar } from '../../components';

export default function SecretariaLayout() {
  const tabs = [
    { nome: 'Início', icone: 'home-outline', rota: '/(secretaria)/painel' },
    { nome: 'Professores', icone: 'people-outline', rota: '/(secretaria)/professores' },
    { nome: 'Convites', icone: 'person-add-outline', rota: '/(secretaria)/convites-professores' },
    { nome: 'Tokens', icone: 'key-outline', rota: '/(secretaria)/gerar-token' },
    { nome: 'Alunos', icone: 'people-outline', rota: '/(secretaria)/alunos' },
    { nome: 'Turmas', icone: 'school-outline', rota: '/(secretaria)/gestao-turmas' },
    { nome: 'Disciplinas', icone: 'book-outline', rota: '/(secretaria)/disciplinas' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AppShell perfil="secretaria"><Stack screenOptions={{ headerShown: false }} /></AppShell>
      <TabBar perfil="secretaria" rotas={tabs} />
    </View>
  );
}
