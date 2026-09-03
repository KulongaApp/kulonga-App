import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      (async () => {
        const feito = await AsyncStorage.getItem('kulonga_onboarding_feito');
        const perfil = await AsyncStorage.getItem('kulonga_perfil');
        const sessaoActiva = await AsyncStorage.getItem('kulonga_sessao_activa');
        const papelActivo = await AsyncStorage.getItem('kulonga_papel_activo');

        // Se tem sessão activa, vai directo ao painel
        // sem passar pelo login ou onboarding
        if (sessaoActiva === 'true' && papelActivo) {
          if (papelActivo === 'encarregado') {
            router.replace('/(encarregado)' as any);
          } else if (papelActivo === 'professor') {
            router.replace('/(professor)' as any);
          } else if (papelActivo === 'secretaria') {
            router.replace('/(secretaria)' as any);
          }
          return;
        }

        // Se fez onboarding mas não tem sessão activa
        if (feito === 'true') {
          if (perfil === 'encarregado') {
            router.replace('/(auth)/token-encarregado' as any);
          } else if (perfil === 'professor') {
            router.replace('/(auth)/login-professor' as any);
          } else if (perfil === 'secretaria') {
            router.replace('/(auth)/login-secretaria' as any);
          } else {
            router.replace('/(onboarding)/provincia' as any);
          }
          return;
        }

        // Primeira vez — vai para o onboarding
        router.replace('/(onboarding)/provincia' as any);
      })();
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, translateY, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}> 
        <View style={styles.topo}>
          <Text style={styles.topoText}>KULONGA</Text>
        </View>

        <View style={styles.centro}>
          <Image source={require('../assets/icon.png')} style={styles.icon} />
          <Text style={styles.logo}>KULONGA</Text>
          <View style={styles.line} />
          <Text style={styles.tagline}>A escola no teu bolso</Text>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.by}>by Lukashi</Text>
          <Text style={styles.copyright}>© 2025 Custódio Cahilo</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1D5C8A' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topo: { position: 'absolute', top: 60, alignItems: 'center' },
  topoText: { color: '#fff', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  centro: { alignItems: 'center' },
  icon: { width: 120, height: 120 },
  logo: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 24, letterSpacing: 6 },
  line: { marginTop: 8, width: 48, height: 2, backgroundColor: '#B8922A', borderRadius: 1 },
  tagline: { marginTop: 12, color: '#93C5FD', fontSize: 14, fontStyle: 'italic' },
  rodape: { position: 'absolute', bottom: 40, alignItems: 'center' },
  by: { color: '#5B8FBF', fontSize: 13, marginBottom: 4 },
  copyright: { color: '#3A6A8A', fontSize: 11 },
});
