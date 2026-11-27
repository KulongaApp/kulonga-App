import { useEffect } from 'react';
import '../lib/alert-web';
import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

// Ecrã de erro da marca: nunca mostra detalhes técnicos ao utilizador
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={erroStyles.container}>
      <Image source={require('../assets/logo-mark.png')} style={erroStyles.logo} accessibilityLabel="Kulonga" />
      <Text style={erroStyles.titulo}>Algo correu mal</Text>
      <Text style={erroStyles.texto}>Os teus dados estão seguros. Tenta outra vez; se continuar, fala com a secretaria da escola.</Text>
      <TouchableOpacity onPress={() => retry()} accessibilityRole="button" accessibilityLabel="Tentar outra vez" style={erroStyles.botao}>
        <Text style={erroStyles.botaoTexto}>Tentar outra vez</Text>
      </TouchableOpacity>
    </View>
  );
}

const erroStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F6EFE3' },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#0B1F33', textAlign: 'center' },
  texto: { fontSize: 16, lineHeight: 24, color: '#55667A', textAlign: 'center', marginTop: 8, marginBottom: 24, maxWidth: 360 },
  botao: { backgroundColor: '#123C69', minHeight: 48, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
