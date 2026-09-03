import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { validarTokenEncarregado } from '../../services/auth';

// O pai não pode errar o código — por isso as caixas são grandes e claras
export default function TokenEncarregado() {
  const router = useRouter();
  const [digitos, setDigitos] = useState<string[]>(['', '', '', '', '', '']);
  const refs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-foco suave na primeira caixa
    const t = setTimeout(() => refs.current[0]?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  function animarErro() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  function handleDigito(texto: string, index: number) {
    const num = texto.replace(/[^0-9]/g, '');
    const novos = [...digitos];
    novos[index] = num;
    setDigitos(novos);
    if (num && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleApagar(e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digitos[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  const codigoCompleto = digitos.join('');
  const estaCompleto = codigoCompleto.length === 6;

  async function validar() {
    setLoading(true);
    setErro('');
    const res = await validarTokenEncarregado(codigoCompleto);
    setLoading(false);

    if (res.valido && res.alunoId) {
      await AsyncStorage.setItem('kulonga_papel_activo', 'encarregado');
      await AsyncStorage.setItem('kulonga_papeis', JSON.stringify(['encarregado']));
      await AsyncStorage.setItem('kulonga_aluno_id', res.alunoId);
      router.replace('/(encarregado)' as any);
      return;
    }

    setErro(res.erro ?? 'Código inválido. Verifica com a secretaria da escola.');
    animarErro();
    setDigitos(['', '', '', '', '', '']);
    setTimeout(() => refs.current[0]?.focus(), 100);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={24} color="#1D5C8A" />
            </TouchableOpacity>
          </View>

          <View style={styles.center}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.title}>Código de Acesso</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>
                Insere o código de 6 dígitos que a escola te entregou no acto da matrícula
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Áudio', 'Função de áudio em breve')}
                style={styles.audioBtn}
                accessibilityLabel="Ouvir instruções"
              >
                <Ionicons name="volume-high-outline" size={18} color="#C8511B" />
              </TouchableOpacity>
            </View>

            {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

            <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {digitos.map((d, i) => {
                const tem = !!d;
                const borderColor = erro ? '#DC2626' : tem ? '#C8511B' : '#E5E7EB';
                const backgroundColor = tem ? '#FEF3EC' : '#FFFFFF';
                return (
                  <TextInput
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    value={d}
                    onChangeText={(t) => handleDigito(t, i)}
                    onKeyPress={(e) => handleApagar(e, i)}
                    style={[styles.otpBox, { borderColor, backgroundColor }]}
                    keyboardType="numeric"
                    maxLength={1}
                    textContentType="oneTimeCode"
                    returnKeyType={i === 5 ? 'done' : 'next'}
                  />
                );
              })}
            </Animated.View>

            <View style={styles.separatorRow}>
              <View style={styles.sepLine} />
              <Text style={styles.sepText}>ou</Text>
              <View style={styles.sepLine} />
            </View>

            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() =>
                Alert.alert('QR Code', 'Esta funcionalidade estará disponível em breve.\nUsa o código de 6 dígitos por agora.')
              }
            >
              <Ionicons name="qr-code-outline" size={20} color="#1D5C8A" />
              <Text style={styles.qrText}>Escanear QR Code da escola</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.validateBtn, { backgroundColor: estaCompleto ? '#C8511B' : '#D1D5DB', opacity: estaCompleto ? 1 : 0.5 }]}
              disabled={!estaCompleto || loading}
              onPress={validar}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.validateText}>Validar Código</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>Não tens código? Fala com a secretaria da escola.</Text>

            <TouchableOpacity onPress={() => router.replace('/(onboarding)/provincia' as any)}>
              <Text style={styles.backStart}>Voltar ao início</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 100 },
  headerRow: { height: 36, justifyContent: 'center' },
  center: { alignItems: 'center', marginTop: 8 },
  logo: { width: 52, height: 52, marginTop: 8 },
  title: { marginTop: 12, fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginHorizontal: 8 },
  subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginHorizontal: 8, flex: 1 },
  audioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE9D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  otpRow: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
  otpBox: {
    width: 46,
    height: 58,
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, width: '100%' },
  sepLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  sepText: { color: '#9CA3AF', paddingHorizontal: 12 },
  qrBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#1D5C8A',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: { color: '#1D5C8A', marginLeft: 8 },
  validateBtn: {
    marginTop: 18,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  validateText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  erroText: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginTop: 8 },
  footerText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 16 },
  backStart: { color: '#1D5C8A', fontSize: 13, textAlign: 'center', marginTop: 8 },
});
