// Configuração do cliente Supabase para o Kulonga
// Projecto: KulongaApp's Project

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from
  '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iszrvyjmiwshcybccuwz.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QuDZ7Ve4z6oBEkz_V8aJcQ_i22HdqlW';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Guarda a sessão no AsyncStorage do telemóvel
      // para o utilizador não ter de fazer login de novo
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);