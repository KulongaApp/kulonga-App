// Lançamento de notas — sistema angolano real
// MAC (Média de Avaliações Contínuas) + PT (Prova Trimestral)
// MF = (MAC + PT) ÷ 2
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { obterEscolaDoUsuario } from '../../services/professores';
import { listarTurmas } from '../../services/turmas';
import { listarDisciplinas } from '../../services/disciplinas';
import { listarAlunosTurma } from '../../services/turmas';
import { calcularMAC, calcularMF, AvaliacaoContinua } from '../../mocks/turma-notas';

const TRIMESTRES: Record<number, { nome: string; meses: string[] }> = {
  1: { nome: '1º Trimestre', meses: ['Setembro', 'Outubro', 'Novembro', 'Dezembro'] },
  2: { nome: '2º Trimestre', meses: ['Janeiro', 'Fevereiro', 'Março', 'Abril'] },
  3: { nome: '3º Trimestre', meses: ['Maio', 'Junho', 'Julho'] },
};

type Trimestre = 1 | 2 | 3;
type ModoLancamento = 'menu' | 'ac' | 'pt';

interface AlunoReal {
  id: string;
  nome: string;
  numero: number;
  genero: 'M' | 'F';
}

interface EstadoNotas {
  [alunoId: string]: {
    ac: { [mes: string]: string[] };
    pt: string;
  };
}

function corNota(v: number | null): string {
  if (v === null) return '#9CA3AF';
  if (v >= 14) return '#16A34A';
  if (v >= 10) return '#D97706';
  return '#DC2626';
}

export default function LancarNotas() {
  const router = useRouter();
  const [trimestre, setTrimestre] = useState<Trimestre>(1);
  const [modo, setModo] = useState<ModoLancamento>('menu');
  const [mesActivo, setMesActivo] = useState<string>('');
  const [notas, setNotas] = useState<EstadoNotas>({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [verRelatorio, setVerRelatorio] = useState(false);

  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [alunos, setAlunos] = useState<AlunoReal[]>([]);
  const [selector, setSelector] = useState<null | 'turma' | 'disciplina'>(null);

  async function carregarContexto() {
    setCarregar(true);
    setErro(null);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão não encontrada.');
      const [turmasData, discData] = await Promise.all([
        listarTurmas(escolaId).catch(() => []),
        listarDisciplinas(escolaId).catch(() => []),
      ]);
      setTurmas(turmasData as any[]);
      setDisciplinas(discData as any[]);
      setTurmaId((turmasData as any[])[0]?.id ?? '');
      setDisciplinaId((discData as any[])[0]?.id ?? '');
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar o contexto.');
    } finally {
      setCarregar(false);
    }
  }

  async function carregarAlunos() {
    if (!turmaId) {
      setAlunos([]);
      setNotas({});
      return;
    }
    try {
      const data = (await listarAlunosTurma(turmaId)) as any[];
      const lista: AlunoReal[] = data.map((row, i) => {
        const a = row.alunos ?? row;
        return {
          id: a.id,
          nome: a.nome_completo ?? a.nome ?? 'Aluno',
          numero: i + 1,
          genero: a.genero === 'F' ? 'F' : 'M',
        };
      });
      setAlunos(lista);
      const estado: EstadoNotas = {};
      lista.forEach((a) => {
        const acPorMes: { [mes: string]: string[] } = {};
        Object.values(TRIMESTRES).forEach((t) => t.meses.forEach((mes) => (acPorMes[mes] = [''])));
        estado[a.id] = { ac: acPorMes, pt: '' };
      });
      setNotas(estado);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar alunos.');
    }
  }

  useEffect(() => {
    carregarContexto();
  }, []);

  useEffect(() => {
    if (turmaId) carregarAlunos();
  }, [turmaId]);

  const mesesTrimestre = TRIMESTRES[trimestre].meses;

  function adicionarAC(alunoId: string) {
    setNotas((prev) => {
      const novo = { ...prev };
      const acs = [...(novo[alunoId].ac[mesActivo] || [''])];
      if (acs.length < 5) acs.push('');
      novo[alunoId] = { ...novo[alunoId], ac: { ...novo[alunoId].ac, [mesActivo]: acs } };
      return novo;
    });
  }

  function actualizarAC(alunoId: string, idx: number, valor: string) {
    const num = valor.replace(/[^0-9.]/g, '');
    if (num !== '' && parseFloat(num) > 20) return;
    setNotas((prev) => {
      const novo = { ...prev };
      const acs = [...novo[alunoId].ac[mesActivo]];
      acs[idx] = num;
      novo[alunoId] = { ...novo[alunoId], ac: { ...novo[alunoId].ac, [mesActivo]: acs } };
      return novo;
    });
  }

  function actualizarPT(alunoId: string, valor: string) {
    const num = valor.replace(/[^0-9.]/g, '');
    if (num !== '' && parseFloat(num) > 20) return;
    setNotas((prev) => ({ ...prev, [alunoId]: { ...prev[alunoId], pt: num } }));
  }

  function macAluno(alunoId: string): number | null {
    const todasAC: AvaliacaoContinua[] = [];
    mesesTrimestre.forEach((mes, mi) => {
      const acs = notas[alunoId]?.ac[mes] || [];
      acs.forEach((v, i) =>
        todasAC.push({ id: `${mi}-${i}`, mes, numero: i + 1, valor: v !== '' ? parseFloat(v) : null })
      );
    });
    return calcularMAC(todasAC);
  }

  function mfAluno(alunoId: string): number | null {
    const mac = macAluno(alunoId);
    const pt = notas[alunoId]?.pt;
    return calcularMF(mac, pt !== '' ? parseFloat(pt) : null);
  }

  const comMF = alunos.filter((a) => mfAluno(a.id) !== null).length;

  async function guardar() {
    if (!turmaId || !disciplinaId) {
      Alert.alert('Selecciona', 'Escolhe a turma e a disciplina antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão não encontrada.');
      const linhas: any[] = [];
      for (const a of alunos) {
        const mac = macAluno(a.id);
        const pt = notas[a.id]?.pt;
        const ptNum = pt !== '' ? parseFloat(pt) : null;
        if (mac !== null) linhas.push({ aluno_id: a.id, disciplina_id: disciplinaId, turma_id: turmaId, trimestre, tipo: 'frequencia', valor: mac, autor_id: user.id, autor_papel: 'professor' });
        if (ptNum !== null) linhas.push({ aluno_id: a.id, disciplina_id: disciplinaId, turma_id: turmaId, trimestre, tipo: 'prova', valor: ptNum, autor_id: user.id, autor_papel: 'professor' });
      }
      const { error } = await supabase.from('notas').insert(linhas);
      if (error) throw error;
      setGuardado(true);
      setTimeout(() => {
        setGuardado(false);
        Alert.alert('✅ Notas guardadas!', 'Enviadas para o servidor Kulonga.', [{ text: 'OK' }]);
      }, 800);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível guardar as notas.');
    } finally {
      setGuardando(false);
    }
  }

  const turmaNome = turmas.find((t) => t.id === turmaId)?.nome ?? '—';
  const disciplinaNome = disciplinas.find((d) => d.id === disciplinaId)?.nome ?? '—';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (modo !== 'menu') { setModo('menu'); return; }
            router.back();
          }}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitulo}>
            {modo === 'menu' ? 'Lançar Notas' : modo === 'pt' ? 'Prova Trimestral (PT)' : `Avaliações — ${mesActivo}`}
          </Text>
          <TouchableOpacity onPress={() => setSelector('turma')}>
            <Text style={s.headerSub}>{disciplinaNome} · {turmaNome} (trocar)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.relBtn} onPress={() => setVerRelatorio(true)} accessibilityLabel="Ver relatório">
          <Ionicons name="bar-chart-outline" size={20} color="#fff" />
          <Text style={s.relBtnTxt}>Relatório</Text>
        </TouchableOpacity>
      </View>

      <View style={s.trimBox}>
        {([1, 2, 3] as Trimestre[]).map((t) => (
          <TouchableOpacity key={t} style={[s.trimBtn, trimestre === t && s.trimBtnAct]} onPress={() => { setTrimestre(t); setModo('menu'); }} accessibilityLabel={`${t}º Trimestre`}>
            <Text style={[s.trimTxt, trimestre === t && s.trimTxtAct]}>{t}º Trim.</Text>
          </TouchableOpacity>
        ))}
      </View>

      {carregar ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C8511B" />
      ) : erro ? (
        <Text style={s.erro}>{erro}</Text>
      ) : (
        <>
          {modo === 'menu' && (
            <ScrollView contentContainerStyle={s.menu}>
              <View style={s.resumoRow}>
                <View style={[s.resumoCard, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[s.resumoNum, { color: '#1D5C8A' }]}>{alunos.length}</Text>
                  <Text style={s.resumoLabel}>Alunos</Text>
                </View>
                <View style={[s.resumoCard, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[s.resumoNum, { color: '#16A34A' }]}>{comMF}</Text>
                  <Text style={s.resumoLabel}>Com MF</Text>
                </View>
                <View style={[s.resumoCard, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[s.resumoNum, { color: '#DC2626' }]}>{alunos.length - comMF}</Text>
                  <Text style={s.resumoLabel}>Por lançar</Text>
                </View>
              </View>

              <View style={s.formulaCard}>
                <Text style={s.formulaTitulo}>Fórmula — {TRIMESTRES[trimestre].nome}</Text>
                <View style={s.formulaRow}>
                  <View style={s.formulaItem}><Text style={[s.formulaSigla, { color: '#1D5C8A' }]}>MAC</Text><Text style={s.formulaDesc}>Média das AC</Text></View>
                  <Text style={s.formulaOp}>+</Text>
                  <View style={s.formulaItem}><Text style={[s.formulaSigla, { color: '#C8511B' }]}>PT</Text><Text style={s.formulaDesc}>Prova Trimestral</Text></View>
                  <Text style={s.formulaOp}>÷ 2</Text>
                  <Text style={s.formulaOp}>=</Text>
                  <View style={s.formulaItem}><Text style={[s.formulaSigla, { color: '#16A34A' }]}>MF</Text><Text style={s.formulaDesc}>Média Final</Text></View>
                </View>
              </View>

              <Text style={s.secTitulo}>Avaliações Contínuas (AC)</Text>
              <Text style={s.secSub}>Toca num mês para lançar as avaliações</Text>
              {mesesTrimestre.map((mes) => {
                const comAC = alunos.filter((a) => (notas[a.id]?.ac[mes] || []).some((v) => v !== '')).length;
                return (
                  <TouchableOpacity key={mes} style={s.mesCard} onPress={() => { setMesActivo(mes); setModo('ac'); }} accessibilityLabel={`Lançar AC de ${mes}`}>
                    <View style={s.mesIcone}><Ionicons name="calendar-outline" size={22} color="#1D5C8A" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.mesNome}>{mes}</Text>
                      <Text style={s.mesInfo}>{comAC === 0 ? 'Nenhuma AC lançada' : `${comAC} de ${alunos.length} alunos com AC`}</Text>
                    </View>
                    <View style={[s.mesBadge, { backgroundColor: comAC === alunos.length ? '#DCFCE7' : '#FEF9C3' }]}>
                      <Text style={[s.mesBadgeTxt, { color: comAC === alunos.length ? '#16A34A' : '#D97706' }]}>{comAC}/{alunos.length}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                );
              })}

              <Text style={s.secTitulo}>Prova Trimestral (PT)</Text>
              <Text style={s.secSub}>Lançada no final do trimestre — vale 50% da MF</Text>
              <TouchableOpacity style={[s.mesCard, { borderLeftColor: '#C8511B' }]} onPress={() => setModo('pt')} accessibilityLabel="Lançar Prova Trimestral">
                <View style={[s.mesIcone, { backgroundColor: '#FDE9D6' }]}><Ionicons name="document-text-outline" size={22} color="#C8511B" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.mesNome, { color: '#C8511B' }]}>Prova Trimestral (PT)</Text>
                  <Text style={s.mesInfo}>{alunos.filter((a) => notas[a.id]?.pt !== '').length} de {alunos.length} alunos com PT</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity style={s.btnGuardar} onPress={guardar} accessibilityLabel="Guardar notas">
                {guardando ? <ActivityIndicator color="#fff" /> : guardado ? <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={s.btnTxt}> Guardado!</Text></> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={s.btnTxt}> Guardar Notas</Text></>}
              </TouchableOpacity>
            </ScrollView>
          )}

          {modo === 'ac' && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView contentContainerStyle={s.lista}>
                <View style={s.modoInfo}>
                  <Ionicons name="information-circle-outline" size={16} color="#1D5C8A" />
                  <Text style={s.modoInfoTxt}>Podes ter várias avaliações por mês. Toca em "+ AC" para adicionar.</Text>
                </View>
                {alunos.map((aluno) => {
                  const acs = notas[aluno.id]?.ac[mesActivo] || [''];
                  const mac = macAluno(aluno.id);
                  return (
                    <View key={aluno.id} style={s.alunoCard}>
                      <View style={s.alunoTopo}>
                        <Text style={s.alunoNum}>{aluno.numero}</Text>
                        <Text style={s.alunoNome} numberOfLines={1}>{aluno.nome}</Text>
                        <View style={[s.generoBadge, { backgroundColor: aluno.genero === 'F' ? '#FCE7F3' : '#DBEAFE' }]}>
                          <Text style={{ color: aluno.genero === 'F' ? '#BE185D' : '#1D5C8A', fontSize: 11, fontWeight: '700' }}>{aluno.genero}</Text>
                        </View>
                      </View>
                      <View style={s.acRow}>
                        {acs.map((val, i) => (
                          <View key={i} style={s.acItem}>
                            <Text style={s.acLabel}>AC {i + 1}</Text>
                            <TextInput
                              style={[s.acInput, { borderColor: val ? corNota(parseFloat(val)) : '#E5E7EB', color: val ? corNota(parseFloat(val)) : '#111827' }]}
                              value={val}
                              onChangeText={(v) => actualizarAC(aluno.id, i, v)}
                              keyboardType="numeric"
                              placeholder="—"
                              placeholderTextColor="#D1D5DB"
                              maxLength={4}
                              accessibilityLabel={`AC ${i + 1} de ${aluno.nome}`}
                            />
                          </View>
                        ))}
                        {acs.length < 5 && (
                          <TouchableOpacity style={s.addAC} onPress={() => adicionarAC(aluno.id)} accessibilityLabel="Adicionar avaliação">
                            <Ionicons name="add" size={18} color="#1D5C8A" />
                            <Text style={s.addACTxt}>AC</Text>
                          </TouchableOpacity>
                        )}
                        <View style={s.acItem}>
                          <Text style={[s.acLabel, { color: '#16A34A' }]}>MAC</Text>
                          <View style={[s.macBox, { backgroundColor: mac === null ? '#F3F4F6' : mac >= 14 ? '#DCFCE7' : mac >= 10 ? '#FEF9C3' : '#FEE2E2' }]}>
                            <Text style={[s.macNum, { color: corNota(mac) }]}>{mac !== null ? mac.toFixed(1) : '—'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <TouchableOpacity style={s.btnGuardar} onPress={guardar} accessibilityLabel="Guardar notas">
                  {guardando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={s.btnTxt}> Guardar AC</Text></>}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {modo === 'pt' && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView contentContainerStyle={s.lista}>
                <View style={[s.modoInfo, { borderLeftColor: '#C8511B', backgroundColor: '#FDE9D6' }]}>
                  <Ionicons name="document-text-outline" size={16} color="#C8511B" />
                  <Text style={[s.modoInfoTxt, { color: '#9A3412' }]}>Prova Trimestral do {TRIMESTRES[trimestre].nome}. MF = (MAC + PT) ÷ 2</Text>
                </View>
                {alunos.map((aluno) => {
                  const pt = notas[aluno.id]?.pt || '';
                  const mac = macAluno(aluno.id);
                  const mf = mfAluno(aluno.id);
                  const ptNum = pt !== '' ? parseFloat(pt) : null;
                  return (
                    <View key={aluno.id} style={s.alunoCard}>
                      <View style={s.alunoTopo}>
                        <Text style={s.alunoNum}>{aluno.numero}</Text>
                        <Text style={s.alunoNome} numberOfLines={1}>{aluno.nome}</Text>
                        <View style={[s.generoBadge, { backgroundColor: aluno.genero === 'F' ? '#FCE7F3' : '#DBEAFE' }]}>
                          <Text style={{ color: aluno.genero === 'F' ? '#BE185D' : '#1D5C8A', fontSize: 11, fontWeight: '700' }}>{aluno.genero}</Text>
                        </View>
                      </View>
                      <View style={s.ptRow}>
                        <View style={s.ptItem}>
                          <Text style={[s.acLabel, { color: '#1D5C8A' }]}>MAC</Text>
                          <View style={[s.macBox, { backgroundColor: '#DBEAFE' }]}>
                            <Text style={[s.macNum, { color: '#1D5C8A' }]}>{mac !== null ? mac.toFixed(1) : '—'}</Text>
                          </View>
                        </View>
                        <View style={s.ptItem}>
                          <Text style={[s.acLabel, { color: '#C8511B' }]}>PT</Text>
                          <TextInput
                            style={[s.acInput, { borderColor: pt ? corNota(parseFloat(pt)) : '#E5E7EB', color: pt ? corNota(parseFloat(pt)) : '#111827', borderWidth: 2 }]}
                            value={pt}
                            onChangeText={(v) => actualizarPT(aluno.id, v)}
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor="#D1D5DB"
                            maxLength={4}
                            accessibilityLabel={`PT de ${aluno.nome}`}
                          />
                        </View>
                        <View style={s.ptItem}>
                          <Text style={[s.acLabel, { color: '#16A34A' }]}>MF</Text>
                          <View style={[s.macBox, { backgroundColor: mf === null ? '#F3F4F6' : mf >= 14 ? '#DCFCE7' : mf >= 10 ? '#FEF9C3' : '#FEE2E2' }]}>
                            <Text style={[s.macNum, { color: corNota(mf), fontSize: 18 }]}>{mf !== null ? mf.toFixed(1) : '—'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <TouchableOpacity style={s.btnGuardar} onPress={guardar} accessibilityLabel="Guardar PT">
                  {guardando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={s.btnTxt}> Guardar PT</Text></>}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </>
      )}

      {/* Seletor de turma/disciplina */}
      <Modal visible={selector !== null} transparent animationType="fade">
        <View style={s.modalFundo}>
          <View style={s.modalConteudo}>
            <Text style={s.modalTitulo}>{selector === 'turma' ? 'Escolher Turma' : 'Escolher Disciplina'}</Text>
            {selector === 'turma' &&
              turmas.map((t) => (
                <TouchableOpacity key={t.id} style={s.modalItem} onPress={() => { setTurmaId(t.id); setSelector(null); }}>
                  <Text style={s.modalItemTxt}>{t.nome}</Text>
                </TouchableOpacity>
              ))}
            {selector === 'disciplina' &&
              disciplinas.map((d) => (
                <TouchableOpacity key={d.id} style={s.modalItem} onPress={() => { setDisciplinaId(d.id); setSelector(null); }}>
                  <Text style={s.modalItemTxt}>{d.nome}</Text>
                </TouchableOpacity>
              ))}
            <TouchableOpacity style={s.modalCancelar} onPress={() => setSelector(null)}>
              <Text style={s.modalCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#C8511B', padding: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitulo: { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerSub: { color: '#FECACA', fontSize: 12, marginTop: 2 },
  relBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, alignItems: 'center' },
  relBtnTxt: { color: '#fff', fontSize: 11, marginTop: 2 },
  trimBox: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, gap: 6 },
  trimBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, alignItems: 'center' },
  trimBtnAct: { backgroundColor: '#C8511B' },
  trimTxt: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  trimTxtAct: { color: '#fff', fontWeight: '700' },
  erro: { color: '#DC2626', fontSize: 14, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  menu: { padding: 16, paddingBottom: 40 },
  resumoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  resumoCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  resumoNum: { fontSize: 24, fontWeight: '800' },
  resumoLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  formulaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 1 },
  formulaTitulo: { fontSize: 13, fontWeight: '700', color: '#1D5C8A', marginBottom: 12 },
  formulaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  formulaItem: { alignItems: 'center' },
  formulaSigla: { fontSize: 20, fontWeight: '800' },
  formulaDesc: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  formulaOp: { fontSize: 20, fontWeight: '700', color: '#9CA3AF' },
  secTitulo: { fontSize: 14, fontWeight: '700', color: '#1D5C8A', marginBottom: 4, marginTop: 8 },
  secSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  mesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#1D5C8A', elevation: 1 },
  mesIcone: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mesNome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  mesInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mesBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  mesBadgeTxt: { fontSize: 12, fontWeight: '700' },
  btnGuardar: { backgroundColor: '#C8511B', borderRadius: 12, padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lista: { padding: 12, paddingBottom: 40 },
  modoInfo: { backgroundColor: '#DBEAFE', borderRadius: 8, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#1D5C8A' },
  modoInfoTxt: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  alunoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 },
  alunoTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  alunoNum: { width: 36, fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  alunoNome: { flex: 1, fontSize: 13, fontWeight: '700', color: '#111827' },
  generoBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  acItem: { alignItems: 'center', minWidth: 56 },
  acLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  acInput: { width: 56, height: 44, borderWidth: 1.5, borderRadius: 8, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  addAC: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 8, borderWidth: 1.5, borderColor: '#1D5C8A', borderStyle: 'dashed', marginTop: 18 },
  addACTxt: { fontSize: 9, color: '#1D5C8A', fontWeight: '700' },
  macBox: { width: 56, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  macNum: { fontSize: 15, fontWeight: '800' },
  ptRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  ptItem: { alignItems: 'center', flex: 1 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitulo: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemTxt: { fontSize: 15, color: '#111827' },
  modalCancelar: { marginTop: 12, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  modalCancelarTxt: { color: '#374151', fontWeight: '700' },
});
