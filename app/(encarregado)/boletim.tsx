import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarNotasAluno } from '../../services/notas';
import { buscarAluno } from '../../services/alunos';

interface LinhaNota {
  disciplina_nome?: string;
  professor_nome?: string;
  disciplina_id?: string;
  trimestre?: number;
  tipo?: string;
  valor?: number;
}

interface DisciplinaAgrupada {
  id: string;
  nome: string;
  professor: string;
  trimestres: Record<number, number[]>;
}

function corNota(nota: number) {
  if (nota >= 14) return '#16A34A';
  if (nota >= 10) return '#D97706';
  return '#DC2626';
}

function estado(media: number) {
  if (media >= 14) return { texto: 'Aprovado', cor: '#16A34A', icone: 'checkmark-circle' as const };
  if (media >= 10) return { texto: 'Em recurso', cor: '#D97706', icone: 'warning' as const };
  return { texto: 'Reprovado', cor: '#DC2626', icone: 'close-circle' as const };
}

function media(arr?: number[]) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default function Boletim() {
  const router = useRouter();
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nomeAluno, setNomeAluno] = useState('');
  const [turmaAluno, setTurmaAluno] = useState('');
  const [disciplinas, setDisciplinas] = useState<DisciplinaAgrupada[]>([]);
  const [trimestreActivo, setTrimestreActivo] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    (async () => {
      try {
        const alunoId = await AsyncStorage.getItem('kulonga_aluno_id');
        if (!alunoId) throw new Error('Aluno não identificado. Faz login com o token.');
        const aluno = await buscarAluno(alunoId).catch(() => null);
        if (aluno) {
          setNomeAluno(aluno.nome_completo ?? '');
          setTurmaAluno(aluno.turma ?? '');
        }
        const notas = (await buscarNotasAluno(alunoId)) as LinhaNota[] | null;
        if (notas && notas.length > 0) {
          const mapa: Record<string, DisciplinaAgrupada> = {};
          for (const n of notas) {
            const id = n.disciplina_id ?? n.disciplina_nome ?? 'x';
            if (!mapa[id]) {
              mapa[id] = {
                id,
                nome: n.disciplina_nome ?? 'Disciplina',
                professor: n.professor_nome ?? '',
                trimestres: { 1: [], 2: [], 3: [] },
              };
            }
            const t = n.trimestre ?? 1;
            if (typeof n.valor === 'number') mapa[id].trimestres[t].push(n.valor);
          }
          setDisciplinas(Object.values(mapa));
        }
      } catch (e: any) {
        setErro(e?.message ?? 'Erro ao carregar o boletim.');
      } finally {
        setCarregar(false);
      }
    })();
  }, []);

  const mediasAnuais = disciplinas.map((d) => {
    const todas = [...d.trimestres[1], ...d.trimestres[2], ...d.trimestres[3]];
    return media(todas);
  });
  const mediaGeral = mediasAnuais.length ? media(mediasAnuais) : 0;
  const estadoGeral = estado(mediaGeral);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Boletim Escolar</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Exportar', 'Funcionalidade de exportar PDF em breve')}
            accessibilityLabel="Exportar boletim"
          >
            <Ionicons name="download-outline" size={24} color="#1D5C8A" />
          </TouchableOpacity>
        </View>

        <View style={s.alunoCard}>
          <View style={s.alunoAvatar}>
            <Text style={s.alunoAvatarTexto}>
              {(nomeAluno || 'AL').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View style={s.alunoInfo}>
            <Text style={s.alunoNome}>{nomeAluno || 'Aluno'}</Text>
            <Text style={s.alunoTurma}>{turmaAluno ? `${turmaAluno} · ` : ''}2025/2026</Text>
            <Text style={s.alunoEscola}>Notas via Kulonga</Text>
          </View>
        </View>

        {carregar ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : erro ? (
          <Text style={s.erro}>{erro}</Text>
        ) : (
          <>
            <View style={s.resumoCard}>
              <View style={s.resumoLinha}>
                <Text style={s.resumoLabel}>Média Geral Anual</Text>
                <Text style={[s.resumoValor, { color: corNota(mediaGeral) }]}>
                  {mediaGeral.toFixed(1)}
                </Text>
              </View>
              <View style={s.resumoLinha}>
                <Text style={s.resumoLabel}>Estado</Text>
                <View style={s.estadoRow}>
                  <Ionicons name={estadoGeral.icone} size={18} color={estadoGeral.cor} />
                  <Text style={[s.estadoTexto, { color: estadoGeral.cor }]}>{estadoGeral.texto}</Text>
                </View>
              </View>
              <View style={s.resumoLinha}>
                <Text style={s.resumoLabel}>Disciplinas</Text>
                <Text style={s.resumoValorSub}>{disciplinas.length}</Text>
              </View>
            </View>

            <View style={s.trimestreTabs}>
              {[1, 2, 3].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.tab, trimestreActivo === t && s.tabActivo]}
                  onPress={() => setTrimestreActivo(t as 1 | 2 | 3)}
                >
                  <Text style={[s.tabTexto, trimestreActivo === t && s.tabTextoActivo]}>
                    {t}º Trimestre
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {disciplinas.length === 0 && (
              <Text style={s.vazio}>Ainda não há notas lançadas para este aluno.</Text>
            )}

            {disciplinas.map((disc, idx) => {
              const vals = disc.trimestres[trimestreActivo];
              const m = media(vals);
              const est = estado(m);
              return (
                <View key={idx} style={s.discCard}>
                  <View style={s.discHeader}>
                    <View style={s.discInfo}>
                      <Text style={s.discNome}>{disc.nome}</Text>
                      <Text style={s.discProf}>{disc.professor}</Text>
                    </View>
                    <View style={[s.discMediaBadge, { backgroundColor: corNota(m) + '20' }]}>
                      <Text style={[s.discMedia, { color: corNota(m) }]}>
                        {vals.length ? m.toFixed(1) : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.barraContainer}>
                    <View style={s.barraFundo}>
                      <View style={[s.barraProgresso, {
                        width: `${Math.min((m / 20) * 100, 100)}%`,
                        backgroundColor: corNota(m),
                      }]} />
                    </View>
                  </View>

                  <View style={s.estadoRow}>
                    <Ionicons name={est.icone} size={14} color={est.cor} />
                    <Text style={[s.estadoLabel, { color: est.cor }]}>
                      {vals.length ? est.texto : 'Sem notas'}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View style={s.resumoFinal}>
              <Text style={s.resumoFinalTitulo}>Média por Trimestre</Text>
              {[1, 2, 3].map((t) => {
                const mediaT = media(disciplinas.map((d) => media(d.trimestres[t])));
                return (
                  <View key={t} style={s.resumoLinha}>
                    <Text style={s.resumoLabel}>{t}º Trimestre</Text>
                    <Text style={[s.resumoValorSub, { color: corNota(mediaT) }]}>
                      {disciplinas.length ? mediaT.toFixed(1) : '—'}
                    </Text>
                  </View>
                );
              })}
              <View style={[s.resumoLinha, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, marginTop: 8 }]}>
                <Text style={[s.resumoLabel, { fontWeight: '700' }]}>Média Anual</Text>
                <Text style={[s.resumoValor, { color: corNota(mediaGeral) }]}>{mediaGeral.toFixed(1)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  alunoCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, gap: 14, alignItems: 'center',
  },
  alunoAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#C8511B',
    alignItems: 'center', justifyContent: 'center',
  },
  alunoAvatarTexto: { color: '#fff', fontSize: 20, fontWeight: '700' },
  alunoInfo: { flex: 1 },
  alunoNome: { fontSize: 17, fontWeight: '800', color: '#111827' },
  alunoTurma: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  alunoEscola: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  erro: { marginTop: 16, color: '#DC2626', fontSize: 14, textAlign: 'center' },
  vazio: { marginTop: 24, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  resumoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  resumoLabel: { fontSize: 14, color: '#6B7280' },
  resumoValor: { fontSize: 20, fontWeight: '800' },
  resumoValorSub: { fontSize: 16, fontWeight: '700' },
  estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estadoTexto: { fontSize: 14, fontWeight: '700' },
  trimestreTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  tabActivo: { backgroundColor: '#1D5C8A' },
  tabTexto: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextoActivo: { color: '#fff' },
  discCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  discHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  discInfo: { flex: 1 },
  discNome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  discProf: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  discMediaBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  discMedia: { fontSize: 18, fontWeight: '800' },
  barraContainer: { marginBottom: 8 },
  barraFundo: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barraProgresso: { height: 6, borderRadius: 3 },
  estadoLabel: { fontSize: 12, fontWeight: '600' },
  resumoFinal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  resumoFinalTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
});
