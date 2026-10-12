import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Input controlado com label e estado de erro
type Props = {
  label: string;
  placeholder?: string;
  valor: string;
  onMudar: (texto: string) => void;
  erro?: string;
  seguro?: boolean;
  teclado?: KeyboardTypeOptions;
  icone?: string;
  desactivado?: boolean;
} & TextInputProps;

export default function Input({
  label,
  placeholder,
  valor,
  onMudar,
  erro,
  seguro,
  teclado,
  icone,
  desactivado,
  ...rest
}: Props) {
  const [focado, setFocado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const borderColor = erro ? '#DC2626' : focado ? '#C8511B' : '#D1D5DB';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor }]}> 
        {icone ? (
          <View style={styles.iconLeft}>
            <Ionicons name={icone as any} size={18} color={borderColor} />
          </View>
        ) : null}
        <TextInput
          {...rest}
          accessibilityLabel={`Campo ${label}`}
          style={styles.input}
          placeholder={placeholder}
          value={valor}
          onChangeText={onMudar}
          secureTextEntry={seguro && !mostrarSenha}
          keyboardType={teclado}
          placeholderTextColor="#9CA3AF"
          autoCapitalize={rest.autoCapitalize ?? (teclado === 'email-address' ? 'none' : 'sentences')}
          editable={!desactivado}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
        />
        {seguro ? (
          <TouchableOpacity
            onPress={() => setMostrarSenha((visivel) => !visivel)}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
            hitSlop={10}
            style={styles.toggleSenha}
          >
            <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={19} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
      </View>
      {erro ? <Text style={styles.error}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { marginBottom: 7, fontWeight: '700', color: '#1F2937', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 50,
    borderRadius: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  iconLeft: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, color: '#111827', fontSize: 16 },
  toggleSenha: { padding: 6, marginLeft: 4 },
  error: { color: '#B91C1C', marginTop: 6, fontSize: 13, lineHeight: 18 },
});
