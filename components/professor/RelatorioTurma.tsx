// Relatório completo da turma por trimestre
// O professor precisa disto no final de cada trimestre —
// é o documento que entrega à direcção
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  turmaMock, calcularMedia, classificacao, AlunoNota,
} from '../../mocks/turma-notas';

interface Props {
  trimestre: 1 | 2 | 3;
  notas: any;
  onFechar: () => void;
}

export default function RelatorioTurma({ trimestre, notas, onFechar }: Props) {

  // Calcula média de cada aluno com os dados actuais
  const alunosComMedia = turmaMock.alunos.map(a => {
    const n = notas[a.id] || { frequencia: '', prova: '', exame: '' };
    const f = parseFloat(n.frequencia);
    const p = parseFloat(n.prova);
    const e = parseFloat(n.exame);
    return {
      ...a,
      mediaFinal: calcularMedia(
        isNaN(f) ? null : f,
        isNaN(p) ? null : p,
        isNaN(e) ? null : e,
      ),
    };
  });

  const avaliados = alunosComMedia.filter(a => a.mediaFinal !== null);
  const aprovados = avaliados.filter(a => a.mediaFinal! >= 10);
  const reprovados = avaliados.filter(a => a.mediaFinal! < 10);
  const masculinos = avaliados.filter(a => a.genero === 'M');
  const femininos = avaliados.filter(a => a.genero === 'F');
  const aprovadosM = aprovados.filter(a => a.genero === 'M');
  const aprovadosF = aprovados.filter(a => a.genero === 'F');
  const muitoBons = avaliados.filter(a => a.mediaFinal! >= 18);
  const bons = avaliados.filter(a => a.mediaFinal! >= 14 && a.mediaFinal! < 18);
  const suficientes = avaliados.filter(a => a.mediaFinal! >= 10 && a.mediaFinal! < 14);
  const maus = avaliados.filter(a => a.mediaFinal! < 10);
  const mediaGeral = avaliados.length > 0
    ? avaliados.reduce((s, a) => s + a.mediaFinal!, 0) / avaliados.length
    : null;
  const percAprovacao = avaliados.length > 0
    ? (aprovados.length / avaliados.length) * 100 : 0;

  const niveis = [
    { label: 'Muito Bom', range: '18–20', lista: muitoBons,
      cor: '#16A34A', bg: '#DCFCE7' },
    { label: 'Bom', range: '14–17', lista: bons,
      cor: '#1D5C8A', bg: '#DBEAFE' },
    { label: 'Suficiente', range: '10–13', lista: suficientes,
      cor: '#D97706', bg: '#FEF9C3' },
    { label: 'Mau', range: '0–9', lista: maus,
      cor: '#DC2626', bg: '#FEE2E2' },
  ];

  function corMedia(m: number | null) {
    if (m === null) return '#9CA3AF';
    if (m >= 14) return '#16A34A';
    if (m >= 10) return '#D97706';
    return '#DC2626';
  }

  const ordenados = [...alunosComMedia]
    .sort((a, b) => (b.mediaFinal ?? -1) - (a.mediaFinal ?? -1));

  return (
    <Modal visible transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.container}>

          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitulo}>
                📊 Relatório — {trimestre}º Trimestre
              </Text>
              <Text style={s.headerSub}>
                {turmaMock.nome} · {turmaMock.disciplina} · {turmaMock.anoLetivo}
              </Text>
            </View>
            <TouchableOpacity onPress={onFechar} accessibilityLabel="Fechar relatório">
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scroll}>

            {/* Secção 1: Resumo geral */}
            <Text style={s.secTitulo}>Resumo Geral</Text>
            <View style={s.grid2}>
              <View style={[s.metricCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[s.metricNum, { color: '#1D5C8A' }]}>
                  {avaliados.length}
                </Text>
                <Text style={s.metricLabel}>Avaliados</Text>
                <Text style={s.metricSub}>de {turmaMock.alunos.length} alunos</Text>
              </View>
              <View style={[s.metricCard, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[s.metricNum, { color: '#16A34A' }]}>
                  {percAprovacao.toFixed(1)}%
                </Text>
                <Text style={s.metricLabel}>Aprovação</Text>
                <Text style={s.metricSub}>{aprovados.length} aprovados</Text>
              </View>
              <View style={[s.metricCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[s.metricNum, { color: '#DC2626' }]}>
                  {reprovados.length}
                </Text>
                <Text style={s.metricLabel}>Reprovações</Text>
                <Text style={s.metricSub}>{reprovados.length} alunos</Text>
              </View>
              <View style={[s.metricCard, { backgroundColor: '#FEF9C3' }]}>
                <Text style={[s.metricNum, { color: '#D97706' }]}>
                  {mediaGeral?.toFixed(1) ?? '—'}
                </Text>
                <Text style={s.metricLabel}>Média turma</Text>
                <Text style={s.metricSub}>/20 valores</Text>
              </View>
            </View>

            {/* Secção 2: Por género */}
            <Text style={s.secTitulo}>Por Género</Text>
            <View style={s.row}>
              <View style={[s.generoCard, { backgroundColor: '#DBEAFE', flex: 1 }]}>
                <Text style={[s.generoTitulo, { color: '#1D5C8A' }]}>♂ Masculino</Text>
                <View style={s.generoRow}>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#1D5C8A' }]}>{masculinos.length}</Text>
                    <Text style={s.generoLabel}>Total</Text>
                  </View>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#16A34A' }]}>{aprovadosM.length}</Text>
                    <Text style={s.generoLabel}>Aprov.</Text>
                  </View>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#DC2626' }]}>
                      {masculinos.length - aprovadosM.length}
                    </Text>
                    <Text style={s.generoLabel}>Reprov.</Text>
                  </View>
                </View>
              </View>
              <View style={[s.generoCard, { backgroundColor: '#FCE7F3', flex: 1 }]}>
                <Text style={[s.generoTitulo, { color: '#BE185D' }]}>♀ Feminino</Text>
                <View style={s.generoRow}>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#BE185D' }]}>{femininos.length}</Text>
                    <Text style={s.generoLabel}>Total</Text>
                  </View>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#16A34A' }]}>{aprovadosF.length}</Text>
                    <Text style={s.generoLabel}>Aprov.</Text>
                  </View>
                  <View style={s.generoItem}>
                    <Text style={[s.generoNum, { color: '#DC2626' }]}>
                      {femininos.length - aprovadosF.length}
                    </Text>
                    <Text style={s.generoLabel}>Reprov.</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Secção 3: Aproveitamento */}
            <Text style={s.secTitulo}>Nível de Aproveitamento</Text>
            {niveis.map(n => (
              <View key={n.label} style={[s.nivelCard, { backgroundColor: n.bg }]}>
                <View style={s.nivelHeader}>
                  <Text style={[s.nivelLabel, { color: n.cor }]}>{n.label}</Text>
                  <Text style={s.nivelRange}>{n.range} valores</Text>
                  <View style={[s.nivelBadge, { backgroundColor: n.cor }]}>
                    <Text style={s.nivelBadgeTxt}>{n.lista.length} alunos</Text>
                  </View>
                </View>
                {/* Barra de progresso */}
                <View style={s.barraFundo}>
                  <View style={[s.barraValor, {
                    backgroundColor: n.cor,
                    width: avaliados.length > 0
                      ? `${(n.lista.length / avaliados.length * 100).toFixed(0)}%` as any
                      : '0%',
                  }]} />
                </View>
                <Text style={[s.nivelPerc, { color: n.cor }]}>
                  {avaliados.length > 0
                    ? `${(n.lista.length / avaliados.length * 100).toFixed(1)}% dos avaliados`
                    : '0%'}
                </Text>
              </View>
            ))}

            {/* Secção 4: Lista completa */}
            <Text style={s.secTitulo}>Lista de Alunos</Text>
            {/* Cabeçalho */}
            <View style={s.tabelaHeader}>
              <Text style={[s.tabelaCol, { width: 32 }]}>Nº</Text>
              <Text style={[s.tabelaCol, { flex: 1 }]}>Nome</Text>
              <Text style={[s.tabelaCol, { width: 48 }]}>Méd.</Text>
              <Text style={[s.tabelaCol, { width: 76 }]}>Class.</Text>
            </View>
            {ordenados.map((a, i) => (
              <View key={a.id} style={[
                s.tabelaRow,
                { backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB' },
              ]}>
                <Text style={[s.tabelaNum, { width: 32 }]}>{a.numero}</Text>
                <Text style={[s.tabelaNome, { flex: 1 }]} numberOfLines={1}>
                  {a.nome}
                </Text>
                <Text style={[s.tabelaMedia, {
                  width: 48, color: corMedia(a.mediaFinal),
                }]}>
                  {a.mediaFinal?.toFixed(1) ?? '—'}
                </Text>
                <Text style={[s.tabelaClass, {
                  width: 76, color: corMedia(a.mediaFinal),
                }]}>
                  {a.mediaFinal !== null ? classificacao(a.mediaFinal) : '—'}
                </Text>
              </View>
            ))}

          </ScrollView>

          {/* Botão fechar */}
          <View style={s.rodape}>
            <TouchableOpacity style={s.btnFechar} onPress={onFechar}
              accessibilityLabel="Fechar relatório">
              <Text style={s.btnFecharTxt}>Fechar Relatório</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
                   justifyContent: 'flex-end' },
  container:     { backgroundColor: '#fff', borderTopLeftRadius: 20,
                   borderTopRightRadius: 20, height: '92%' },
  header:        { backgroundColor: '#1D5C8A', borderTopLeftRadius: 20,
                   borderTopRightRadius: 20, padding: 20,
                   flexDirection: 'row', alignItems: 'center' },
  headerTitulo:  { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerSub:     { color: '#93C5FD', fontSize: 13, marginTop: 2 },
  scroll:        { padding: 16, paddingBottom: 20 },
  secTitulo:     { fontSize: 15, fontWeight: '700', color: '#1D5C8A',
                   marginTop: 16, marginBottom: 8 },
  grid2:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard:    { width: '48%', borderRadius: 10, padding: 12 },
  metricNum:     { fontSize: 28, fontWeight: '800' },
  metricLabel:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
  metricSub:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  row:           { flexDirection: 'row', gap: 8 },
  generoCard:    { borderRadius: 10, padding: 12 },
  generoTitulo:  { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  generoRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  generoItem:    { alignItems: 'center' },
  generoNum:     { fontSize: 20, fontWeight: '700' },
  generoLabel:   { fontSize: 11, color: '#6B7280', marginTop: 2 },
  nivelCard:     { borderRadius: 10, padding: 12, marginBottom: 8 },
  nivelHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nivelLabel:    { fontWeight: '700', fontSize: 14, flex: 1 },
  nivelRange:    { fontSize: 12, color: '#6B7280', marginRight: 8 },
  nivelBadge:    { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nivelBadgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  barraFundo:    { height: 8, backgroundColor: 'rgba(0,0,0,0.1)',
                   borderRadius: 4, overflow: 'hidden' },
  barraValor:    { height: 8, borderRadius: 4 },
  nivelPerc:     { fontSize: 12, marginTop: 4 },
  tabelaHeader:  { flexDirection: 'row', backgroundColor: '#F3F4F6',
                   borderRadius: 8, padding: 10, marginBottom: 4 },
  tabelaCol:     { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  tabelaRow:     { flexDirection: 'row', alignItems: 'center',
                   paddingVertical: 10, paddingHorizontal: 10,
                   borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabelaNum:     { fontSize: 11, color: '#9CA3AF' },
  tabelaNome:    { fontSize: 13, color: '#111827' },
  tabelaMedia:   { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tabelaClass:   { fontSize: 11, textAlign: 'right' },
  rodape:        { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  btnFechar:     { backgroundColor: '#1D5C8A', borderRadius: 12,
                   padding: 16, alignItems: 'center' },
  btnFecharTxt:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});