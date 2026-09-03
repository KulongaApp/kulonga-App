import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { buscarAluno, removerAluno } from '../../services/alunos';
import { gerarTokenAluno } from '../../services/notas';
import { supabase } from '../../services/supabase';

export default function AlunoDetalhe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalToken, setModalToken] = useState(false);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error('ID em falta');
        const data = await buscarAluno(id as string);
        setAluno(data);
      } catch (e: any) { setErro(e?.message ?? 'Aluno não encontrado'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function gerarToken() {
    setGerando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão não encontrada');
      const res = await gerarTokenAluno(id as string, user.id);
      if (!res.sucesso) throw new Error(res.erro);
      Alert.alert('Token gerado', `Código: ${res.codigo}\nEntrega ao encarregado.`);
      setModalToken(false);
    } catch (e: any) { Alert.alert('Erro', e?.message ?? 'Falha ao gerar token'); }
    finally { setGerando(false); }
  }

  async function eliminar() {
    Alert.alert('Eliminar', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await removerAluno(id as string); Alert.alert('Removido'); router.back(); } catch (e: any) { Alert.alert('Erro', e.message); }
      }},
    ]);
  }

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 40 }} color="#1D5C8A" /></SafeAreaView>;
  if (erro || !aluno) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.erro}>{erro || 'Aluno não encontrado'}</Text><TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#1D5C8A' }}>Voltar</Text></TouchableOpacity></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1D1D1F" /></TouchableOpacity>
          <Text style={s.headerTitulo}>Detalhe do Aluno</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarTexto}>{aluno.nome_completo?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</Text></View>
          <Text style={s.nome}>{aluno.nome_completo}</Text>
          <Text style={s.turma}>{aluno.genero === 'M' ? 'Masculino' : 'Feminino'} · {aluno.data_nascimento ?? ''}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardTitulo}>Dados</Text>
          <View style={s.linha}><Ionicons name="call-outline" size={16} color="#6B7280" /><Text style={s.linhaLabel}>Telefone:</Text><Text style={s.linhaValor}>{aluno.telefone ?? '—'}</Text></View>
          <View style={s.linha}><Ionicons name="navigate-outline" size={16} color="#6B7280" /><Text style={s.linhaLabel}>Endereço:</Text><Text style={s.linhaValor}>{aluno.endereco ?? '—'}</Text></View>
        </View>
        <TouchableOpacity style={[s.tokenBtn, { backgroundColor: '#1D5C8A' }]} onPress={() => setModalToken(true)}><Text style={s.tokenBtnTxt}>Gerar token</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tokenBtn, { backgroundColor: '#DC2626', marginTop: 12 }]} onPress={eliminar}><Text style={s.tokenBtnTxt}>Eliminar Aluno</Text></TouchableOpacity>
      </ScrollView>
      <Modal transparent visible={modalToken} animationType="fade">
        <View style={s.modalFundo}><View style={s.modalConteudo}>
          <Ionicons name="key-outline" size={48} color="#C8511B" />
          <Text style={s.modalTitulo}>Gerar Token</Text>
          <Text style={s.modalTexto}>Gera código de 6 dígitos para o encarregado de {aluno.nome_completo}.</Text>
          <TouchableOpacity style={s.modalBotao} onPress={gerarToken} disabled={gerando}>{gerando ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBotaoTxt}>Confirmar</Text>}</TouchableOpacity>
          <TouchableOpacity style={[s.modalBotao, s.modalBotaoCancelar]} onPress={() => setModalToken(false)}><Text style={[s.modalBotaoTxt, { color: '#111827' }]}>Cancelar</Text></TouchableOpacity>
        </View></View>
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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D5C8A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTexto: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nome: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  turma: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  linhaLabel: { fontSize: 13, color: '#6B7280', width: 80 },
  linhaValor: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },
  tokenBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  tokenBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalConteudo: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  modalTexto: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  modalBotao: { marginTop: 16, width: '100%', backgroundColor: '#1D5C8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBotaoTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalBotaoCancelar: { backgroundColor: '#F3F4F6', marginTop: 8 },
});
