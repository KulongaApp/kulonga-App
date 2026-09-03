import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Filtro simples para escolher trimestre com animação de transição
type Props = {
  seleccionado: 1 | 2 | 3;
  onSeleccionar: (trimestre: 1 | 2 | 3) => void;
  cor?: string;
};

export default function TrimestreFilter({ seleccionado, onSeleccionar, cor = '#C8511B' }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: seleccionado, duration: 200, useNativeDriver: false }).start();
  }, [seleccionado]);

  const Botao = ({ n, label }: { n: 1 | 2 | 3; label: string }) => {
    const ativo = seleccionado === n;
    return (
      <TouchableOpacity accessibilityLabel={`Selecionar ${label}`} style={[styles.button, ativo ? { backgroundColor: cor } : undefined]} onPress={() => onSeleccionar(n)}>
        <Text style={[styles.text, ativo ? { color: '#fff' } : { color: '#6B7280' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Botao n={1} label={'1º Trim.'} />
      <Botao n={2} label={'2º Trim.'} />
      <Botao n={3} label={'3º Trim.'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  button: { flex: 1, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  text: { fontWeight: '600' },
});
