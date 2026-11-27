// No navegador (react-native-web) o Alert.alert do React Native não faz nada:
// mensagens de sucesso, erros e confirmações ficam invisíveis.
// Este ficheiro dá-lhe um comportamento real só na web, usando as caixas do navegador.
// No telemóvel (Android/iOS) nada muda.
import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const w: any = window;
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const texto = [title, message].filter(Boolean).join('\n\n');
    const lista = buttons ?? [];

    // Sem botões ou com um só botão: apenas informar
    if (lista.length <= 1) {
      w.alert(texto);
      lista[0]?.onPress?.();
      return;
    }

    // Dois ou mais botões: perguntar. "Cancelar" = botão com style 'cancel'.
    const cancelar = lista.find((b) => b.style === 'cancel');
    const accoes = lista.filter((b) => b !== cancelar);
    const principal = accoes.find((b) => b.style === 'destructive') ?? accoes[accoes.length - 1];
    if (w.confirm(texto)) principal?.onPress?.();
    else cancelar?.onPress?.();
  };
}
