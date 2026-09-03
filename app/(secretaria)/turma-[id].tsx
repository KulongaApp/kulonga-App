import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';

const turmasMock: Record<string, {
  id: string;
  nome: string;
  serie: string;
  anoLectivo: string;
  turno: string;
  coordenador: string;
  alunos: { id: string; nome: string; genero: string }[];
  disciplinas: string[];
}> = {
  '1': {
    id: '1', nome: '10ªA', serie: '10ª classe', anoLectivo: '2025/2026', turno: 'Manhã',
    coordenador: 'Prof. Carlos Manuel',
    alunos: [
      { id: '1', nome: 'João Manuel Sebastião', genero: 'M' },
      { id: '2', nome: 'Maria da Conceição Lopes', genero: 'F' },
      { id: '5', nome: 'António Pedro Silva', genero: 'M' },
      { id: '6', nome: 'Teresa Francisca Lopes', genero: 'F' },
    ],
    disciplinas: ['Matemática', 'Português', 'Física', 'Inglês', 'História'],
  },
  '2': {
    id: '2', nome: '11ªB', serie: '11ª classe', anoLectivo: '2025/2026', turno: 'Tarde',
    coordenador: 'Prof. Ana Paula',
    alunos: [
      { id: '3', nome: 'Pedro António Kiala', genero: 'M' },
      { id: '7', nome: 'Sofia Marta Carlos', genero: 'F' },
    ],
    disciplinas: ['Matemática', 'Português', 'Química', 'Biologia', 'Geografia'],
  },
  '3': {
    id: '3', nome: '12ªA', serie: '12ª classe', anoLectivo: '2025/2026', turno: 'Manhã',
    coordenador: 'Prof. Miguel Torres',
    alunos: [
      { id: '4', nome: 'Ana Beatriz Nzinga', genero: 'F' },
      { id: '8', nome: 'Roberto Carlos Dias', genero: 'M' },
    ],
    disciplinas: ['Matemática', 'Português', 'Física', 'Química', 'Filosofia'],
  },
};

const DISCIPLINAS_DISPONIVEIS = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia',
  'História', 'Geografia', 'Inglês', 'Francês', 'Educação Visual',
  'Educação Física', 'Informática', 'Filosofia', 'Sociologia',
];

export default function TurmaDetalhe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalDisciplina, setModalDisciplina] = useState(false);
  const [novaDisciplina, setNovaDisciplina] = useState('');

  const turma = turmasMock[id ?? ''];

  if (!turma) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.erro}>Turma não encontrada</Text>
          <Button titulo="Voltar" onPress={() => router.back()} variante="primario" />
        </View>
      </SafeAreaView>
    );
  }

  const totalM = turma.alunos.filter((a) => a.genero === 'M').length;
  const totalF = turma.alunos.filter((a) => a.genero === 'F').length;

  function adicionarDisciplina() {
    if (!novaDisciplina) return;
    Alert.alert('Disciplina adicionada', `${novaDisciplina} foi atribuída à turma ${turma.nome}`);
    setNovaDisciplina('');
    setModalDisciplina(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Detalhe da Turma</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Editar', 'Funcionalidade de edição em breve')}
            accessibilityLabel="Editar turma"
          >
            <Ionicons name="create-outline" size={24} color="#1D5C8A" />
          </TouchableOpacity>
        </View>

        <View style={s.turmaHeader}>
          <View style={s.turmaIcone}>
            <Text style={s.turmaIconeTexto}>{turma.nome}</Text>
          </View>
          <Text style={s.turmaNome}>{turma.nome}</Text>
          <Text style={s.turmaSerie}>{turma.serie} · {turma.anoLectivo}</Text>
        </View>

        <View style={s.metricas}>
          <View style={s.metrica}>
            <Text style={s.metricaNumero}>{turma.alunos.length}</Text>
            <Text style={s.metricaLabel}>Alunos</Text>
          </View>
          <View style={s.metricaDivider} />
          <View style={s.metrica}>
            <Text style={[s.metricaNumero, { color: '#1D5C8A' }]}>{totalM}</Text>
            <Text style={s.metricaLabel}>Masculino</Text>
          </View>
          <View style={s.metricaDivider} />
          <View style={s.metrica}>
            <Text style={[s.metricaNumero, { color: '#C8511B' }]}>{totalF}</Text>
            <Text style={s.metricaLabel}>Feminino</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.linha}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Coordenador:</Text>
            <Text style={s.linhaValor}>{turma.coordenador}</Text>
          </View>
          <View style={s.linha}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Turno:</Text>
            <Text style={s.linhaValor}>{turma.turno}</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitulo}>Disciplinas ({turma.disciplinas.length})</Text>
            <TouchableOpacity
              style={s.adicionarBtn}
              onPress={() => setModalDisciplina(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#1D5C8A" />
              <Text style={s.adicionarBtnTxt}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          {turma.disciplinas.map((disc, idx) => (
            <View key={idx} style={s.discRow}>
              <View style={s.discIcone}>
                <Ionicons name="book-outline" size={16} color="#1D5C8A" />
              </View>
              <Text style={s.discNome}>{disc}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Remover', `Remover ${disc} desta turma?`)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitulo}>Alunos ({turma.alunos.length})</Text>
          </View>
          {turma.alunos.map((aluno) => (
            <TouchableOpacity
              key={aluno.id}
              style={s.alunoRow}
              onPress={() => router.push(`/(secretaria)/aluno-${aluno.id}` as any)}
            >
              <View style={[s.alunoAvatar, { backgroundColor: aluno.genero === 'M' ? '#1D5C8A' : '#C8511B' }]}>
                <Text style={s.alunoAvatarTexto}>
                  {aluno.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <Text style={s.alunoNome}>{aluno.nome}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.acoes}>
          <Button
            titulo="Eliminar Turma"
            onPress={() => Alert.alert('Eliminar', 'Tem certeza? Esta acção não pode ser desfeita.')}
            variante="perigo"
            iconeEsquerda="trash-outline"
          />
        </View>
      </ScrollView>

      <Modal transparent visible={modalDisciplina} animationType="fade">
        <View style={s.modalFundo}>
          <View style={s.modalConteudo}>
            <Ionicons name="book-outline" size={48} color="#1D5C8A" />
            <Text style={s.modalTitulo}>Adicionar Disciplina</Text>
            <Text style={s.modalTexto}>Selecciona a disciplina para a turma {turma.nome}</Text>

            <ScrollView style={s.modalLista} nestedScrollEnabled>
              {DISCIPLINAS_DISPONIVEIS.filter((d) => !turma.disciplinas.includes(d)).map((disc) => (
                <TouchableOpacity
                  key={disc}
                  style={[s.modalItem, novaDisciplina === disc && s.modalItemActive]}
                  onPress={() => setNovaDisciplina(disc)}
                >
                  <Text style={[s.modalItemTexto, novaDisciplina === disc && s.modalItemTextoActive]}>
                    {disc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[s.modalBotao, !novaDisciplina && { opacity: 0.5 }]}
              onPress={adicionarDisciplina}
              disabled={!novaDisciplina}
            >
              <Text style={s.modalBotaoTxt}>Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBotao, s.modalBotaoCancelar]}
              onPress={() => { setModalDisciplina(false); setNovaDisciplina(''); }}
            >
              <Text style={[s.modalBotaoTxt, { color: '#111827' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  erro: { fontSize: 16, color: '#DC2626', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  turmaHeader: { alignItems: 'center', marginBottom: 20 },
  turmaIcone: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: '#1D5C8A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  turmaIconeTexto: { color: '#fff', fontSize: 22, fontWeight: '800' },
  turmaNome: { fontSize: 22, fontWeight: '800', color: '#111827' },
  turmaSerie: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  metricas: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  metrica: { flex: 1, alignItems: 'center' },
  metricaDivider: { width: 1, backgroundColor: '#E5E7EB' },
  metricaNumero: { fontSize: 24, fontWeight: '800', color: '#111827' },
  metricaLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827' },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  linhaLabel: { fontSize: 13, color: '#6B7280', width: 100 },
  linhaValor: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },
  adicionarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adicionarBtnTxt: { fontSize: 13, color: '#1D5C8A', fontWeight: '600' },
  discRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10,
  },
  discIcone: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#1D5C8A15',
    alignItems: 'center', justifyContent: 'center',
  },
  discNome: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  alunoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  alunoAvatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  alunoAvatarTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },
  alunoNome: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  acoes: { marginTop: 8 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  modalTexto: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  modalLista: { maxHeight: 300, width: '100%', marginTop: 16 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  modalItemActive: { backgroundColor: '#1D5C8A15' },
  modalItemTexto: { fontSize: 14, color: '#374151' },
  modalItemTextoActive: { color: '#1D5C8A', fontWeight: '600' },
  modalBotao: { marginTop: 12, width: '100%', backgroundColor: '#1D5C8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBotaoTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBotaoCancelar: { backgroundColor: '#F3F4F6', marginTop: 8 },
});
