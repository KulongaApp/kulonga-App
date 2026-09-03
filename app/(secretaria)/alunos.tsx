import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listarAlunos, adicionarAluno } from '../../services/alunos';
import { obterEscolaDoUsuario } from '../../services/professores';

interface Aluno {
  id: string;
  nome_completo: string;
  genero?: string;
  data_nascimento?: string;
  turma?: string;
}

export default function SecretariaAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState<'M' | 'F' | ''>('');
  const [data, setData] = useState('');
  const [turma, setTurma] = useState('');

  async function carregarAlunos() {
    setCarregar(true);
    setErro(null);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola do utilizador não encontrada.');
      const data = await listarAlunos(escolaId);
      setAlunos(data as Aluno[]);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar alunos.');
    } finally {
      setCarregar(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  async function criar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      await adicionarAluno({
        escolaId,
        nomeCompleto: nome.trim(),
        genero: genero || undefined,
        dataNascimento: data.trim() || undefined,
      });
      setModal(false);
      setNome('');
      setGenero('');
      setData('');
      setTurma('');
      await carregarAlunos();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao criar aluno.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Alunos</Text>
        <Text style={styles.subtitulo}>Lista de alunos registados na escola.</Text>

        {carregar && <ActivityIndicator style={{ marginTop: 24 }} />}
        {erro && <Text style={styles.erro}>{erro}</Text>}

        {!carregar &&
          alunos.map((a) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.alunoNome}>{a.nome_completo}</Text>
              <Text style={styles.alunoSub}>
                {[a.genero ? (a.genero === 'M' ? 'Masculino' : 'Feminino') : null, a.turma]
                  .filter(Boolean)
                  .join(' • ') || 'Sem dados'}
              </Text>
            </View>
          ))}

        {!carregar && alunos.length === 0 && !erro && (
          <Text style={styles.vazio}>Nenhum aluno registado ainda.</Text>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Novo aluno</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={styles.input}
              placeholder="Género (M/F)"
              value={genero}
              onChangeText={(t) => setGenero(t.toUpperCase() as any)}
              maxLength={1}
            />
            <TextInput
              style={styles.input}
              placeholder="Data de nascimento (AAAA-MM-DD)"
              value={data}
              onChangeText={setData}
            />
            <TextInput
              style={styles.input}
              placeholder="Turma (ex: 10ªA)"
              value={turma}
              onChangeText={setTurma}
            />
            {erro && <Text style={styles.erro}>{erro}</Text>}
            <View style={styles.modalBotoes}>
              <Pressable style={styles.botaoCancelar} onPress={() => setModal(false)}>
                <Text style={styles.botaoCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]}
                onPress={criar}
                disabled={salvando}
              >
                <Text style={styles.botaoSalvarText}>
                  {salvando ? 'A guardar...' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 80 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitulo: { marginTop: 6, color: '#6B7280', fontSize: 13 },
  card: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  alunoNome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  alunoSub: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  erro: { marginTop: 12, color: '#DC2626', fontSize: 13 },
  vazio: { marginTop: 24, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 4 },
  botaoCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  botaoCancelarText: { color: '#374151', fontWeight: '700' },
  botaoSalvar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  botaoSalvarText: { color: '#fff', fontWeight: '700' },
});
