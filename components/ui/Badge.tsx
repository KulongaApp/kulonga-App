import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Badge simples para destacar informação pequena
type Props = {
  texto: string;
  cor?: string;
  tamanho?: 'pequeno' | 'medio';
  solido?: boolean;
};

export default function Badge({ texto, cor = '#C8511B', tamanho = 'medio', solido = false }: Props) {
  const padding = tamanho === 'pequeno' ? 4 : 6;
  const fontSize = tamanho === 'pequeno' ? 12 : 14;

  return (
    <View
      accessibilityLabel={`Badge ${texto}`}
      style={[
        styles.container,
        { borderColor: cor, paddingVertical: padding, paddingHorizontal: padding * 2 },
        solido ? { backgroundColor: cor } : { backgroundColor: 'transparent' },
      ]}
    >
      <Text style={[styles.text, { color: solido ? '#fff' : cor, fontSize }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
