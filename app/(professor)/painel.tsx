import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SyncStatusBar from '../../components/SyncStatusBar';
import { useConectividade } from '../../hooks/useConectividade';
import { supabase } from '../../services/supabase';
import { obterEscolaDoUsuario } from '../../services/professores';
import { buscarEscola } from '../../services/escolas';
import { listarTurmas } from '../../services/turmas';
import { logout } from '../../services/auth';

type Turma = {
  id: string;
  nome: string;
  disciplina: string;
  totalAlunos: number;
  notasLancadas: number;
  periodo: 'Manhã' | 'Tarde';
};

type ProfessorMock = {
  nome: string;
  email: string;
  escola: string;
  turmas: Turma[];
  notasPendentes: number;
  ultimaSync: string;
};

const professorMock: ProfessorMock = {
  nome: 'Prof. Carlos Manuel',
  email: 'prof@kulonga.ao',
  escola: 'Escola',
  turmas: [],
  notasPendentes: 0,
  ultimaSync: '',
};

const getTotalAlunos = (turmas: Turma[]) =>
  turmas.reduce((total, turma) => total + turma.totalAlunos, 0);

const getMetricColor = (pendentes: number) =>
  pendentes > 0 ? '#F59E0B' : '#16A34A';

const getProgressColor = (percent: number) => {
  if (percent === 100) return '#16A34A';
  if (percent === 0) return '#DC2626';
  return '#C8511B';
};

const getBadgeColor = (index: number) =>
  index === 0 ? '#1D5C8A' : index === 1 ? '#F59E0B' : '#16A34A';

// ── Card de cada turma ─────────────────────────────────────
function TurmaCard({
  turma,
  index,
  onPress,
}: {
  turma: Turma;
  index: number;
  onPress: () => void;
}) {
  const percent = Math.round(
    (turma.notasLancadas / turma.totalAlunos) * 100
  );
  const progressColor = getProgressColor(percent);

  return (
    <TouchableOpacity
      style={styles.turmaCard}
      onPress={onPress}
      accessibilityLabel={`Turma ${turma.nome} — toca para lançar notas`}
    >
      <View
        style={[
          styles.turmaCircle,
          { backgroundColor: getBadgeColor(index) },
        ]}
      >
        <Text style={styles.turmaCircleText}>
          {turma.nome.replace('ª', '')}
        </Text>
      </View>

      <View style={styles.turmaInfo}>
        <Text style={styles.turmaName}>{turma.nome}</Text>
        <Text style={styles.turmaSubject}>{turma.disciplina}</Text>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{turma.periodo}</Text>
        </View>
        <Text style={styles.tocaLancar}>Toca para lançar notas →</Text>
      </View>

      <View style={styles.progressArea}>
        <Text style={styles.progressLabel}>
          {turma.notasLancadas}/{turma.totalAlunos} notas
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent}%` as any,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        {percent === 0 && (
          <Text style={styles.emptyNotes}>Sem notas</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Card de métrica ────────────────────────────────────────
function MetricCard({
  icon,
  value,
  label,
  color,
  backgroundColor,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ── Painel principal ───────────────────────────────────────
export default function PainelProfessor() {
  const router = useRouter();
  const { isOnline } = useConectividade();
  const [carregar, setCarregar] = useState(true);
  const [prof, setProf] = useState<ProfessorMock>(professorMock);

  async function carregarDados() {
    setCarregar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const escolaId = await obterEscolaDoUsuario();
      const [profRow, escola, turmas] = await Promise.all([
        user
          ? supabase.from('professores').select('*').eq('user_id', user.id).single()
          : { data: null, error: null },
        escolaId ? buscarEscola(escolaId).catch(() => null) : Promise.resolve(null),
        escolaId ? listarTurmas(escolaId).catch(() => []) : Promise.resolve([]),
      ]);
      const turmasMapeadas: Turma[] = await Promise.all((turmas as any[]).map(async (t) => {
        let total = 0;
        try {
          const alunos = await supabase.from('turma_alunos').select('aluno_id', { count: 'exact' }).eq('turma_id', t.id);
          total = alunos.count ?? (alunos.data?.length ?? 0);
        } catch {}
        return { id: t.id, nome: t.nome, disciplina: (profRow?.data?.disciplinas ?? [])[0] ?? '', totalAlunos: total, notasLancadas: 0, periodo: (t.turno as any) ?? 'Manhã' };
      }));
      setProf({
        nome: profRow?.data?.nome ?? 'Professor',
        email: profRow?.data?.email ?? '',
        escola: escola?.nome ?? 'Escola',
        turmas: turmasMapeadas,
        notasPendentes: 0,
        ultimaSync: '',
      });
    } catch {
      // mantém defaults
    } finally {
      setCarregar(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // Verifica se o utilizador tem mais do que um papel
  async function verificarPerfilDuplo() {
    const papeis = await AsyncStorage.getItem('kulonga_papeis');
    const lista = papeis ? JSON.parse(papeis) : [];
    if (lista.length > 1) {
      router.push('/(auth)/selector-perfil' as any);
      return;
    }
    Alert.alert(
      'Perfil único',
      'Não existem outros perfis associados a esta conta.'
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/escolher-perfil' as any);
  }

  const totalAlunos = getTotalAlunos(prof.turmas);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(prof.nome.split(' ').slice(0, 2).map((p) => p[0]).join('') || 'PR').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{prof.nome}</Text>
              <Text style={styles.profileSchool}>{prof.escola}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={verificarPerfilDuplo}
              accessibilityLabel="Mudar perfil"
              style={styles.headerActionButton}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              accessibilityLabel="Sair da conta"
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {carregar ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color="#1D5C8A" />
        ) : (
          <>
            {/* ── Métricas ── */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon="people-outline"
                value={`${prof.turmas.length}`}
                label="Turmas"
                color="#1D5C8A"
                backgroundColor="#fff"
              />
              <MetricCard
                icon="person-outline"
                value={`${totalAlunos}`}
                label="Alunos"
                color="#1D5C8A"
                backgroundColor="#fff"
              />
              <MetricCard
                icon="cloud-upload-outline"
                value={`${prof.notasPendentes}`}
                label="Pendentes"
                color={getMetricColor(prof.notasPendentes)}
                backgroundColor="#FEF3C7"
              />
            </View>

            {/* ── Estado de sync ── */}
            <SyncStatusBar isOnline={isOnline} pendentes={prof.notasPendentes} />

            {/* ── Acções rápidas ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>O que queres fazer?</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#C8511B' }]}
                  onPress={() => router.push('/(professor)/lancar-notas' as any)}
                  accessibilityLabel="Lançar Notas"
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.actionText}>Lançar Notas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#1D5C8A' }]}
                  onPress={() => router.push('/(professor)/turmas' as any)}
                  accessibilityLabel="Ver Alunos"
                >
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <Text style={styles.actionText}>Ver Alunos</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Lista de turmas ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>As minhas turmas</Text>
              {prof.turmas.length === 0 && (
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  Nenhuma turma atribuída ainda.
                </Text>
              )}
              {prof.turmas.map((turma, index) => (
                <TurmaCard
                  key={turma.id}
                  turma={turma}
                  index={index}
                  onPress={() => router.push('/(professor)/lancar-notas' as any)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: '#F3F4F6' },
  scroll:              { paddingBottom: 100 },
  header:              { backgroundColor: '#1D5C8A', padding: 20,
                         flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center' },
  profileRow:          { flexDirection: 'row', alignItems: 'center' },
  profileAvatar:       { width: 52, height: 52, borderRadius: 26,
                         backgroundColor: '#fff', alignItems: 'center',
                         justifyContent: 'center', marginRight: 12 },
  profileAvatarText:   { color: '#1D5C8A', fontWeight: '800', fontSize: 16 },
  profileInfo:         { maxWidth: '72%' },
  profileName:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileSchool:       { color: '#D9E7FF', marginTop: 4, fontSize: 12 },
  headerActions:       { flexDirection: 'row', alignItems: 'center' },
  headerActionButton:  { marginRight: 14 },
  metricsRow:          { flexDirection: 'row', justifyContent: 'space-between',
                         padding: 16, paddingTop: 18,
                         backgroundColor: '#1D5C8A' },
  metricCard:          { flex: 1, borderRadius: 16, padding: 14,
                         marginHorizontal: 4, alignItems: 'center' },
  metricValue:         { fontSize: 20, fontWeight: '800', marginTop: 8,
                         color: '#111827' },
  metricLabel:         { color: '#6B7280', fontSize: 12, marginTop: 2 },
  section:             { padding: 16 },
  sectionTitle:        { fontSize: 16, fontWeight: '700', color: '#111827',
                         marginBottom: 14 },
  actionsRow:          { flexDirection: 'row', gap: 12 },
  actionButton:        { flex: 1, borderRadius: 16, paddingVertical: 18,
                         alignItems: 'center', justifyContent: 'center' },
  actionText:          { color: '#fff', fontWeight: '700', marginTop: 8 },
  turmaCard:           { flexDirection: 'row', alignItems: 'center',
                         backgroundColor: '#fff', borderRadius: 16,
                         padding: 16, marginBottom: 12, elevation: 2 },
  turmaCircle:         { width: 52, height: 52, borderRadius: 16,
                         alignItems: 'center', justifyContent: 'center',
                         marginRight: 14 },
  turmaCircleText:     { color: '#fff', fontWeight: '800' },
  turmaInfo:           { flex: 1 },
  turmaName:           { fontSize: 15, fontWeight: '700', color: '#111827' },
  turmaSubject:        { color: '#6B7280', marginTop: 4 },
  periodBadge:         { marginTop: 8, alignSelf: 'flex-start',
                         borderRadius: 999, paddingHorizontal: 10,
                         paddingVertical: 4, backgroundColor: '#E0F2FE' },
  periodText:          { color: '#0369A1', fontSize: 11, fontWeight: '700' },
  tocaLancar:          { color: '#C8511B', fontSize: 11, marginTop: 6,
                         fontWeight: '500' },
  progressArea:        { width: 100, marginLeft: 10 },
  progressLabel:       { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  progressTrack:       { width: '100%', height: 8, borderRadius: 999,
                         backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill:        { height: 8, borderRadius: 999 },
  emptyNotes:          { color: '#DC2626', fontSize: 11, marginTop: 6 },
  demoCard:            { margin: 16, padding: 16, borderRadius: 16,
                         backgroundColor: '#DBEAFE', flexDirection: 'row',
                         gap: 10 },
  demoText:            { color: '#1E40AF', flex: 1, lineHeight: 20 },
});