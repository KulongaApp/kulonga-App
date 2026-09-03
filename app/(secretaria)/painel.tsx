import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obterEscolaDoUsuario, listarProfessores } from '../../services/professores';
import { buscarEscola } from '../../services/escolas';
import { listarAlunos } from '../../services/alunos';
import { listarTurmas } from '../../services/turmas';
import { logout } from '../../services/auth';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

type Aba = 'inicio' | 'turmas' | 'professores' | 'alunos';

export default function SecretariaPainel() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('inicio');
  const [query, setQuery] = useState('');
  const [filtroTurma, setFiltroTurma] = useState<string>('Todos');
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nomeEscola, setNomeEscola] = useState('');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  async function carregarTudo() {
    setCarregar(true);
    setErro(null);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      const [escola, alunosData, profsData, turmasData] = await Promise.all([
        buscarEscola(escolaId).catch(() => null),
        listarAlunos(escolaId),
        listarProfessores(escolaId),
        listarTurmas(escolaId),
      ]);
      setNomeEscola(escola?.nome ?? 'Escola');
      setAlunos(alunosData as any[]);
      setProfessores(profsData as any[]);
      setTurmas(turmasData as any[]);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar o painel.');
    } finally {
      setCarregar(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function sair() {
    await logout();
    router.replace('/(auth)/escolher-perfil' as any);
  }

  const turmasFiltradas = useMemo(
    () => turmas.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase())),
    [turmas, query]
  );
  const profsFiltrados = useMemo(
    () => professores.filter((p) => (p.nome ?? '').toLowerCase().includes(query.toLowerCase())),
    [professores, query]
  );
  const alunosFiltrados = useMemo(
    () =>
      alunos.filter((a) => {
        const nome = (a.nome_completo ?? '').toLowerCase();
        const turma = (a.turma ?? '').toLowerCase();
        const matchQuery = nome.includes(query.toLowerCase()) || turma.includes(query.toLowerCase());
        const matchTurma = filtroTurma === 'Todos' ? true : a.turma === filtroTurma;
        return matchQuery && matchTurma;
      }),
    [alunos, query, filtroTurma]
  );

  const turmasUnicas = useMemo(
    () => Array.from(new Set(alunos.map((a) => a.turma).filter(Boolean))),
    [alunos]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.escolaNome}>🏫 {nomeEscola}</Text>
            <Text style={styles.escolaSub}>Ano letivo 2025/2026</Text>
          </View>
          <TouchableOpacity onPress={sair} accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {([
            { key: 'inicio', label: '🏠 Início' },
            { key: 'turmas', label: '🎓 Turmas' },
            { key: 'professores', label: '👨‍🏫 Professores' },
            { key: 'alunos', label: '👨‍🎓 Alunos' },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.abaBtn, aba === t.key ? styles.abaAtiva : undefined]}
              onPress={() => {
                setAba(t.key as Aba);
                setQuery('');
              }}
            >
              <Text style={[styles.abaTxt, aba === t.key ? styles.abaTxtAtiva : undefined]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {carregar ? (
          <Text style={styles.erro}>A carregar...</Text>
        ) : erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : (
          <>
            {aba === 'inicio' && (
              <View>
                <View style={styles.metricasGrid}>
                  <View style={[styles.metricaCard, styles.metricaAzul]}>
                    <Text style={styles.metricaNumero}>{alunos.length}</Text>
                    <Text style={styles.metricaLabel}>Alunos matriculados</Text>
                  </View>
                  <View style={[styles.metricaCard, styles.metricaLaranja]}>
                    <Text style={styles.metricaNumero}>{professores.length}</Text>
                    <Text style={styles.metricaLabel}>Professores activos</Text>
                  </View>
                  <View style={[styles.metricaCard, styles.metricaVerde]}>
                    <Text style={styles.metricaNumero}>{turmas.length}</Text>
                    <Text style={styles.metricaLabel}>Turmas activas</Text>
                  </View>
                  <View style={[styles.metricaCard, styles.metricaAmbar]}>
                    <Text style={styles.metricaNumero}>{alunos.length}</Text>
                    <Text style={styles.metricaLabel}>Alunos registados</Text>
                  </View>
                </View>

                <Text style={styles.seccaoTitulo}>Acções rápidas</Text>
                <View style={styles.acoesRow}>
                  <TouchableOpacity
                    style={[styles.acoesBtn, styles.acoesBtnLaranja]}
                    onPress={() => router.push('/(secretaria)/gerar-token' as any)}
                  >
                    <Ionicons name="key-outline" size={18} color="#fff" />
                    <Text style={styles.acoesTxt}>Gerar Token</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acoesBtn, styles.acoesBtnAzul]}
                    onPress={() => router.push('/(secretaria)/adicionar-professor' as any)}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.acoesTxt}>Adicionar Professor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acoesBtn, styles.acoesBtnVerde]}
                    onPress={() => router.push('/(secretaria)/disciplinas' as any)}
                  >
                    <Ionicons name="book-outline" size={18} color="#fff" />
                    <Text style={styles.acoesTxt}>Disciplinas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {aba === 'turmas' && (
              <View>
                <View style={styles.pesquisaContainer}>
                  <Ionicons name="search-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Pesquisar turma..."
                    style={styles.pesquisa}
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Pesquisar turma"
                  />
                </View>
                {turmasFiltradas.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.itemCard}
                    onPress={() => Alert.alert('Turma', `${t.nome}\nAno: ${t.ano_lectivo ?? '—'}\nTurno: ${t.turno ?? '—'}`)}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallTxt}>{t.nome}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemTitle}>{t.nome}</Text>
                      <Text style={styles.itemSub}>{t.turno ? `${t.turno} · ` : ''}Ano {t.ano_lectivo ?? '—'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {turmasFiltradas.length === 0 && <Text style={styles.vazio}>Nenhuma turma.</Text>}
              </View>
            )}

            {aba === 'professores' && (
              <View>
                <View style={styles.pesquisaContainer}>
                  <Ionicons name="search-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Pesquisar professor..."
                    style={styles.pesquisa}
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Pesquisar professor"
                  />
                </View>
                {profsFiltrados.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.itemCard}
                    onPress={() => Alert.alert('Professor', `${p.nome}\n${(p.disciplinas ?? []).join(', ')}`)}
                  >
                    <View style={styles.avatarProf}>
                      <Text style={styles.avatarSmallTxt}>{iniciais(p.nome)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemTitle}>{p.nome}</Text>
                      <Text style={styles.itemSub}>{(p.disciplinas ?? []).join(', ') || p.email}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Ligar', `Ligar para ${p.telefone ?? 'sem telefone'}`)}
                      style={styles.callBtn}
                    >
                      <Ionicons name="call" size={16} color="#fff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                {profsFiltrados.length === 0 && <Text style={styles.vazio}>Nenhum professor.</Text>}

                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => router.push('/(secretaria)/adicionar-professor' as any)}
                  accessibilityLabel="Adicionar Professor"
                >
                  <Ionicons name="person-add-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {aba === 'alunos' && (
              <View>
                <View style={styles.pesquisaContainer}>
                  <Ionicons name="search-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Pesquisar aluno ou turma..."
                    style={styles.pesquisa}
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Pesquisar aluno"
                  />
                </View>
                <ScrollView horizontal contentContainerStyle={styles.pillsRow} showsHorizontalScrollIndicator={false}>
                  {['Todos', ...turmasUnicas].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pill, filtroTurma === t ? styles.pillAtiva : undefined]}
                      onPress={() => setFiltroTurma(t)}
                    >
                      <Text style={[styles.pillTxt, filtroTurma === t ? styles.pillTxtAtiva : undefined]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {alunosFiltrados.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.itemCard}
                    onPress={() => Alert.alert('Aluno', `${a.nome_completo}\nTurma: ${a.turma ?? '—'}`)}
                  >
                    <View style={styles.avatarAluno}>
                      <Text style={styles.avatarSmallTxt}>{iniciais(a.nome_completo)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemTitle}>{a.nome_completo}</Text>
                      <Text style={styles.itemSub}>{a.turma ?? 'Sem turma'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {alunosFiltrados.length === 0 && <Text style={styles.vazio}>Nenhum aluno.</Text>}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { backgroundColor: '#1D5C8A', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  escolaNome: { color: '#fff', fontSize: 18, fontWeight: '800' },
  escolaSub: { color: '#BFDBFE', marginTop: 4 },
  erro: { color: '#DC2626', fontSize: 14, marginTop: 12, textAlign: 'center' },
  vazio: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 12 },
  tabsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 12, gap: 8 },
  abaBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, backgroundColor: 'transparent' },
  abaAtiva: { backgroundColor: '#fff' },
  abaTxt: { color: '#fff', fontWeight: '700' },
  abaTxtAtiva: { color: '#1D5C8A' },
  metricasGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  metricaCard: { width: '48%', borderRadius: 12, padding: 14, marginBottom: 12 },
  metricaNumero: { color: '#fff', fontSize: 24, fontWeight: '800' },
  metricaLabel: { color: '#E5E7EB', marginTop: 6, fontSize: 12 },
  metricaAzul: { backgroundColor: '#1E40AF' },
  metricaLaranja: { backgroundColor: '#C2410C' },
  metricaVerde: { backgroundColor: '#166534' },
  metricaAmbar: { backgroundColor: '#A16207' },
  seccaoTitulo: { marginTop: 12, fontSize: 15, fontWeight: '700', color: '#111827' },
  acoesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  acoesBtn: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  acoesBtnLaranja: { backgroundColor: '#C8511B' },
  acoesBtnAzul: { backgroundColor: '#1D5C8A' },
  acoesBtnVerde: { backgroundColor: '#16A34A' },
  acoesTxt: { color: '#fff', fontWeight: '700', marginTop: 6, fontSize: 12 },
  pesquisaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  pesquisa: { marginLeft: 8, flex: 1 },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  avatarSmall: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  avatarSmallTxt: { color: '#1D4ED8', fontWeight: '700' },
  avatarProf: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  avatarAluno: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEEBC8', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemSub: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  callBtn: { backgroundColor: '#1D5C8A', padding: 10, borderRadius: 8 },
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: '#C8511B', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  pillsRow: { paddingVertical: 8 },
  pill: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  pillAtiva: { backgroundColor: '#C8511B' },
  pillTxt: { color: '#6B7280' },
  pillTxtAtiva: { color: '#fff', fontWeight: '700' },
});
