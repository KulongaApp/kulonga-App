// Identidade visual da Kulonga — fonte única de verdade para as cores.
// Evita a deriva de tons entre ecrãs (havia vários azuis/laranjas diferentes).
export const CORES = {
  // Marca
  azul: '#1D5C8A',
  azulClaro: '#93C5FD',
  azulFraco: '#E6F0FF',
  laranja: '#C8511B',
  laranjaFraco: '#FFF3ED',
  ouro: '#B8922A',

  // Semânticas
  verde: '#16A34A',
  vermelho: '#DC2626',
  aviso: '#B45309',
  avisoFundo: '#FEF3C7',
  info: '#1D4ED8',
  roxo: '#7C3AED',

  // Neutros
  texto: '#111827',
  textoSuave: '#6B7280',
  textoFraco: '#9CA3AF',
  borda: '#E5E7EB',
  fundo: '#F8F9FA',
  branco: '#FFFFFF',
} as const;

// Sombra suave usada nos cartões.
export const SOMBRA_CARTAO = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
