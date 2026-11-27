import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const PROVINCIAS = [
  { nome: 'Bengo', icone: 'leaf-outline', cor: '#123C69' },
  { nome: 'Benguela', icone: 'water-outline', cor: '#123C69' },
  { nome: 'Bié', icone: 'sunny-outline', cor: '#123C69' },
  { nome: 'Cabinda', icone: 'business-outline', cor: '#123C69' },
  { nome: 'Cuando Cubango', icone: 'compass-outline', cor: '#123C69' },
  { nome: 'Cunene', icone: 'paw-outline', cor: '#123C69' },
  { nome: 'Huambo', icone: 'location-outline', cor: '#123C69' },
  { nome: 'Huíla', icone: 'leaf-outline', cor: '#123C69' },
  { nome: 'Kwanza Norte', icone: 'water-outline', cor: '#123C69' },
  { nome: 'Kwanza Sul', icone: 'water-outline', cor: '#123C69' },
  { nome: 'Luanda', icone: 'business-outline', cor: '#123C69' },
  { nome: 'Lunda Norte', icone: 'diamond-outline', cor: '#123C69' },
  { nome: 'Lunda Sul', icone: 'diamond-outline', cor: '#123C69' },
  { nome: 'Malanje', icone: 'leaf-outline', cor: '#123C69' },
  { nome: 'Moxico', icone: 'compass-outline', cor: '#123C69' },
  { nome: 'Namibe', icone: 'sunny-outline', cor: '#123C69' },
  { nome: 'Uíge', icone: 'leaf-outline', cor: '#123C69' },
  { nome: 'Zaire', icone: 'water-outline', cor: '#123C69' },
] as const;

export default function Provincia() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const colunas = width >= 900 ? 2 : 1;
  const resultados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-PT');
    return PROVINCIAS.filter((item) => item.nome.toLocaleLowerCase('pt-PT').includes(termo));
  }, [pesquisa]);

  async function continuar() {
    if (!seleccionada) return;
    await AsyncStorage.setItem('kulonga_provincia', seleccionada);
    router.replace('/(auth)/escolher-perfil' as any);
  }

  function renderItem({ item }: { item: (typeof PROVINCIAS)[number] }) {
    const activo = seleccionada === item.nome;
    return (
      <TouchableOpacity
        style={[s.item, colunas === 2 && s.itemDuasColunas, activo && s.itemActivo]}
        onPress={() => setSeleccionada(item.nome)}
        accessibilityRole="radio"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={`Seleccionar ${item.nome}`}
        activeOpacity={0.8}
      >
        <View style={[s.iconCircle, { backgroundColor: `${item.cor}18` }]}>
          <Ionicons name={item.icone as any} size={22} color={item.cor} />
        </View>
        <View style={s.itemCopy}>
          <Text style={[s.itemNome, activo && s.itemNomeActivo]}>{item.nome}</Text>
          <Text style={s.itemMeta}>Província de Angola</Text>
        </View>
        <View style={[s.radio, activo && { borderColor: item.cor, backgroundColor: item.cor }]}>
          {activo && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.page}>
        <View style={s.topo}>
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo-mark.png')} style={s.brandLogo} accessibilityLabel="Kulonga" />
            <View><Text style={s.logo}>KULONGA</Text><Text style={s.sub}>A escola no teu bolso</Text></View>
          </View>
          <View style={s.progress}><View style={[s.progressFill, { width: '50%' }]} /></View>
          <Text style={s.step}>Passo 1 de 2</Text>
          <Text style={s.titulo}>Onde fica a tua escola?</Text>
          <Text style={s.descricao}>Escolhe a província para personalizarmos a tua experiência.</Text>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={20} color="#55667A" />
          <TextInput
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Pesquisar província"
            placeholderTextColor="#7A8CA0"
            style={s.searchInput}
            returnKeyType="search"
            accessibilityLabel="Pesquisar província"
          />
          {pesquisa.length > 0 && <TouchableOpacity onPress={() => setPesquisa('')} accessibilityLabel="Limpar pesquisa"><Ionicons name="close-circle" size={19} color="#7A8CA0" /></TouchableOpacity>}
        </View>

        <View style={s.listHeader}><Text style={s.listTitle}>Todas as províncias</Text><Text style={s.count}>{resultados.length}</Text></View>
        <FlatList
          data={resultados}
          renderItem={renderItem}
          keyExtractor={(item) => item.nome}
          numColumns={colunas}
          key={colunas}
          columnWrapperStyle={colunas === 2 ? s.columnWrapper : undefined}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="search-outline" size={30} color="#7A8CA0" /><Text style={s.emptyTitle}>Nenhuma província encontrada</Text><Text style={s.emptyText}>Tenta pesquisar por outro nome.</Text></View>}
        />

        <View style={s.rodape}>
          <View style={s.selectionHint}><Ionicons name="information-circle-outline" size={18} color="#123C69" /><Text style={s.hintText}>{seleccionada ? `Seleccionada: ${seleccionada}` : 'Selecciona uma província para continuar'}</Text></View>
          <TouchableOpacity style={[s.btn, !seleccionada && s.btnDesact]} onPress={continuar} disabled={!seleccionada} accessibilityLabel="Continuar para escolher perfil"><Text style={s.btnTxt}>Continuar</Text><Ionicons name="arrow-forward" size={19} color="#fff" /></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6EFE3' },
  page: { flex: 1, maxWidth: 1080, width: '100%', alignSelf: 'center' },
  topo: { backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#E3DACB' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#8F5F00', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  logo: { color: '#0B2A4A', fontSize: 16, fontWeight: '900', letterSpacing: 1.6 },
  sub: { color: '#55667A', fontSize: 11, marginTop: 2 },
  progress: { height: 5, backgroundColor: '#E3DACB', borderRadius: 8, marginTop: 22, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#123C69', borderRadius: 8 },
  step: { color: '#123C69', fontSize: 12, fontWeight: '800', marginTop: 14 },
  titulo: { color: '#0B2A4A', fontSize: 25, fontWeight: '900', marginTop: 8 },
  descricao: { color: '#55667A', fontSize: 14, lineHeight: 20, marginTop: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#CFC4B0', borderRadius: 13, marginHorizontal: 24, marginTop: 18, paddingHorizontal: 14, minHeight: 52 },
  searchInput: { flex: 1, color: '#0B2A4A', fontSize: 15, paddingHorizontal: 10 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginTop: 20, marginBottom: 6 },
  listTitle: { color: '#334155', fontSize: 13, fontWeight: '800' },
  count: { color: '#123C69', backgroundColor: '#E4EEF8', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, fontSize: 11, fontWeight: '800' },
  lista: { paddingHorizontal: 19, paddingBottom: 18 },
  columnWrapper: { gap: 10 },
  item: { flex: 1, minHeight: 76, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E3DACB', paddingHorizontal: 13, marginHorizontal: 5, marginVertical: 5 },
  itemDuasColunas: { maxWidth: '50%' },
  itemActivo: { borderColor: '#123C69', backgroundColor: '#FFFBF3' },
  iconCircle: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, marginLeft: 11 },
  itemNome: { color: '#0B2A4A', fontSize: 15, fontWeight: '800' },
  itemNomeActivo: { color: '#123C69' },
  itemMeta: { color: '#7A8CA0', fontSize: 11, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CFC4B0', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 54 },
  emptyTitle: { color: '#334155', fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#55667A', marginTop: 5 },
  rodape: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E3DACB', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  selectionHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  hintText: { flex: 1, color: '#55667A', fontSize: 12 },
  btn: { minHeight: 50, borderRadius: 13, backgroundColor: '#123C69', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDesact: { backgroundColor: '#CFC4B0' },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
