// Usamos o `expo-router` como entrada única do app.
// Para evitar conflitos, re-exportamos o entry do `expo-router` directamente.
// Isto substitui o comportamento anterior de `registerRootComponent`.
export { default } from 'expo-router/entry';
