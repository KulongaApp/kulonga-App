export type Professor = {
  id: string;
  nome: string;
  telefone: string;
};

export type NotaTrimestre = {
  trimestre: 1 | 2 | 3;
  valor: number;
};

export type Disciplina = {
  id: string;
  nome: string;
  professor: Professor;
  notas: NotaTrimestre[];
};

export type Coordenador = {
  id: string;
  nome: string;
  telefone: string;
  coordenador: true;
};

export type Aluno = {
  id: string;
  nomeCompleto: string;
  fotoUrl: string;
  curso: string;
  turma: string;
  periodo: string;
  anoLetivo: string;
  coordenador: Coordenador;
  disciplinas: Disciplina[];
};

export const aluno: Aluno = {
  id: 'aluno-001',
  nomeCompleto: 'Ana Maria Damião',
  fotoUrl: 'https://i.pravatar.cc/150?img=3',
  curso: 'Ciências e Tecnologia',
  turma: '10ªA',
  periodo: 'Manhã',
  anoLetivo: '2025',
  coordenador: {
    id: 'coord-001',
    nome: 'Prof. António Sebastião',
    telefone: '+244 923 000 001',
    coordenador: true,
  },
  disciplinas: [
    {
      id: 'd-001',
      nome: 'Matemática',
      professor: { id: 'p-001', nome: 'Prof. José Neto', telefone: '+244 923 100 001' },
      notas: [
        { trimestre: 1, valor: 16 },
        { trimestre: 2, valor: 15 },
        { trimestre: 3, valor: 17 },
      ],
    },
    {
      id: 'd-002',
      nome: 'Física',
      professor: { id: 'p-002', nome: 'Prof. Carla Mbanze', telefone: '+244 923 100 002' },
      notas: [
        { trimestre: 1, valor: 14 },
        { trimestre: 2, valor: 16 },
        { trimestre: 3, valor: 15 },
      ],
    },
    {
      id: 'd-003',
      nome: 'Química',
      professor: { id: 'p-003', nome: 'Prof. Raul Fontes', telefone: '+244 923 100 003' },
      notas: [
        { trimestre: 1, valor: 15 },
        { trimestre: 2, valor: 14 },
        { trimestre: 3, valor: 16 },
      ],
    },
    {
      id: 'd-004',
      nome: 'Português',
      professor: { id: 'p-004', nome: 'Prof. Teresa Muxima', telefone: '+244 923 100 004' },
      notas: [
        { trimestre: 1, valor: 17 },
        { trimestre: 2, valor: 17 },
        { trimestre: 3, valor: 18 },
      ],
    },
    {
      id: 'd-005',
      nome: 'História',
      professor: { id: 'p-005', nome: 'Prof. Miguel Chaleia', telefone: '+244 923 100 005' },
      notas: [
        { trimestre: 1, valor: 13 },
        { trimestre: 2, valor: 14 },
        { trimestre: 3, valor: 15 },
      ],
    },
    {
      id: 'd-006',
      nome: 'Inglês',
      professor: { id: 'p-006', nome: 'Prof. Luísa Nzinga', telefone: '+244 923 100 006' },
      notas: [
        { trimestre: 1, valor: 14 },
        { trimestre: 2, valor: 15 },
        { trimestre: 3, valor: 14 },
      ],
    },
  ],
};

export const alunoMock = aluno;
