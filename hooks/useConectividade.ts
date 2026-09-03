import { useEffect, useState } from 'react';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';

export const useConectividade = () => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [tipo, setTipo] = useState<string>('unknown');

  useEffect(() => {
    // Aqui escutamos as mudanças na conectividade do dispositivo
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      setTipo(state.type ?? 'unknown');
    });

    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
      setTipo(state.type ?? 'unknown');
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, tipo };
};
