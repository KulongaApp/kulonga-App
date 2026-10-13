import React from 'react';
import { Redirect } from 'expo-router';

// Entrada do grupo de autenticação → ecrã de escolha de perfil.
// (Antes era um placeholder "Autenticação / Placeholder para telas de login".)
export default function AuthIndex() {
  return <Redirect href="/(auth)/escolher-perfil" />;
}
