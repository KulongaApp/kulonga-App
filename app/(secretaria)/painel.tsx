import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const ecrãLargo = width >= 720;
  const [aba, setAba] = useState<Aba>('inicio');
  const [query, setQuery] = useState('');
  const [filtroTurma, setFiltroTurma] = useState<string>('Todos');
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nomeEscola, setNomeEscola] = useState('');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [anoLectivo, setAnoLectivo] = useState('');
  const [modalTurma, setModalTurma] = useState(false);
  const [novaTurma, setNovaTurma] = useState({ nome: '', turno: 'Manhã' });
  const [aCriarTurma, setACriarTurma] = useState(false);

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
      const agora = new Date();
      const inicio = agora.getMonth() >= 7 ? agora.getFullYear() : agora.getFullYear() - 1;
      setAnoLectivo(escola?.ano_lectivo ?? `${inicio}/${inicio + 1}`);
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
  const alunosSemTurma = alunos.filter((aluno) => !aluno.turma).length;

  async function criarNovaTurma() {
    const nome = novaTurma.nome.trim();
    if (nome.length < 2) {
      Alert.alert('Dados incompletos', 'Indica o nome da turma.');
      return;
    }
    setACriarTurma(true);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      const { criarTurma } = await import('../../services/turmas');
      await criarTurma({ escolaId, nome, anoLectivo, turno: novaTurma.turno });
      setNovaTurma({ nome: '', turno: 'Manhã' });
      setModalTurma(false);
      await carregarTudo();
      Alert.alert('Turma criada', `A turma ${nome} foi criada com sucesso.`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível criar a turma.');
    } finally {
      setACriarTurma(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.escolaNome}> {nomeEscola}</Text>
            <Text style={styles.escolaSub}>{anoLectivo ? `Ano lectivo ${anoLectivo}` : 'Ano lectivo não definido'}</Text>
          </View>
          <TouchableOpacity onPress={sair} accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
        <View style={styles.tabsRow}>
          {([
            { key: 'inicio', label: ' Início' },
            { key: 'turmas', label: ' Turmas' },
            { key: 'professores', label: ' Professores' },
            { key: 'alunos', label: ' Alunos' },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.abaBtn, !ecrãLargo && styles.abaBtnMobile, aba === t.key ? styles.abaAtiva : undefined]}
                onPress={() => {
                if (t.key === 'professores') {
                  router.push('/(secretaria)/professores' as any);
                  return;
                }
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
        </ScrollView>

        {carregar ? (
          <View style={styles.estado}><ActivityIndicator color="#123C69" /><Text style={styles.estadoTexto}>A carregar os dados da escola…</Text></View>
        ) : erro ? (
          <View style={styles.estado}><Ionicons name="alert-circle-outline" size={28} color="#B91C1C" /><Text style={styles.erro}>{erro}</Text><TouchableOpacity style={styles.tentarBtn} onPress={carregarTudo}><Text style={styles.tentarTxt}>Tentar novamente</Text></TouchableOpacity></View>
        ) : (
          <>
            {aba === 'inicio' && (
              <View>
                <View style={[styles.metricasGrid, ecrãLargo && styles.metricasGridLargo]}>
                  <View style={[styles.metricaCard, ecrãLargo && styles.metricaCardLargo, styles.metricaAzul]}>
                    <Text style={styles.metricaNumero}>{alunos.length}</Text>
                    <Text style={styles.metricaLabel}>Alunos matriculados</Text>
                  </View>
                  <View style={[styles.metricaCard, ecrãLargo && styles.metricaCardLargo, styles.metricaLaranja]}>
                    <Text style={styles.metricaNumero}>{professores.length}</Text>
                    <Text style={styles.metricaLabel}>Professores activos</Text>
                  </View>
                  <View style={[styles.metricaCard, ecrãLargo && styles.metricaCardLargo, styles.metricaVerde]}>
                    <Text style={styles.metricaNumero}>{turmas.length}</Text>
                    <Text style={styles.metricaLabel}>Turmas activas</Text>
                  </View>
                  <View style={[styles.metricaCard, ecrãLargo && styles.metricaCardLargo, styles.metricaAmbar]}>
                    <Text style={styles.metricaNumero}>{alunosSemTurma}</Text>
                    <Text style={styles.metricaLabel}>Alunos sem turma</Text>
                  </View>
                </View>

                <Text style={styles.seccaoTitulo}>Acções rápidas</Text>
                <View style={[styles.acoesRow, !ecrãLargo && styles.acoesColumn]}>
                  <TouchableOpacity
                    style={[styles.acoesBtn, !ecrãLargo && styles.acoesBtnMobile, styles.acoesBtnLaranja]}
                    onPress={() => router.push('/(secretaria)/gerar-token' as any)}
                  >
                    <Ionicons name="key-outline" size={18} color="#fff" />
                    <Text style={styles.acoesTxt}>Gerar Token</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acoesBtn, !ecrãLargo && styles.acoesBtnMobile, styles.acoesBtnAzul]}
                    onPress={() => router.push('/(secretaria)/adicionar-professor' as any)}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.acoesTxt}>Adicionar Professor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acoesBtn, !ecrãLargo && styles.acoesBtnMobile, styles.acoesBtnVerde]}
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
                  <Ionicons name="search-outline" size={18} color="#55667A" />
                  <TextInput
                    placeholder="Pesquisar turma..."
                    style={styles.pesquisa}
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Pesquisar turma"
                  />
                </View>
                <TouchableOpacity style={[styles.acoesBtn, styles.acoesBtnVerde, { marginBottom: 12 }]} onPress={() => router.push('/(secretaria)/gestao-turmas' as any)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.acoesTxt}>Criar Turma</Text>
                </TouchableOpacity>
                {turmasFiltradas.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.itemCard}
                    onPress={() => router.push(`/(secretaria)/turma-${t.id}` as any)}
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
                {turmasFiltradas.length === 0 && <Text style={styles.vazio}>Nenhuma turma. Cria a primeira.</Text>}
              </View>
            )}

            {aba === 'professores' && (
              <View>
                <View style={styles.pesquisaContainer}>
                  <Ionicons name="search-outline" size={18} color="#55667A" />
                  <TextInput
                    placeholder="Pesquisar professor..."
                    style={styles.pesquisa}
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Pesquisar professor"
                  />
                </View>
                <TouchableOpacity style={[styles.acoesBtn, styles.acoesBtnAzul, { marginBottom: 12 }]} onPress={() => router.push('/(secretaria)/adicionar-professor' as any)}>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.acoesTxt}>Adicionar professor</Text>
                </TouchableOpacity>
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
                      <Text style={[styles.itemStatus, p.activo === false ? styles.statusDesactivado : p.user_id ? styles.statusActivo : styles.statusPendente]}>{p.activo === false ? 'Desactivado' : p.user_id ? 'Conta activa' : 'Convite pendente'}</Text>
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
                  <Ionicons name="search-outline" size={18} color="#55667A" />
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
      <Modal visible={modalTurma} transparent animationType="slide" onRequestClose={() => setModalTurma(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Criar turma</Text>
            <Text style={styles.modalHint}>Ano lectivo: {anoLectivo || 'não definido'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome da turma (ex.: 10.ª A)"
              value={novaTurma.nome}
              onChangeText={(nome) => setNovaTurma((atual) => ({ ...atual, nome }))}
              autoCapitalize="words"
              accessibilityLabel="Nome da turma"
            />
            <Text style={styles.modalLabel}>Turno</Text>
            <View style={styles.turnoRow}>
              {['Manhã', 'Tarde', 'Noite'].map((turno) => (
                <TouchableOpacity key={turno} style={[styles.turnoBtn, novaTurma.turno === turno && styles.turnoActivo]} onPress={() => setNovaTurma((atual) => ({ ...atual, turno }))}>
                  <Text style={[styles.turnoTxt, novaTurma.turno === turno && styles.turnoTxtActivo]}>{turno}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalTurma(false)} disabled={aCriarTurma}><Text style={styles.cancelTxt}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.acoesBtn, styles.acoesBtnVerde]} onPress={criarNovaTurma} disabled={aCriarTurma}>
                {aCriarTurma ? <ActivityIndicator color="#fff" /> : <Text style={styles.acoesTxt}>Criar turma</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { backgroundColor: '#123C69', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  escolaNome: { color: '#fff', fontSize: 18, fontWeight: '800' },
  escolaSub: { color: '#BFDBFE', marginTop: 4 },
  erro: { color: '#B91C1C', fontSize: 14, marginTop: 8, textAlign: 'center' },
  estado: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  estadoTexto: { color: '#55667A', fontSize: 14, marginTop: 12, textAlign: 'center' },
  tentarBtn: { marginTop: 16, borderRadius: 10, backgroundColor: '#E4EEF8', paddingHorizontal: 16, paddingVertical: 11 },
  tentarTxt: { color: '#123C69', fontWeight: '700' },
  vazio: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 12 },
  tabsScrollContent: { minWidth: '100%' },
  tabsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 16, gap: 4, padding: 4, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  abaBtn: { flex: 1, minHeight: 42, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  abaBtnMobile: { flex: 0, minWidth: 92 },
  abaAtiva: { backgroundColor: '#E4EEF8' },
  abaTxt: { color: '#55667A', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  abaTxtAtiva: { color: '#123C69' },
  metricasGrid: { gap: 12 },
  metricasGridLargo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricaCard: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3DACB', borderLeftWidth: 4, borderLeftColor: '#123C69', shadowColor: '#0B2A4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 1 },
  metricaCardLargo: { width: '48.8%' },
  metricaNumero: { color: '#0B2A4A', fontSize: 27, fontWeight: '900' },
  metricaLabel: { color: '#55667A', marginTop: 5, fontSize: 12, fontWeight: '700' },
  metricaAzul: { borderLeftColor: '#123C69' },
  metricaLaranja: { borderLeftColor: '#123C69' },
  metricaVerde: { borderLeftColor: '#123C69' },
  metricaAmbar: { borderLeftColor: '#123C69' },
  seccaoTitulo: { marginTop: 12, fontSize: 15, fontWeight: '700', color: '#0B1F33' },
  acoesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  acoesColumn: { flexDirection: 'column' },
  acoesBtn: { flex: 1, borderRadius: 14, minHeight: 58, padding: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 0 },
  acoesBtnMobile: { flex: 0, width: '100%', marginBottom: 8 },
  acoesBtnLaranja: { backgroundColor: '#8F5F00' },
  acoesBtnAzul: { backgroundColor: '#123C69' },
  acoesBtnVerde: { backgroundColor: '#0B2A4A' },
  acoesTxt: { color: '#fff', fontWeight: '700', marginTop: 6, fontSize: 12 },
  pesquisaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  pesquisa: { marginLeft: 8, flex: 1 },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  avatarSmall: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  avatarSmallTxt: { color: '#123C69', fontWeight: '700' },
  avatarProf: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  avatarAluno: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEEBC8', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemSub: { color: '#55667A', fontSize: 12, marginTop: 4 },
  itemStatus: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  statusActivo: { color: '#1A7358' },
  statusPendente: { color: '#8F5F00' },
  statusDesactivado: { color: '#B91C1C' },
  callBtn: { backgroundColor: '#123C69', padding: 10, borderRadius: 8 },
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: '#8F5F00', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  pillsRow: { paddingVertical: 8 },
  pill: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#E3DACB' },
  pillAtiva: { backgroundColor: '#8F5F00' },
  pillTxt: { color: '#55667A' },
  pillTxtAtiva: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: '#0F172A88', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 },
  modalTitle: { color: '#0B2A4A', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  modalHint: { color: '#55667A', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#CFC4B0', borderRadius: 10, minHeight: 48, paddingHorizontal: 12, marginBottom: 14 },
  modalLabel: { color: '#334155', fontWeight: '800', marginBottom: 8 },
  turnoRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  turnoBtn: { flex: 1, borderWidth: 1, borderColor: '#CFC4B0', borderRadius: 10, padding: 12, alignItems: 'center' },
  turnoActivo: { backgroundColor: '#E4EEF8', borderColor: '#123C69' },
  turnoTxt: { color: '#55667A', fontWeight: '700' },
  turnoTxtActivo: { color: '#123C69' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  cancelTxt: { color: '#55667A', fontWeight: '700' },
});
