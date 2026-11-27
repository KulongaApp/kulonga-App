import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROVINCIAS, Provincia } from '../constants/cores-regionais';

const CHAVE_PROVINCIA = 'kulonga_provincia';

export const useTema = () => {
  const [provinciaActual, setProvinciaActual] = useState<string>('Luanda');
  const [cores, setCores] = useState<Provincia>(PROVINCIAS.Luanda);

  useEffect(() => {
    const carregarProvincia = async () => {
      try {
        const saved = await AsyncStorage.getItem(CHAVE_PROVINCIA);
        const provincia = saved || 'Luanda';
        setProvinciaActual(provincia);
        setCores(PROVINCIAS[provincia] ?? PROVINCIAS.Luanda);
      } catch (error) {
        setProvinciaActual('Luanda');
        setCores(PROVINCIAS.Luanda);
      }
    };

    carregarProvincia();
  }, []);

  const setProvincia = useCallback(async (nome: string) => {
    const novaProvincia = PROVINCIAS[nome] ? nome : 'Luanda';
    try {
      await AsyncStorage.setItem(CHAVE_PROVINCIA, novaProvincia);
      setProvinciaActual(novaProvincia);
      setCores(PROVINCIAS[novaProvincia]);
    } catch (error) {
      // TODO: guardar a província no Supabase quando o backend estiver pronto
      setProvinciaActual('Luanda');
      setCores(PROVINCIAS.Luanda);
    }
  }, []);

  return { cores, setProvincia, provinciaActual };
};
