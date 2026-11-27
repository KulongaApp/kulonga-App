// Identidade visual Kulonga. Fonte única das cores e medidas da marca.
// Usar estes valores em código novo; o manual completo está em docs/identidade-visual.md

export const MARCA = {
  cores: {
    azulQuadro: '#123C69', // marca, botões, cabeçalhos
    azulMedio: '#17497E', // secções, estados activos
    azulProfundo: '#0B2A4A', // menu lateral
    ouro: '#E0A526', // destaque; nunca como texto sobre fundo claro
    ouroTinta: '#8F5F00', // ouro para texto e bordas sobre fundo claro
    mulemba: '#1A7358', // aprovado, sucesso
    coral: '#B83F28', // alertas, faltas, dívidas
    cacimbo: '#F6EFE3', // fundo dos ecrãs
    papel: '#FFFBF3', // cartões
    tinta: '#0B1F33', // texto principal
    texto2: '#55667A', // texto secundário
    linha: '#E3DACB', // bordas e separadores
    geloAzul: '#E4EEF8', // fundo de item activo
  },
  raios: { primario: 24, secundario: 8, cartao: 16, botao: 12 },
  alvoToque: { telemovel: 48, pc: 40 },
  slogan: 'A escola no teu bolso',
} as const;

// Cor de uma nota de 0 a 20 (sempre acompanhada de número, nunca só cor)
export function corDaNota(valor: number | null): string {
  if (valor === null) return '#9CA3AF';
  if (valor >= 14) return MARCA.cores.mulemba;
  if (valor >= 10) return '#D97706';
  return MARCA.cores.coral;
}
