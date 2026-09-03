import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, useColorScheme, View } from 'react-native';

// Layout do auth: fundo branco / dark mode escuro
export default function AuthLayout() {
  const scheme = useColorScheme();
  const backgroundColor = scheme === 'dark' ? '#0f172a' : '#ffffff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}> 
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
