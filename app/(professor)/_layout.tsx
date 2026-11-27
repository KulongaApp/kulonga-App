import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppShell, TabBar } from '../../components';
export default function ProfessorLayout() {
  const tabs = [
    { nome: 'Início', icone: 'grid-outline', rota: '/(professor)/painel' },
    { nome: 'Turmas', icone: 'people-outline', rota: '/(professor)/turmas' },
    { nome: 'Notas', icone: 'create-outline', rota: '/(professor)/lancar-notas' },
    { nome: 'Tarefas', icone: 'clipboard-outline', rota: '/(professor)/trabalhos' },
    { nome: 'Perfil', icone: 'person-outline', rota: '/(professor)/editar-perfil' },
  ];
  return <View style={{ flex: 1 }}><AppShell perfil="professor"><Stack screenOptions={{ headerShown: false }} /></AppShell><TabBar perfil="professor" rotas={tabs} /></View>;
}
