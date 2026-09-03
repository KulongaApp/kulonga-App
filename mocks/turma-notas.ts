// Sistema de avaliação angolano real
// Custódio: este ficheiro reflecte exactamente como
// funciona o lançamento de notas nas escolas angolanas

export type Genero = 'M' | 'F';

// Trimestres e os seus meses
export const TRIMESTRES = {
  1: { nome: '1º Trimestre', meses: ['Setembro', 'Outubro', 'Novembro'] },
  2: { nome: '2º Trimestre', meses: ['Janeiro', 'Fevereiro', 'Março'] },
  3: { nome: '3º Trimestre', meses: ['Abril', 'Maio', 'Junho'] },
};

// Dezembro é sempre o mês das provas (PT)
export const MES_PROVAS = 'Dezembro';

export interface AvaliacaoContinua {
  id: string;
  // Qual mês (Setembro, Outubro, Novembro, etc.)
  mes: string;
  // Número da avaliação nesse mês (1, 2, 3...)
  numero: number;
  valor: number | null; // 0-20
}

export interface NotaAluno {
  alunoId: string;
  // Avaliações contínuas por mês
  avaliacoes: AvaliacaoContinua[];
  // Prova Trimestral (PT) — lançada em Dezembro
  pt: number | null;
}

// MAC = média de TODAS as AC do trimestre
export function calcularMAC(
  avaliacoes: AvaliacaoContinua[]
): number | null {
  const comValor = avaliacoes.filter(a => a.valor !== null);
  if (comValor.length === 0) return null;
  const soma = comValor.reduce((s, a) => s + a.valor!, 0);
  return Math.round((soma / comValor.length) * 10) / 10;
}

// MF = (MAC + PT) ÷ 2
export function calcularMF(
  mac: number | null,
  pt: number | null
): number | null {
  if (mac === null || pt === null) return null;
  return Math.round(((mac + pt) / 2) * 10) / 10;
}

export function classificacao(mf: number): string {
  if (mf >= 18) return 'Muito Bom';
  if (mf >= 14) return 'Bom';
  if (mf >= 10) return 'Suficiente';
  return 'Mau';
}

export interface AlunoTurma {
  id: string;
  numero: string;
  nome: string;
  genero: Genero;
}

// TODO: carregar do Supabase:
// SELECT alunos.* FROM alunos
// WHERE turma_id = turmaId
// ORDER BY numero ASC
export const turmaMock = {
  id: 't1',
  nome: '10ªA',
  disciplina: 'Matemática',
  anoLetivo: '2025',
  alunos: [
    { id: 'a1', numero: '001', nome: 'João Manuel Sebastião',   genero: 'M' as Genero },
    { id: 'a2', numero: '002', nome: 'Maria da Conceição Lopes', genero: 'F' as Genero },
    { id: 'a3', numero: '003', nome: 'Pedro António Kiala',      genero: 'M' as Genero },
    { id: 'a4', numero: '004', nome: 'Ana Beatriz Nzinga',       genero: 'F' as Genero },
    { id: 'a5', numero: '005', nome: 'Carlos Eduardo Mbanza',    genero: 'M' as Genero },
    { id: 'a6', numero: '006', nome: 'Filomena José Savimbi',    genero: 'F' as Genero },
    { id: 'a7', numero: '007', nome: 'António Manuel Kiala',     genero: 'M' as Genero },
    { id: 'a8', numero: '008', nome: 'Rosa Maria Neto',          genero: 'F' as Genero },
    { id: 'a9', numero: '009', nome: 'Domingos Paulo Lopes',     genero: 'M' as Genero },
    { id: 'a10',numero: '010', nome: 'Esperança Joaquina Silva', genero: 'F' as Genero },
  ] as AlunoTurma[],
};