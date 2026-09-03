import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { TabBar } from '../../components';

export default function SecretariaLayout() {
  const tabs = [
    { nome: 'Início', icone: 'home-outline', rota: '/(secretaria)/painel' },
    { nome: 'Tokens', icone: 'key-outline', rota: '/(secretaria)/gerar-token' },
    { nome: 'Adicionar', icone: 'person-add-outline', rota: '/(secretaria)/adicionar-professor' },
    { nome: 'Alunos', icone: 'people-outline', rota: '/(secretaria)/alunos' },
    { nome: 'Disciplinas', icone: 'book-outline', rota: '/(secretaria)/disciplinas' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <TabBar perfil="secretaria" rotas={tabs} />
    </View>
  );
}
