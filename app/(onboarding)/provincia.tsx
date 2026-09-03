import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// As 18 províncias de Angola com cores regionais
const PROVINCIAS = [
  { nome: 'Luanda',          emoji: '🏙', cor: '#C8511B' },
  { nome: 'Benguela',        emoji: '🌊', cor: '#1A6B4A' },
  { nome: 'Huambo',          emoji: '🏔', cor: '#8B1A2F' },
  { nome: 'Huíla',           emoji: '🌿', cor: '#6B1A8B' },
  { nome: 'Namibe',          emoji: '🏜', cor: '#C17A2E' },
  { nome: 'Cabinda',         emoji: '🛢', cor: '#1A4A6B' },
  { nome: 'Malanje',         emoji: '💧', cor: '#2D5016' },
  { nome: 'Uíge',            emoji: '🌳', cor: '#4A1A6B' },
  { nome: 'Bié',             emoji: '🌾', cor: '#6B4A1A' },
  { nome: 'Moxico',          emoji: '🦅', cor: '#1A6B6B' },
  { nome: 'Kwanza Norte',    emoji: '🌊', cor: '#1A3A6B' },
  { nome: 'Kwanza Sul',      emoji: '🌱', cor: '#3A6B1A' },
  { nome: 'Lunda Norte',     emoji: '💎', cor: '#6B1A1A' },
  { nome: 'Lunda Sul',       emoji: '💎', cor: '#4A1A4A' },
  { nome: 'Cunene',          emoji: '🐄', cor: '#6B5A1A' },
  { nome: 'Cuando Cubango',  emoji: '🐘', cor: '#1A5A3A' },
  { nome: 'Bengo',           emoji: '🌴', cor: '#2A6B2A' },
  { nome: 'Zaire',           emoji: '🌊', cor: '#1A2A6B' },
];

export default function Provincia() {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const router = useRouter();

  function continuar() {
    if (!seleccionada) return;
    // TODO: guardar no Supabase o perfil da escola/utilizador
    router.push('/(onboarding)/lingua');
  }

  function renderItem({ item }: { item: typeof PROVINCIAS[0] }) {
    const activo = seleccionada === item.nome;
    return (
      <TouchableOpacity
        style={[s.item, activo && { borderColor: item.cor, borderWidth: 2, backgroundColor: item.cor + '11' }]}
        onPress={() => setSeleccionada(item.nome)}
        accessibilityLabel={`Seleccionar ${item.nome}`}
        activeOpacity={0.75}
      >
        <Text style={s.emoji}>{item.emoji}</Text>
        <Text style={[s.itemNome, activo && { color: item.cor, fontWeight: '700' }]}
          numberOfLines={1}>
          {item.nome}
        </Text>
        {activo && (
          <View style={[s.check, { backgroundColor: item.cor }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Topo */}
      <View style={s.topo}>
        <Text style={s.logo}>KULONGA</Text>
        <Text style={s.sub}>A escola no teu bolso</Text>
        <Text style={s.titulo}>Selecciona a tua província</Text>
      </View>

      {/* Grid de províncias */}
      <FlatList
        data={PROVINCIAS}
        renderItem={renderItem}
        keyExtractor={item => item.nome}
        numColumns={3}
        contentContainerStyle={s.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão continuar */}
      <View style={s.rodape}>
        <TouchableOpacity
          style={[s.btn, !seleccionada && s.btnDesact]}
          onPress={continuar}
          disabled={!seleccionada}
          accessibilityLabel="Continuar para escolher língua"
        >
          <Text style={s.btnTxt}>
            {seleccionada ? `Continuar com ${seleccionada}` : 'Selecciona uma província'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#F8F9FA' },
  topo:     { alignItems: 'center', paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff',
               borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  logo:     { fontSize: 28, fontWeight: '800', color: '#C8511B', letterSpacing: 2 },
  sub:      { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  titulo:   { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 8 },
  lista:    { padding: 12 },
  item:     { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 12,
               paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center',
               borderWidth: 1.5, borderColor: '#E5E7EB',
               elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
               position: 'relative', minHeight: 80 },
  emoji:    { fontSize: 22, marginBottom: 6 },
  itemNome: { fontSize: 11, fontWeight: '500', color: '#374151',
               textAlign: 'center' },
  check:    { position: 'absolute', top: 6, right: 6, width: 18, height: 18,
               borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rodape:   { padding: 16, backgroundColor: '#fff',
               borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  btn:      { backgroundColor: '#C8511B', borderRadius: 12, padding: 16,
               alignItems: 'center' },
  btnDesact:{ backgroundColor: '#D1D5DB' },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});