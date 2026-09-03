import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Badge from './ui/Badge';

// Mostra contacto do professor com botão para ligar
type Props = {
  nome: string;
  telefone: string;
  disciplina?: string;
  coordenador?: boolean;
  destaque?: boolean;
};

function iniciais(nome: string) {
  return nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfessorContactCard({ nome, telefone, disciplina, coordenador, destaque }: Props) {
  const handleLigar = () => {
    Linking.openURL(`tel:${telefone}`);
  };

  return (
    <View style={[styles.container, destaque ? { borderLeftWidth: 4, borderLeftColor: '#1D5C8A' } : undefined]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{iniciais(nome)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nome}>{nome}</Text>
        {disciplina ? <Text style={styles.disciplina}>{disciplina}</Text> : null}
      </View>
      <View style={styles.actions}>
        {coordenador ? <Badge texto="Coordenador" cor="#1D5C8A" solido /> : null}
        <TouchableOpacity accessibilityLabel={`Ligar para ${nome}`} onPress={handleLigar} style={styles.callButton}>
          <Text style={styles.callText}>Ligar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D5C8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  info: { flex: 1 },
  nome: { fontWeight: '700' },
  disciplina: { color: '#6B7280' },
  actions: { alignItems: 'flex-end' },
  callButton: { marginTop: 6, backgroundColor: '#C8511B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  callText: { color: '#fff', fontWeight: '700' },
});
