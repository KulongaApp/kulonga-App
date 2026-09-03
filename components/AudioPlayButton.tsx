import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

// Botão circular para ler texto usando expo-speech
type Props = {
  texto: string;
  lingua?: 'pt-PT' | 'pt-BR';
  tamanho?: number;
  cor?: string;
};

export default function AudioPlayButton({ texto, lingua = 'pt-PT', tamanho = 44, cor = '#C8511B' }: Props) {
  const [aLer, setALer] = useState(false);

  const handlePress = () => {
    if (aLer) {
      Speech.stop();
      setALer(false);
      return;
    }

    Speech.speak(texto, { language: lingua });
    setALer(true);
    // Não há callback de fim universal aqui — em produção, escutar eventos é melhor
    // TODO: gerir melhor o estado quando a leitura termina
  };

  return (
    <TouchableOpacity accessibilityLabel={`Ler texto`} onPress={handlePress} style={[styles.button, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      <View>
        <Ionicons name={aLer ? 'stop-circle-outline' : 'volume-high-outline'} size={tamanho * 0.6} color={cor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
