// services/avaliacao.ts
// Domínio puro do sistema de avaliação angolano.
// MAC = média das Avaliações Contínuas (AC)
// PT  = Prova Trimestral
// MF  = (MAC + PT) ÷ 2
//
// Sem dependências de UI nem de dados — só regras. Foi extraído de
// `mocks/turma-notas.ts` para que nenhum ecrã de produção importe mocks.

export type Genero = 'M' | 'F';
export type Trimestre = 1 | 2 | 3;

// Meses de cada trimestre do calendário escolar angolano.
// Dezembro fecha o 1º trimestre (é quando se lança a PT).
export const TRIMESTRES: Record<Trimestre, { nome: string; meses: string[] }> = {
  1: { nome: '1º Trimestre', meses: ['Setembro', 'Outubro', 'Novembro', 'Dezembro'] },
  2: { nome: '2º Trimestre', meses: ['Janeiro', 'Fevereiro', 'Março', 'Abril'] },
  3: { nome: '3º Trimestre', meses: ['Maio', 'Junho', 'Julho'] },
};

/** Mês em que as provas trimestrais são lançadas. */
export const MES_PROVAS = 'Dezembro';

export interface AvaliacaoContinua {
  id: string;
  /** Mês a que pertence (Setembro, Outubro, ...). */
  mes: string;
  /** Número da avaliação dentro do mês (1, 2, 3...). */
  numero: number;
  /** 0–20, ou null se ainda não lançada. */
  valor: number | null;
}

/** Média de todas as AC com valor lançado. */
export function calcularMAC(avaliacoes: AvaliacaoContinua[]): number | null {
  const comValor = avaliacoes.filter((a) => a.valor !== null);
  if (comValor.length === 0) return null;
  const soma = comValor.reduce((s, a) => s + a.valor!, 0);
  return Math.round((soma / comValor.length) * 10) / 10;
}

/** Média Final: (MAC + PT) ÷ 2. Null se faltar qualquer uma. */
export function calcularMF(mac: number | null, pt: number | null): number | null {
  if (mac === null || pt === null) return null;
  return Math.round(((mac + pt) / 2) * 10) / 10;
}

/** Classificação qualitativa da média final (escala angolana). */
export function classificacao(mf: number): string {
  if (mf >= 18) return 'Muito Bom';
  if (mf >= 14) return 'Bom';
  if (mf >= 10) return 'Suficiente';
  return 'Mau';
}

/** Cor semântica para uma nota de 0–20 (verde / âmbar / vermelho). */
export function corNota(valor: number | null): string {
  if (valor === null) return '#9CA3AF';
  if (valor >= 14) return '#16A34A';
  if (valor >= 10) return '#D97706';
  return '#DC2626';
}

/** Converte texto de input ("14.5") numa nota válida ou null. */
export function notaDeTexto(valor: string | undefined | null): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = parseFloat(valor);
  return isNaN(n) ? null : n;
}
