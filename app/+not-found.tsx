import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

// Página mostrada quando o endereço não existe
export default function NaoEncontrado() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Image source={require('../assets/logo-mark.png')} style={styles.logo} accessibilityLabel="Kulonga" />
        <Text style={styles.titulo}>Esta página não existe</Text>
        <Text style={styles.texto}>O endereço pode estar errado ou a página mudou de sítio.</Text>
        <Link href={'/' as any} style={styles.botao}>Voltar ao início</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F6EFE3' },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#0B1F33', textAlign: 'center' },
  texto: { fontSize: 16, lineHeight: 24, color: '#55667A', textAlign: 'center', marginTop: 8, marginBottom: 24, maxWidth: 360 },
  botao: { backgroundColor: '#123C69', color: '#FFFFFF', fontSize: 16, fontWeight: '600', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, overflow: 'hidden' },
});
