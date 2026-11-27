import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AppShell, TabBar } from '../../components';

export default function AlunoLayout() {
  const tabs = [
    { nome: 'Início', icone: 'grid-outline', rota: '/(aluno)/painel' },
    { nome: 'Boletim', icone: 'document-text-outline', rota: '/(aluno)/boletim' },
    { nome: 'Tarefas', icone: 'clipboard-outline', rota: '/(aluno)/trabalhos' },
    { nome: 'Avisos', icone: 'megaphone-outline', rota: '/(aluno)/avisos' },
    { nome: 'Perfil', icone: 'person-outline', rota: '/(aluno)/perfil' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AppShell perfil="aluno"><Stack screenOptions={{ headerShown: false }} /></AppShell>
      <TabBar perfil="aluno" rotas={tabs} />
    </View>
  );
}
