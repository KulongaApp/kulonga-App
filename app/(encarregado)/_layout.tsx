import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AppShell, TabBar } from '../../components';

export default function EncarregadoLayout() {
  const tabs = [
    { nome: 'Notas', icone: 'school-outline', rota: '/(encarregado)/painel' },
    { nome: 'Boletim', icone: 'document-text-outline', rota: '/(encarregado)/boletim' },
    { nome: 'Contactos', icone: 'call-outline', rota: '/(encarregado)/contactos' },
    { nome: 'Perfil', icone: 'person-outline', rota: '/(encarregado)/perfil' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AppShell perfil="encarregado"><Stack screenOptions={{ headerShown: false }} /></AppShell>
      <TabBar perfil="encarregado" rotas={tabs} />
    </View>
  );
}
