import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Mostra a nota com cor conforme o valor
type Props = {
  valor: number | null;
  mostrarMax?: boolean;
  tamanho?: 'pequeno' | 'medio' | 'grande';
};

export default function NotaBadge({ valor, mostrarMax = true, tamanho = 'medio' }: Props) {
  let color = '#9CA3AF';
  if (valor === null) color = '#9CA3AF';
  else if (valor >= 14) color = '#16A34A';
  else if (valor >= 10) color = '#D97706';
  else color = '#DC2626';

  const size = tamanho === 'pequeno' ? 36 : tamanho === 'grande' ? 52 : 44;

  return (
    <View style={[styles.container, { borderColor: color, width: size, height: size, borderRadius: size / 2 }]}> 
      <Text style={[styles.text, { color }]}>{valor === null ? '-' : valor}</Text>
      {mostrarMax && <Text style={[styles.max, { color }]}>/20</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '700', fontSize: 16 },
  max: { fontSize: 10 },
});
