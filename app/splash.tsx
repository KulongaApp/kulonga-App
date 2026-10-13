import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CORES } from '../constants/marca';

export default function Splash() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      (async () => {
        try {
          const { supabase } = await import('../services/supabase');
          const { verificarSessao } = await import('../services/auth');
          const sess = await verificarSessao();
          if (sess.activa && sess.papel) {
            await AsyncStorage.setItem('kulonga_sessao_activa', 'true');
            await AsyncStorage.setItem('kulonga_papel_activo', sess.papel);
            if (sess.papel === 'encarregado') router.replace('/(encarregado)' as any);
            else if (sess.papel === 'professor') router.replace('/(professor)' as any);
            else if (sess.papel === 'secretaria') router.replace('/(secretaria)' as any);
            else if (sess.papel === 'aluno') router.replace('/(aluno)' as any);
            else router.replace('/(auth)/escolher-perfil' as any);
            return;
          }
        } catch {}
        const feito = await AsyncStorage.getItem('kulonga_onboarding_feito');
        if (feito === 'true') { router.replace('/(auth)/escolher-perfil' as any); return; }
        router.replace('/(onboarding)/provincia' as any);
      })();
    }, 2500);
    return () => clearTimeout(timer);
  }, [opacity, translateY, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.centro}>
          <Image source={require('../assets/icon.png')} style={styles.icon} />
          <Text style={styles.logo}>KULONGA</Text>
          <View style={styles.line} />
          <Text style={styles.tagline}>A escola no teu bolso</Text>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.by}>Kulonga — Educação</Text>
          <Text style={styles.copyright}>© {new Date().getFullYear()} Kulonga</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CORES.azul },
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 120, height: 120 },
  logo: { color: CORES.branco, fontSize: 32, fontWeight: '800', marginTop: 24, letterSpacing: 6 },
  line: { marginTop: 8, width: 48, height: 2, backgroundColor: CORES.ouro, borderRadius: 1 },
  tagline: { marginTop: 12, color: CORES.azulClaro, fontSize: 14, fontStyle: 'italic' },
  rodape: { alignItems: 'center' },
  by: { color: CORES.azulClaro, fontSize: 13, marginBottom: 4 },
  copyright: { color: CORES.azulClaro, fontSize: 11, opacity: 0.7 },
});
