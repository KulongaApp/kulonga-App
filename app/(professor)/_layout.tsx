import { Stack } from 'expo-router';
import { AppShell } from '../../components';
export default function ProfessorLayout() {
  return <AppShell perfil="professor"><Stack screenOptions={{ headerShown: false }} /></AppShell>;
}
