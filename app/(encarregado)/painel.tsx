import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlunoDados, type DisciplinaAluno } from '../../hooks/useAlunoDados';
import { corNota } from '../../services/avaliacao';
import { logout } from '../../services/auth';
import { CORES } from '../../constants/marca';
import { anoLectivoActual } from '../../constants/anoLectivo';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('');
}

export default function PainelEncarregado() {
  const [trimestre, setTrimestre] = useState<1 | 2 | 3>(1);
  const [alunoId, setAlunoId] = useState<string | null | undefined>(undefined);
  const router = useRouter();

  // O id do aluno é guardado localmente quando se activa o convite.
  useEffect(() => {
    let activo = true;
    AsyncStorage.getItem('kulonga_aluno_id')
      .then((v) => { if (activo) setAlunoId(v ?? null); })
      .catch(() => { if (activo) setAlunoId(null); });
    return () => { activo = false; };
  }, []);

  // useAlunoDados resolve o dossiê completo (turma, ano lectivo, disciplinas,
  // professores e médias finais por trimestre) — substitui o antigo alunoMock.
  const { aluno, loading, erro } = useAlunoDados(alunoId ?? null);

  const nomeAluno = aluno?.nomeCompleto ?? 'Aluno';
  const turmaAluno = aluno?.turma ?? '';
  const anoLetivo = aluno?.anoLetivo || anoLectivoActual();
  const disciplinas = aluno?.disciplinas ?? [];

  const notaDisciplina = (d: DisciplinaAluno) =>
    d.notas.find((n) => n.trimestre === trimestre)?.valor ?? null;

  const notas = disciplinas.map((d) => notaDisciplina(d)).filter((v): v is number => v !== null);
  const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  async function verificarPerfilDuplo() {
    const papeis = await AsyncStorage.getItem('kulonga_papeis');
    const lista = papeis ? JSON.parse(papeis) : [];
    if (lista.length > 1) {
      router.push('/(auth)/selector-perfil' as any);
      return;
    }
    Alert.alert('Perfil único', 'Não existem outros perfis associados a esta conta.');
  }

  async function sair() {
    await logout();
    router.replace('/(auth)/escolher-perfil' as any);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View style={s.headerTopo}>
            <Text style={s.saudacao}>Olá, Encarregado 👋</Text>
            <View style={s.headerActions}>
              <TouchableOpacity onPress={verificarPerfilDuplo} accessibilityLabel="Mudar perfil" style={s.actionButton}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={sair} accessibilityLabel="Sair da conta">
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.alunoCard}>
            <View style={[s.foto, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                {iniciais(nomeAluno || 'AL')}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.alunoNome}>{nomeAluno}</Text>
              <Text style={s.alunoCurso}>{turmaAluno ? `Turma ${turmaAluno}` : 'Kulonga'}</Text>
              <View style={s.pillRow}>
                <View style={[s.pill, { backgroundColor: CORES.azul + '22', borderColor: CORES.azul }]}>
                  <Text style={[s.pillTxt, { color: CORES.azul }]}>{turmaAluno || '—'}</Text>
                </View>
                <View style={[s.pill, { backgroundColor: CORES.laranja + '22', borderColor: CORES.laranja }]}>
                  <Text style={[s.pillTxt, { color: CORES.laranja }]}>{anoLetivo || '—'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.corpo}>
          {alunoId === undefined || loading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={CORES.azul} />
          ) : erro ? (
            <View style={s.erroBox}>
              <Text style={s.erroTxt}>{erro}</Text>
            </View>
          ) : (
            <>
              <Text style={s.secTitulo}>
                <Ionicons name="calendar-outline" size={15} color={CORES.azul} /> Notas por Trimestre
              </Text>
              <View style={s.trimestreRow}>
                {([1, 2, 3] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.trimBtn, trimestre === t && s.trimBtnAtivo]}
                    onPress={() => setTrimestre(t)}
                    accessibilityLabel={`${t}º Trimestre`}
                  >
                    <Text style={[s.trimTxt, trimestre === t && s.trimTxtAtivo]}>{t}º Trim.</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.secTitulo}>
                <Ionicons name="book-outline" size={15} color={CORES.azul} /> Disciplinas
              </Text>
              {disciplinas.length === 0 && (
                <Text style={{ color: CORES.textoFraco, fontSize: 14, marginTop: 4 }}>
                  Ainda não há notas lançadas.
                </Text>
              )}
              {disciplinas.map((disc) => {
                const nota = notaDisciplina(disc);
                const cor = corNota(nota);
                return (
                  <View
                    key={disc.id}
                    style={[s.card, { borderLeftWidth: 3, borderLeftColor: cor }]}
                  >
                    <View style={s.discHeader}>
                      <Text style={s.discNome}>{disc.nome}</Text>
                      <View style={[s.notaBadge, { borderColor: cor }]}>
                        <Text style={[s.notaValor, { color: cor }]}>
                          {nota !== null ? nota.toFixed(1) : '—'}
                        </Text>
                        <Text style={s.notaMax}>/20</Text>
                      </View>
                    </View>
                    {disc.professor?.nome && disc.professor.nome !== '—' ? (
                      <View style={s.profRow}>
                        <Ionicons name="person-outline" size={13} color={CORES.textoFraco} />
                        <Text style={s.profNomeDisc}>{disc.professor.nome}</Text>
                        {disc.professor.telefone ? (
                          <TouchableOpacity
                            style={s.ligaBtnPeq}
                            onPress={() => Linking.openURL(`tel:${disc.professor.telefone}`)}
                            accessibilityLabel={`Ligar para ${disc.professor.nome}`}
                          >
                            <Ionicons name="call-outline" size={13} color="#fff" />
                            <Text style={s.ligaTxt}>Ligar</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}
                    {nota === null && <Text style={s.semNota}>Nota não lançada ainda</Text>}
                  </View>
                );
              })}

              {media !== null && (
                <View style={[s.card, s.mediaCard]}>
                  <Text style={s.mediaLabel}>Média Geral — {trimestre}º Trimestre</Text>
                  <Text style={[s.mediaValor, { color: corNota(media) }]}>
                    {media.toFixed(1)}
                    <Text style={s.mediaMax}>/20</Text>
                  </Text>
                  <Text style={s.mediaSub}>
                    {notas.length} de {disciplinas.length} disciplinas com nota
                  </Text>
                  <View style={s.barraFundo}>
                    <View
                      style={[
                        s.barraValor,
                        { width: `${(media / 20) * 100}%` as any, backgroundColor: corNota(media) },
                      ]}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={s.btnContactos}
                onPress={() => router.push('/(encarregado)/contactos')}
                accessibilityLabel="Ver todos os professores"
              >
                <Ionicons name="people-outline" size={18} color="#fff" />
                <Text style={s.btnContactosTxt}>Ver todos os professores</Text>
              </TouchableOpacity>

              <Text style={s.rodape}>Dados sincronizados com o Kulonga</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CORES.fundo },
  scroll: { paddingBottom: 40 },
  header: { backgroundColor: CORES.azul, padding: 20, paddingBottom: 0 },
  headerTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  saudacao: { color: '#fff', fontSize: 15, fontWeight: '500' },
  alunoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: -1, elevation: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { marginRight: 12 },
  foto: { width: 64, height: 64, borderRadius: 32, backgroundColor: CORES.laranja },
  alunoNome: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  alunoCurso: { fontSize: 13, color: CORES.textoSuave, marginBottom: 6 },
  pillRow: { flexDirection: 'row' },
  pill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 },
  pillTxt: { fontSize: 11, fontWeight: '600' },
  corpo: { padding: 16 },
  secTitulo: { fontSize: 13, fontWeight: '700', color: CORES.azul, marginTop: 20, marginBottom: 10 },
  trimestreRow: { flexDirection: 'row', marginBottom: 4 },
  trimBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff', marginRight: 8 },
  trimBtnAtivo: { backgroundColor: CORES.laranja, borderColor: CORES.laranja },
  trimTxt: { fontSize: 13, color: CORES.textoSuave, fontWeight: '500' },
  trimTxtAtivo: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  discHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  discNome: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  notaBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'baseline' },
  notaValor: { fontSize: 16, fontWeight: '700' },
  notaMax: { fontSize: 11, color: CORES.textoFraco, marginLeft: 1 },
  profRow: { flexDirection: 'row', alignItems: 'center' },
  profNomeDisc: { fontSize: 12, color: CORES.textoSuave, flex: 1, marginLeft: 5 },
  ligaBtnPeq: { flexDirection: 'row', alignItems: 'center', backgroundColor: CORES.azul, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  ligaTxt: { color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  semNota: { fontSize: 11, color: CORES.textoFraco, marginTop: 4, fontStyle: 'italic' },
  mediaCard: { alignItems: 'center', marginTop: 8 },
  mediaLabel: { fontSize: 13, color: CORES.textoSuave, marginBottom: 4 },
  mediaValor: { fontSize: 42, fontWeight: '800', marginVertical: 4 },
  mediaMax: { fontSize: 20, fontWeight: '400', color: CORES.textoFraco },
  mediaSub: { fontSize: 12, color: CORES.textoSuave, marginBottom: 12 },
  barraFundo: { width: '100%', height: 8, backgroundColor: CORES.borda, borderRadius: 4, overflow: 'hidden' },
  barraValor: { height: 8, borderRadius: 4 },
  btnContactos: { backgroundColor: CORES.azul, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnContactosTxt: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  rodape: { textAlign: 'center', fontSize: 11, color: CORES.textoFraco, marginTop: 20 },
  erroBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#FECACA' },
  erroTxt: { color: '#B91C1C', fontSize: 14, textAlign: 'center' },
});