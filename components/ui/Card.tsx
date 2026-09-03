import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

// Aqui guardamos a aparência dos cartões, usados por várias telas
type Props = {
  children: React.ReactNode;
  estilo?: ViewStyle;
  sombra?: boolean;
  bordaEsquerda?: string;
  onPress?: (e?: GestureResponderEvent) => void;
};

export default function Card({ children, estilo, sombra = true, bordaEsquerda, onPress }: Props) {
  const scheme = useColorScheme();
  const backgroundColor = scheme === 'dark' ? '#1F2937' : '#FFFFFF';

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      accessibilityLabel={onPress ? 'Card clicável' : 'Card'}
      style={[
        styles.card,
        { backgroundColor },
        sombra ? styles.shadow : undefined,
        bordaEsquerda ? { borderLeftWidth: 4, borderLeftColor: bordaEsquerda } : undefined,
        estilo,
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
  },
  shadow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
