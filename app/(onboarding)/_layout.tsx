import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CORES } from '../../constants/marca';

// Layout do onboarding: fundo claro fixo.
// A área segura é tratada por cada ecrã (react-native-safe-area-context),
// por isso não se usa SafeAreaView aqui — evita margens duplicadas.
// Antes tinha fundo escuro em dark mode, o que deixava os títulos (a preto) ilegíveis.
export default function OnboardingLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.branco },
});
