import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Rota = {
  nome: string;
  icone: string;
  rota: string;
  badge?: number;
};

type Props = {
  perfil: 'professor' | 'encarregado' | 'secretaria';
  rotas: Rota[];
};

export default function TabBar({ perfil, rotas }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const rotaActiva = (rota: string) =>
    pathname === rota || pathname.startsWith(`${rota}/`);

  return (
    <View style={styles.container}>
      {rotas.map((item) => {
        const active = rotaActiva(item.rota);
        return (
          <TouchableOpacity
            key={item.rota}
            style={styles.button}
            onPress={() => router.push(item.rota as any)}
            accessibilityLabel={`Ir para ${item.nome}`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icone as any}
              size={22}
              color={active ? '#C8511B' : '#9CA3AF'}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{item.nome}</Text>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    height: 60,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    alignItems: 'center',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  labelActive: {
    color: '#C8511B',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 16,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
