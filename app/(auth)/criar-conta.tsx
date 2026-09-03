import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CriarConta() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.voltar}><Ionicons name="arrow-back" size={22} color="#6B7280" /><Text style={s.voltarTxt}>Voltar</Text></TouchableOpacity>
        <Text style={s.logo}>KULONGA</Text>
        <Text style={s.title}>Criar conta</Text>
        <Text style={s.sub}>Escolhe o tipo de conta que queres criar</Text>

        <TouchableOpacity style={s.card} onPress={() => router.push('/(auth)/cadastro-escola' as any)}>
          <Text style={s.icon}>🏫</Text><View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardTitle}>Escola / Direcção</Text><Text style={s.cardDesc}>Registar nova escola — cria o director</Text></View><Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/(auth)/cadastro-professor' as any)}>
          <Text style={s.icon}>👨‍🏫</Text><View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardTitle}>Professor</Text><Text style={s.cardDesc}>Ligação à escola existente</Text></View><Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/(auth)/cadastro-aluno' as any)}>
          <Text style={s.icon}>🎓</Text><View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardTitle}>Aluno</Text><Text style={s.cardDesc}>Ligação à escola existente</Text></View><Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={s.termos}>
          <Text style={s.termosTxt}>Ao criar conta aceitas os <Text style={s.link}>Termos de Uso</Text> e <Text style={s.link}>Política de Privacidade</Text> do Kulonga.</Text>
        </View>

        <View style={s.rodape}><Text style={s.rodapeTxt}>Já tens conta?</Text><TouchableOpacity onPress={() => router.replace('/(auth)/escolher-perfil' as any)}><Text style={s.link}>Entrar</Text></TouchableOpacity></View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  voltarTxt: { color: '#6B7280' },
  logo: { color: '#C8511B', fontWeight: '800', fontSize: 20, textAlign: 'center', marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  sub: { color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#fff' },
  icon: { fontSize: 32 },
  cardTitle: { fontWeight: '800' },
  cardDesc: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  termos: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginTop: 16 },
  termosTxt: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  link: { color: '#1D5C8A', fontWeight: '700' },
  rodape: { marginTop: 24, alignItems: 'center' },
  rodapeTxt: { color: '#6B7280' },
});
