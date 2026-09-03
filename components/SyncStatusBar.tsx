import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

// Barra que mostra status de sincronização no topo
type Props = {
  isOnline: boolean;
  pendentes?: number;
  sincronizando?: boolean;
};

export default function SyncStatusBar({ isOnline, pendentes = 0, sincronizando = false }: Props) {
  const visible = !(isOnline && pendentes === 0 && !sincronizando);
  const opacity = new Animated.Value(visible ? 1 : 0);

  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [isOnline, pendentes, sincronizando]);

  if (!visible) return null;

  let background = '#16A34A';
  let text = '✓ Sincronizado';

  if (!isOnline) {
    background = '#C8711B';
    text = `Sem internet — ${pendentes} notas por sincronizar`;
  } else if (pendentes > 0 || sincronizando) {
    background = '#1D5C8A';
    text = `A sincronizar ${pendentes} notas...`;
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: background, opacity }]}> 
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '600' },
});
