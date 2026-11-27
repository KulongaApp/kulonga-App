import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  titulo: string;
  onPress: (e?: GestureResponderEvent) => void;
  variante: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  tamanho?: 'pequeno' | 'medio' | 'grande';
  carregando?: boolean;
  desactivado?: boolean;
  iconeEsquerda?: string;
  iconeDireita?: string;
};

const tamanhos = {
  pequeno: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  medio: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 16 },
  grande: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 18 },
};

export default function Button({
  titulo,
  onPress,
  variante,
  tamanho = 'medio',
  carregando,
  desactivado,
  iconeEsquerda,
  iconeDireita,
}: Props) {
  const colors = {
    primario: { bg: '#123C69', text: '#FFFFFF', border: '#123C69' },
    secundario: { bg: '#0B2A4A', text: '#FFFFFF', border: '#0B2A4A' },
    perigo: { bg: '#B83F28', text: '#FFFFFF', border: '#B83F28' },
    fantasma: { bg: 'transparent', text: '#123C69', border: '#123C69' },
  } as const;

  const selected = colors[variante];

  const sizeStyle = tamanhos[tamanho];

  return (
    <TouchableOpacity
      accessibilityLabel={`Botão ${titulo}`}
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      disabled={desactivado || carregando}
      style={[
        styles.button,
        {
          backgroundColor: selected.bg,
          borderColor: selected.border,
          opacity: desactivado || carregando ? 0.6 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={selected.text} />
      ) : (
        <>
          {iconeEsquerda ? (
            <View style={styles.iconLeft}>
              <Ionicons name={iconeEsquerda as any} size={18} color={selected.text} />
            </View>
          ) : null}
          <Text style={[styles.text, { color: selected.text, fontSize: sizeStyle.fontSize }]}>{titulo}</Text>
          {iconeDireita ? (
            <View style={styles.iconRight}>
              <Ionicons name={iconeDireita as any} size={18} color={selected.text} />
            </View>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
