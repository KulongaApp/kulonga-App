export type ProfessorMock = {
  id: string;
  nome: string;
  telefone: string;
  disciplina: string;
  coordenador: boolean;
};

export const professores: ProfessorMock[] = [
  {
    id: 'p-001',
    nome: 'Prof. José Neto',
    telefone: '+244 923 100 001',
    disciplina: 'Matemática',
    coordenador: false,
  },
  {
    id: 'p-002',
    nome: 'Prof. Carla Mbanze',
    telefone: '+244 923 100 002',
    disciplina: 'Física',
    coordenador: false,
  },
  {
    id: 'p-003',
    nome: 'Prof. Raul Fontes',
    telefone: '+244 923 100 003',
    disciplina: 'Química',
    coordenador: false,
  },
  {
    id: 'p-004',
    nome: 'Prof. Teresa Muxima',
    telefone: '+244 923 100 004',
    disciplina: 'Português',
    coordenador: false,
  },
  {
    id: 'p-005',
    nome: 'Prof. Miguel Chaleia',
    telefone: '+244 923 100 005',
    disciplina: 'História',
    coordenador: true,
  },
  {
    id: 'p-006',
    nome: 'Prof. Luísa Nzinga',
    telefone: '+244 923 100 006',
    disciplina: 'Inglês',
    coordenador: false,
  },
];
