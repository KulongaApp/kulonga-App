import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../../components';

export default function AlunoLayout() {
  return (
    <AppShell perfil="aluno"><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2457D6' }}>
      <Tabs.Screen name="painel" options={{ title: 'Notas', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="boletim" options={{ title: 'Boletim', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs></AppShell>
  );
}
