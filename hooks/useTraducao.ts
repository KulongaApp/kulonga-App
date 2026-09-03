import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pt from '../constants/traducoes/pt.json';
import umbundu from '../constants/traducoes/umbundu.json';
import kimbundu from '../constants/traducoes/kimbundu.json';

const CHAVE_LINGUA = 'kulonga_lingua';

type LinguaSuportada = 'pt' | 'umbundu' | 'kimbundu';

type Traducao = Record<string, string>;

const dicionario: Record<LinguaSuportada, Traducao> = {
  pt,
  umbundu,
  kimbundu,
};

export const useTraducao = () => {
  const [linguaActual, setLinguaActual] = useState<LinguaSuportada>('pt');
  const [traducoes, setTraducoes] = useState<Traducao>(pt);

  useEffect(() => {
    const carregarLingua = async () => {
      try {
        const saved = await AsyncStorage.getItem(CHAVE_LINGUA);
        const lingua = (saved as LinguaSuportada) || 'pt';
        setLinguaActual(lingua);
        setTraducoes(dicionario[lingua] ?? pt);
      } catch (error) {
        setLinguaActual('pt');
        setTraducoes(pt);
      }
    };

    carregarLingua();
  }, []);

  const setLingua = useCallback(async (lingua: string) => {
    const linguaCorreta = ['pt', 'umbundu', 'kimbundu'].includes(lingua)
      ? (lingua as LinguaSuportada)
      : 'pt';

    try {
      await AsyncStorage.setItem(CHAVE_LINGUA, linguaCorreta);
      setLinguaActual(linguaCorreta);
      setTraducoes(dicionario[linguaCorreta]);
    } catch (error) {
      // Aqui não fazemos nada além de manter a língua actual
    }
  }, []);

  const t = useCallback(
    (chave: string) => {
      return traducoes[chave] ?? chave;
    },
    [traducoes]
  );

  return { t, setLingua, linguaActual };
};
