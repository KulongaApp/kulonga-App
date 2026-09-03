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
          accessibilityLabel={`Campo ${label}`}
          style={styles.input}
          placeholder={placeholder}
          value={valor}
          onChangeText={onMudar}
          secureTextEntry={seguro}
          keyboardType={teclado}
          editable={!desactivado}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          {...rest}
        />
      </View>
      {erro ? <Text style={styles.error}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  iconLeft: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10 },
  error: { color: '#DC2626', marginTop: 6 },
});
