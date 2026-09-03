import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';

const alunosMock: Record<string, {
  id: string;
  nome: string;
  turma: string;
  genero: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  tokenActivo: boolean;
  tokenCodigo: string;
  notas: { disciplina: string; frequencia: number; prova: number; exame: number; media: number }[];
}> = {
  '1': {
    id: '1', nome: 'João Manuel Sebastião', turma: '10ªA', genero: 'M',
    dataNascimento: '15/03/2008', telefone: '923 456 789', endereco: 'Rua da Escola, 12',
    tokenActivo: true, tokenCodigo: '123 456',
    notas: [
      { disciplina: 'Matemática', frequencia: 14, prova: 16, exame: 15, media: 15 },
      { disciplina: 'Português', frequencia: 12, prova: 13, exame: 14, media: 13 },
      { disciplina: 'Física', frequencia: 15, prova: 17, exame: 16, media: 16 },
      { disciplina: 'Inglês', frequencia: 16, prova: 18, exame: 17, media: 17 },
    ],
  },
  '2': {
    id: '2', nome: 'Maria da Conceição Lopes', turma: '10ªA', genero: 'F',
    dataNascimento: '22/07/2008', telefone: '924 567 890', endereco: 'Av. Principal, 45',
    tokenActivo: false, tokenCodigo: '',
    notas: [
      { disciplina: 'Matemática', frequencia: 16, prova: 18, exame: 17, media: 17 },
      { disciplina: 'Português', frequencia: 17, prova: 19, exame: 18, media: 18 },
      { disciplina: 'Biologia', frequencia: 15, prova: 16, exame: 15, media: 15.5 },
    ],
  },
  '3': {
    id: '3', nome: 'Pedro António Kiala', turma: '11ªB', genero: 'M',
    dataNascimento: '10/01/2007', telefone: '925 678 901', endereco: 'Bairro Central, 78',
    tokenActivo: true, tokenCodigo: '789 012',
    notas: [
      { disciplina: 'História', frequencia: 11, prova: 12, exame: 10, media: 11 },
      { disciplina: 'Geografia', frequencia: 13, prova: 14, exame: 12, media: 13 },
    ],
  },
  '4': {
    id: '4', nome: 'Ana Beatriz Nzinga', turma: '12ªA', genero: 'F',
    dataNascimento: '05/11/2006', telefone: '926 789 012', endereco: 'Rua Sul, 33',
    tokenActivo: false, tokenCodigo: '',
    notas: [
      { disciplina: 'Química', frequencia: 18, prova: 19, exame: 18, media: 18.3 },
      { disciplina: 'Matemática', frequencia: 17, prova: 18, exame: 17, media: 17.3 },
      { disciplina: 'Português', frequencia: 16, prova: 17, exame: 16, media: 16.3 },
    ],
  },
};

function corNota(nota: number) {
  if (nota >= 14) return '#16A34A';
  if (nota >= 10) return '#D97706';
  return '#DC2626';
}

function estadoAluno(media: number) {
  if (media >= 14) return { texto: 'Aprovado', cor: '#16A34A' };
  if (media >= 10) return { texto: 'Em recurso', cor: '#D97706' };
  return { texto: 'Reprovado', cor: '#DC2626' };
}

export default function AlunoDetalhe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalToken, setModalToken] = useState(false);

  const aluno = alunosMock[id ?? ''];

  if (!aluno) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.erro}>Aluno não encontrado</Text>
          <Button titulo="Voltar" onPress={() => router.back()} variante="primario" />
        </View>
      </SafeAreaView>
    );
  }

  const mediaGeral = aluno.notas.length > 0
    ? aluno.notas.reduce((acc, n) => acc + n.media, 0) / aluno.notas.length
    : 0;
  const estado = estadoAluno(mediaGeral);

  function gerarToken() {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    Alert.alert(
      'Token gerado',
      `Código: ${codigo.split('').join(' ')}\n\nEntrega este código ao encarregado.`,
      [{ text: 'OK' }]
    );
    setModalToken(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Detalhe do Aluno</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Editar', 'Funcionalidade de edição em breve')}
            accessibilityLabel="Editar aluno"
          >
            <Ionicons name="create-outline" size={24} color="#1D5C8A" />
          </TouchableOpacity>
        </View>

        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>
              {aluno.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <Text style={s.nome}>{aluno.nome}</Text>
          <Text style={s.turma}>{aluno.turma}</Text>
          <View style={[s.estadoBadge, { backgroundColor: estado.cor + '20' }]}>
            <Text style={[s.estadoTexto, { color: estado.cor }]}>{estado.texto}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Dados Pessoais</Text>
          <View style={s.linha}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Género:</Text>
            <Text style={s.linhaValor}>{aluno.genero === 'M' ? 'Masculino' : 'Feminino'}</Text>
          </View>
          <View style={s.linha}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Nascimento:</Text>
            <Text style={s.linhaValor}>{aluno.dataNascimento}</Text>
          </View>
          <View style={s.linha}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Telefone:</Text>
            <Text style={s.linhaValor}>{aluno.telefone}</Text>
          </View>
          <View style={s.linha}>
            <Ionicons name="navigate-outline" size={16} color="#6B7280" />
            <Text style={s.linhaLabel}>Endereço:</Text>
            <Text style={s.linhaValor}>{aluno.endereco}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Token de Acesso</Text>
          {aluno.tokenActivo ? (
            <View>
              <View style={s.tokenRow}>
                <Ionicons name="key-outline" size={20} color="#16A34A" />
                <Text style={s.tokenEstado}>Token activo</Text>
              </View>
              <Text style={s.tokenCodigo}>{aluno.tokenCodigo}</Text>
              <TouchableOpacity
                style={s.tokenBtn}
                onPress={() => setModalToken(true)}
              >
                <Text style={s.tokenBtnTxt}>Gerar novo token</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={s.tokenRow}>
                <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                <Text style={[s.tokenEstado, { color: '#DC2626' }]}>Sem token activo</Text>
              </View>
              <TouchableOpacity
                style={[s.tokenBtn, { backgroundColor: '#C8511B' }]}
                onPress={() => setModalToken(true)}
              >
                <Text style={s.tokenBtnTxt}>Gerar token</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitulo}>Notas por Disciplina</Text>
            <Text style={s.mediaLabel}>Média: {mediaGeral.toFixed(1)}</Text>
          </View>
          {aluno.notas.map((nota, idx) => (
            <View key={idx} style={s.notaRow}>
              <View style={s.notaInfo}>
                <Text style={s.notaDisc}>{nota.disciplina}</Text>
                <View style={s.notaDetalhes}>
                  <Text style={s.notaDetalhe}>F: {nota.frequencia}</Text>
                  <Text style={s.notaDetalhe}>P: {nota.prova}</Text>
                  <Text style={s.notaDetalhe}>E: {nota.exame}</Text>
                </View>
              </View>
              <View style={[s.notaBadge, { backgroundColor: corNota(nota.media) + '20' }]}>
                <Text style={[s.notaValor, { color: corNota(nota.media) }]}>
                  {nota.media.toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.acoes}>
          <Button
            titulo="Gerar Token"
            onPress={() => setModalToken(true)}
            variante="secundario"
            iconeEsquerda="key-outline"
          />
          <Button
            titulo="Eliminar Aluno"
            onPress={() => Alert.alert('Eliminar', 'Tem certeza? Esta acção não pode ser desfeita.')}
            variante="perigo"
            iconeEsquerda="trash-outline"
          />
        </View>
      </ScrollView>

      <Modal transparent visible={modalToken} animationType="fade">
        <View style={s.modalFundo}>
          <View style={s.modalConteudo}>
            <Ionicons name="key-outline" size={48} color="#C8511B" />
            <Text style={s.modalTitulo}>Gerar Token de Acesso</Text>
            <Text style={s.modalTexto}>
              Vai gerar um código de 6 dígitos para o encarregado de {aluno.nome} aceder às notas.
            </Text>
            <TouchableOpacity style={s.modalBotao} onPress={gerarToken}>
              <Text style={s.modalBotaoTxt}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBotao, s.modalBotaoCancelar]}
              onPress={() => setModalToken(false)}
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
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D5C8A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarTexto: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nome: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  turma: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  estadoBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  estadoTexto: { fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  mediaLabel: { fontSize: 14, fontWeight: '600', color: '#1D5C8A' },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  linhaLabel: { fontSize: 13, color: '#6B7280', width: 80 },
  linhaValor: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tokenEstado: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  tokenCodigo: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: 3, marginBottom: 12 },
  tokenBtn: { backgroundColor: '#1D5C8A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  tokenBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  notaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  notaInfo: { flex: 1 },
  notaDisc: { fontSize: 14, fontWeight: '600', color: '#111827' },
  notaDetalhes: { flexDirection: 'row', gap: 12, marginTop: 4 },
  notaDetalhe: { fontSize: 12, color: '#6B7280' },
  notaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  notaValor: { fontSize: 16, fontWeight: '700' },
  acoes: { gap: 12, marginTop: 8 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  modalTexto: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  modalBotao: { marginTop: 16, width: '100%', backgroundColor: '#1D5C8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBotaoTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBotaoCancelar: { backgroundColor: '#F3F4F6', marginTop: 8 },
});
