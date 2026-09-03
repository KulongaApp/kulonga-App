import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Este botão é o principal do app — laranja angolano, não tem erro
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
  const scheme = useColorScheme();

  const colors = {
    primario: { bg: '#C8511B', text: '#FFFFFF', border: '#C8511B' },
    secundario: { bg: '#1D5C8A', text: '#FFFFFF', border: '#1D5C8A' },
    perigo: { bg: '#DC2626', text: '#FFFFFF', border: '#DC2626' },
    fantasma: { bg: 'transparent', text: '#C8511B', border: '#C8511B' },
  } as const;

  const selected = colors[variante];

  const sizeStyle = tamanhos[tamanho];

  return (
    <TouchableOpacity
      accessibilityLabel={`Botão ${titulo}`}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={desactivado || carregando}
      style={[
        styles.button,
        {
          backgroundColor: selected.bg,
          borderColor: selected.border,
          opacity: desactivado ? 0.6 : 1,
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
    borderRadius: 8,
    borderWidth: 1,
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
