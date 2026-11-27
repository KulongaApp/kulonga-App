import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Página temporária de autenticação
export default function AuthIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Autenticação</Text>
      <Text style={styles.text}>Placeholder para telas de login e autenticação.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 14, color: '#444' },
});
