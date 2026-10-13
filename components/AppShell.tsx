import React, { PropsWithChildren, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { anoLectivoActual } from '../constants/anoLectivo';

type Perfil = 'secretaria' | 'professor' | 'aluno' | 'encarregado';
type Item = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const items: Record<Perfil, Item[]> = {
  secretaria: [
    { label: 'Início', icon: 'grid-outline', route: '/(secretaria)/painel' },
    { label: 'Alunos', icon: 'people-outline', route: '/(secretaria)/alunos' },
    { label: 'Professores', icon: 'person-outline', route: '/(secretaria)/painel' },
    { label: 'Turmas', icon: 'layers-outline', route: '/(secretaria)/painel' },
    { label: 'Disciplinas', icon: 'book-outline', route: '/(secretaria)/disciplinas' },
    { label: 'Tokens de acesso', icon: 'key-outline', route: '/(secretaria)/gerar-token' },
    { label: 'Avisos', icon: 'megaphone-outline', route: '/(secretaria)/avisos' },
    { label: 'Notificações', icon: 'notifications-outline', route: '/(secretaria)/notificacoes' },
    { label: 'Definições', icon: 'settings-outline', route: '/(secretaria)/editar-perfil' },
  ],
  professor: [
    { label: 'Início', icon: 'grid-outline', route: '/(professor)/painel' },
    { label: 'Turmas', icon: 'people-outline', route: '/(professor)/turmas' },
    { label: 'Lançar notas', icon: 'create-outline', route: '/(professor)/lancar-notas' },
    { label: 'Trabalhos e tarefas', icon: 'clipboard-outline', route: '/(professor)/trabalhos' },
    { label: 'Assiduidade', icon: 'checkmark-done-outline', route: '/(professor)/assiduidade' },
    { label: 'Avisos', icon: 'megaphone-outline', route: '/(professor)/avisos' },
    { label: 'Notificações', icon: 'notifications-outline', route: '/(professor)/notificacoes' },
    { label: 'Sincronização', icon: 'cloud-upload-outline', route: '/(professor)/sync' },
    { label: 'Definições', icon: 'settings-outline', route: '/(professor)/editar-perfil' },
  ],
  aluno: [
    { label: 'Início', icon: 'grid-outline', route: '/(aluno)/painel' },
    { label: 'Boletim', icon: 'document-text-outline', route: '/(aluno)/boletim' },
    { label: 'Trabalhos e tarefas', icon: 'clipboard-outline', route: '/(aluno)/trabalhos' },
    { label: 'Avisos', icon: 'megaphone-outline', route: '/(aluno)/avisos' },
    { label: 'Notificações', icon: 'notifications-outline', route: '/(aluno)/notificacoes' },
    { label: 'Perfil', icon: 'person-outline', route: '/(aluno)/perfil' },
  ],
  encarregado: [
    { label: 'Início', icon: 'grid-outline', route: '/(encarregado)/painel' },
    { label: 'Boletim', icon: 'document-text-outline', route: '/(encarregado)/boletim' },
    { label: 'Contactos', icon: 'call-outline', route: '/(encarregado)/contactos' },
    { label: 'Avisos', icon: 'megaphone-outline', route: '/(encarregado)/avisos' },
    { label: 'Notificações', icon: 'notifications-outline', route: '/(encarregado)/notificacoes' },
    { label: 'Perfil', icon: 'person-outline', route: '/(encarregado)/perfil' },
  ],
};

export default function AppShell({ perfil, children }: PropsWithChildren<{ perfil: Perfil }>) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const [recolhida, setRecolhida] = useState(false);
  const desktop = width >= 900;
  const largura = recolhida ? 76 : 248;
  const menu = useMemo(() => items[perfil], [perfil]);

  return <View style={styles.root}>
    {desktop ? <View style={[styles.sidebar, { width: largura }]}>
      <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>K</Text></View>{!recolhida && <View><Text style={styles.brandName}>KULONGA</Text><Text style={styles.brandCaption}>Gestão escolar</Text></View>}</View>
      {!recolhida && <View style={styles.schoolBox}><Ionicons name="business-outline" size={18} color="#F59E0B" /><View><Text style={styles.schoolName}>A minha escola</Text><Text style={styles.schoolYear}>Ano lectivo {anoLectivoActual()}</Text></View></View>}
      <View style={styles.menu}>{menu.map((item) => { const active = pathname === item.route || pathname.startsWith(item.route.replace('painel', '')); return <TouchableOpacity key={item.label} style={[styles.menuItem, active && styles.menuItemActive]} onPress={() => router.push(item.route as any)} accessibilityRole="button" accessibilityLabel={item.label}><Ionicons name={item.icon} size={20} color={active ? '#2457D6' : '#94A3B8'} />{!recolhida && <Text style={[styles.menuText, active && styles.menuTextActive]}>{item.label}</Text>}</TouchableOpacity>; })}</View>
      <TouchableOpacity style={styles.collapse} onPress={() => setRecolhida((value) => !value)} accessibilityLabel={recolhida ? 'Expandir menu' : 'Recolher menu'}><Ionicons name={recolhida ? 'chevron-forward' : 'chevron-back'} size={18} color="#64748B" />{!recolhida && <Text style={styles.collapseText}>Recolher menu</Text>}</TouchableOpacity>
    </View> : null}
    <View style={styles.content}>{children}</View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#F5F7FB' },
  sidebar: { backgroundColor: '#14213D', paddingHorizontal: 12, paddingTop: 24, paddingBottom: 18, borderRightWidth: 1, borderRightColor: '#203257' },
  brand: { flexDirection: 'row', alignItems: 'center', minHeight: 48, marginBottom: 26 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E66A24', alignItems: 'center', justifyContent: 'center', marginHorizontal: 7 },
  brandMarkText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  brandCaption: { color: '#9FB0CF', fontSize: 11, marginTop: 2 },
  schoolBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1B2D50', borderRadius: 12, padding: 12, marginBottom: 20 },
  schoolName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  schoolYear: { color: '#9FB0CF', fontSize: 10, marginTop: 3 },
  menu: { gap: 5 },
  menuItem: { minHeight: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  menuItemActive: { backgroundColor: '#EAF0FF' },
  menuText: { color: '#C2CEE3', fontSize: 13, fontWeight: '600' },
  menuTextActive: { color: '#2457D6', fontWeight: '800' },
  collapse: { marginTop: 'auto', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  collapseText: { color: '#9FB0CF', fontSize: 12 },
  content: { flex: 1, minWidth: 0 },
});
