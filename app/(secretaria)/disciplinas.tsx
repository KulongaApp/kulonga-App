import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  listarDisciplinas,
  adicionarDisciplina,
  actualizarDisciplina,
  removerDisciplina,
} from '../../services/disciplinas';
import { obterEscolaDoUsuario } from '../../services/professores';

interface Disciplina {
  id: string;
  nome: string;
  codigo?: string;
}

const cores: Record<string, string> = {
  MAT: '#1D5C8A', POR: '#C8511B', FIS: '#7C3AED', QUI: '#059669',
  BIO: '#16A34A', HIS: '#D97706', GEO: '#0891B2', ING: '#6366F1', FIL: '#BE185D',
};

export default function DisciplinasSecretaria() {
  const router = useRouter();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [query, setQuery] = useState('');
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [disciplinaEditar, setDisciplinaEditar] = useState<Disciplina | null>(null);
  const [novaDisciplina, setNovaDisciplina] = useState({ nome: '', codigo: '' });

  async function carregarDisciplinas() {
    setCarregar(true);
    setErro(null);
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola do utilizador não encontrada.');
      const data = (await listarDisciplinas(escolaId)) as Disciplina[];
      setDisciplinas(data);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar disciplinas.');
    } finally {
      setCarregar(false);
    }
  }

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  const filtradas = disciplinas.filter((d) =>
    d.nome.toLowerCase().includes(query.toLowerCase()) ||
    (d.codigo ?? '').toLowerCase().includes(query.toLowerCase())
  );

  async function adicionar() {
    if (!novaDisciplina.nome || !novaDisciplina.codigo) {
      Alert.alert('Erro', 'Preenche todos os campos');
      return;
    }
    try {
      const escolaId = await obterEscolaDoUsuario();
      if (!escolaId) throw new Error('Escola não encontrada.');
      await adicionarDisciplina({
        escolaId,
        nome: novaDisciplina.nome,
        codigo: novaDisciplina.codigo,
      });
      setNovaDisciplina({ nome: '', codigo: '' });
      setModalAdicionar(false);
      await carregarDisciplinas();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível adicionar.');
    }
  }

  async function editar() {
    if (!disciplinaEditar) return;
    try {
      await actualizarDisciplina(disciplinaEditar.id, {
        nome: disciplinaEditar.nome,
        codigo: disciplinaEditar.codigo,
      });
      setModalEditar(false);
      setDisciplinaEditar(null);
      await carregarDisciplinas();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível actualizar.');
    }
  }

  function eliminar(disc: Disciplina) {
    Alert.alert(
      'Eliminar disciplina',
      `Tem certeza que queres eliminar ${disc.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerDisciplina(disc.id);
              await carregarDisciplinas();
            } catch (e: any) {
              Alert.alert('Erro', e?.message ?? 'Não foi possível eliminar.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Disciplinas</Text>
          <TouchableOpacity style={s.adicionarHeaderBtn} onPress={() => setModalAdicionar(true)}>
            <Ionicons name="add-circle" size={28} color="#1D5C8A" />
          </TouchableOpacity>
        </View>

        {carregar ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <Text style={s.subtitulo}>{disciplinas.length} disciplinas registadas</Text>
        )}

        {erro && <Text style={s.erro}>{erro}</Text>}

        <View style={s.pesquisaContainer}>
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            style={s.pesquisa}
            placeholder="Pesquisar disciplina..."
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Pesquisar disciplina"
          />
        </View>

        {filtradas.map((disc) => {
          const cor = cores[disc.codigo ?? ''] ?? '#6B7280';
          return (
            <View key={disc.id} style={s.card}>
              <View style={s.cardTopo}>
                <View style={[s.cardIcone, { backgroundColor: cor + '20' }]}>
                  <Text style={[s.cardCodigo, { color: cor }]}>{disc.codigo ?? '—'}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardNome}>{disc.nome}</Text>
                  <Text style={s.cardSub}>{disc.codigo ?? 'Sem código'}</Text>
                </View>
                <View style={s.cardAc}>
                  <TouchableOpacity
                    onPress={() => {
                      setDisciplinaEditar(disc);
                      setModalEditar(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#1D5C8A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => eliminar(disc)}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {!carregar && filtradas.length === 0 && !erro && (
          <Text style={s.vazio}>Nenhuma disciplina encontrada.</Text>
        )}
      </ScrollView>

      <Modal transparent visible={modalAdicionar} animationType="fade">
        <View style={s.modalFundo}>
          <View style={s.modalConteudo}>
            <Ionicons name="book-outline" size={48} color="#1D5C8A" />
            <Text style={s.modalTitulo}>Adicionar Disciplina</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Nome da disciplina"
              value={novaDisciplina.nome}
              onChangeText={(t) => setNovaDisciplina({ ...novaDisciplina, nome: t })}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Código (ex: MAT)"
              value={novaDisciplina.codigo}
              onChangeText={(t) => setNovaDisciplina({ ...novaDisciplina, codigo: t.toUpperCase() })}
              maxLength={5}
            />
            <TouchableOpacity style={s.modalBotao} onPress={adicionar}>
              <Text style={s.modalBotaoTxt}>Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBotao, s.modalBotaoCancelar]}
              onPress={() => {
                setModalAdicionar(false);
                setNovaDisciplina({ nome: '', codigo: '' });
              }}
            >
              <Text style={[s.modalBotaoTxt, { color: '#111827' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={modalEditar} animationType="fade">
        <View style={s.modalFundo}>
          <View style={s.modalConteudo}>
            <Ionicons name="create-outline" size={48} color="#1D5C8A" />
            <Text style={s.modalTitulo}>Editar Disciplina</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Nome da disciplina"
              value={disciplinaEditar?.nome ?? ''}
              onChangeText={(t) => disciplinaEditar && setDisciplinaEditar({ ...disciplinaEditar, nome: t })}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Código"
              value={disciplinaEditar?.codigo ?? ''}
              onChangeText={(t) => disciplinaEditar && setDisciplinaEditar({ ...disciplinaEditar, codigo: t.toUpperCase() })}
              maxLength={5}
            />
            <TouchableOpacity style={s.modalBotao} onPress={editar}>
              <Text style={s.modalBotaoTxt}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBotao, s.modalBotaoCancelar]}
              onPress={() => {
                setModalEditar(false);
                setDisciplinaEditar(null);
              }}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitulo: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  adicionarHeaderBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  subtitulo: { color: '#6B7280', fontSize: 13, marginBottom: 16 },
  erro: { color: '#DC2626', fontSize: 13, marginBottom: 12 },
  vazio: { marginTop: 24, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  pesquisaContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 16,
  },
  pesquisa: { flex: 1, fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardCodigo: { fontSize: 14, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardAc: { flexDirection: 'row', gap: 12 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  modalInput: {
    width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 16,
  },
  modalBotao: { marginTop: 12, width: '100%', backgroundColor: '#1D5C8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBotaoTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBotaoCancelar: { backgroundColor: '#F3F4F6', marginTop: 8 },
});
