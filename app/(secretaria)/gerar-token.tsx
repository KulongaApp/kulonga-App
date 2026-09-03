import React, { useEffect, useMemo, useState } from 'react';
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
import { listarAlunos } from '../../services/alunos';
import { obterEscolaDoUsuario } from '../../services/professores';
import { gerarTokenAluno } from '../../services/notas';

interface Aluno {
  id: string;
  nome_completo: string;
  turma?: string;
}

function formatToken(codigo: string) {
  return codigo.split('').join(' ');
}

export default function GerarTokenSecretaria() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregar, setCarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tokenGerado, setTokenGerado] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const escolaId = await obterEscolaDoUsuario();
        if (!escolaId) throw new Error('Escola não encontrada.');
        const data = (await listarAlunos(escolaId)) as Aluno[];
        setAlunos(data);
      } catch (e: any) {
        setErro(e?.message ?? 'Erro ao carregar alunos.');
      } finally {
        setCarregar(false);
      }
    })();
  }, []);

  const alunosFiltrados = useMemo(
    () => alunos.filter((aluno) => (aluno.nome_completo ?? '').toLowerCase().includes(query.toLowerCase())),
    [alunos, query]
  );

  async function gerarToken(aluno: Aluno) {
    try {
      const { data: { user } } = await (await import('../../services/supabase')).supabase.auth.getUser();
      if (!user) throw new Error('Sessão não encontrada.');
      const { sucesso, codigo, erro } = await gerarTokenAluno(aluno.id, user.id);
      if (!sucesso) throw new Error(erro ?? 'Falhou.');
      setTokenGerado(codigo ?? '');
      setAlunoSelecionado(aluno);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível gerar o token.');
    }
  }

  async function copiarCodigo() {
    if (!tokenGerado) return;
    try {
      // @ts-ignore
      const clipboard = (await import('expo-clipboard')) as any;
      await clipboard.setStringAsync(tokenGerado);
      Alert.alert('Copiado', 'Código copiado para a área de transferência');
    } catch {
      Alert.alert('Copiar código', 'Não foi possível copiar no ambiente actual. Guarda o código manualmente.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}> 
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#1D1D1F" />
          </TouchableOpacity>
          <View style={styles.headerTextos}>
            <Text style={styles.titulo}>Gerar Token de Acesso</Text>
            <Text style={styles.subtitulo}>O encarregado usa este código para aceder às notas do seu educando</Text>
          </View>
        </View>

        <View style={styles.pesquisaContainer}>
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            style={styles.pesquisa}
            placeholder="Pesquisar aluno por nome..."
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Pesquisar aluno"
          />
        </View>

        {carregar && <ActivityIndicator style={{ marginTop: 24 }} />}
        {erro && <Text style={styles.erro}>{erro}</Text>}

        {alunosFiltrados.map((aluno) => (
          <View key={aluno.id} style={styles.alunoCard}>
            <View>
              <Text style={styles.alunoNome}>{aluno.nome_completo}</Text>
              <Text style={styles.alunoSub}>{aluno.turma ?? 'Sem turma'}</Text>
            </View>
            <View style={styles.alunoAcao}>
              <Text style={styles.badge}>Aluno</Text>
              <TouchableOpacity style={styles.gerarBtn} onPress={() => gerarToken(aluno)}>
                <Text style={styles.gerarBtnTxt}>Gerar Token</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!carregar && alunosFiltrados.length === 0 && !erro && (
          <Text style={styles.vazio}>Nenhum aluno encontrado.</Text>
        )}

        <Modal transparent visible={!!alunoSelecionado} animationType="fade">
          <View style={styles.modalFundo}>
            <View style={styles.modalConteudo}>
              <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
              <Text style={styles.modalTitulo}>Token gerado com sucesso!</Text>
              <Text style={styles.modalAluno}>{alunoSelecionado?.nome_completo}</Text>
              <Text style={styles.modalCodigo}>{formatToken(tokenGerado)}</Text>
              <Text style={styles.modalInstrucoes}>Entrega este código ao encarregado de educação pessoalmente ou imprime.</Text>
              <TouchableOpacity style={styles.modalBotao} onPress={copiarCodigo}>
                <Text style={styles.modalBotaoTxt}>Copiar código</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBotao, styles.modalBotaoSecundario]} onPress={() => { setAlunoSelecionado(null); setTokenGerado(''); }}>
                <Text style={[styles.modalBotaoTxt, styles.modalBotaoSecundarioTxt]}>Fechar</Text>
              </TouchableOpacity>
              <Text style={styles.modalAviso}>⚠ Guarda este código agora. Por segurança não é possível recuperá-lo.</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  headerTextos: { flex: 1 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitulo: { marginTop: 6, color: '#6B7280', fontSize: 13, lineHeight: 20 },
  pesquisaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pesquisa: { flex: 1, fontSize: 15 },
  erro: { marginTop: 12, color: '#DC2626', fontSize: 13 },
  vazio: { marginTop: 24, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  alunoCard: { marginTop: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  alunoNome: { fontSize: 14, fontWeight: '700', color: '#111827' },
  alunoSub: { marginTop: 4, color: '#6B7280', fontSize: 12 },
  alunoAcao: { alignItems: 'flex-end' },
  badge: { backgroundColor: '#E5E7EB', color: '#4B5563', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  gerarBtn: { backgroundColor: '#C8511B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  gerarBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitulo: { marginTop: 16, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalAluno: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  modalCodigo: { marginTop: 18, fontSize: 26, fontWeight: '800', color: '#C8511B', letterSpacing: 3, textAlign: 'center' },
  modalInstrucoes: { marginTop: 12, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  modalBotao: { marginTop: 18, width: '100%', backgroundColor: '#1D5C8A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBotaoTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBotaoSecundario: { backgroundColor: '#F3F4F6' },
  modalBotaoSecundarioTxt: { color: '#111827' },
  modalAviso: { marginTop: 14, color: '#B91C1C', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
