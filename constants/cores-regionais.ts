export type Provincia = {
  nome: string;
  primaria: string;
  secundaria: string;
  lingua: string;
};

export const PROVINCIAS: Record<string, Provincia> = {
  Luanda: {
    nome: 'Luanda',
    primaria: '#C8511B',
    secundaria: '#1D5C8A',
    lingua: 'Kimbundu',
  },
  Bengo: {
    nome: 'Bengo',
    primaria: '#A33E2B',
    secundaria: '#1E4F74',
    lingua: 'Kimbundu',
  },
  Benguela: {
    nome: 'Benguela',
    primaria: '#1A6B4A',
    secundaria: '#8B3A1A',
    lingua: 'Umbundu',
  },
  Bié: {
    nome: 'Bié',
    primaria: '#8B1A2F',
    secundaria: '#2D5016',
    lingua: 'Umbundu',
  },
  Cabinda: {
    nome: 'Cabinda',
    primaria: '#4B3A83',
    secundaria: '#1A5D6B',
    lingua: 'Kikongo',
  },
  'Cuando Cubango': {
    nome: 'Cuando Cubango',
    primaria: '#6B2A5E',
    secundaria: '#2E5F3D',
    lingua: 'Chokwe',
  },
  'Cuanza Norte': {
    nome: 'Cuanza Norte',
    primaria: '#7B4B1F',
    secundaria: '#1B5A7B',
    lingua: 'Kimbundu',
  },
  'Cuanza Sul': {
    nome: 'Cuanza Sul',
    primaria: '#A85723',
    secundaria: '#214A6D',
    lingua: 'Kimbundu',
  },
  Cunene: {
    nome: 'Cunene',
    primaria: '#C17A2E',
    secundaria: '#1A4A6B',
    lingua: 'Nyaneka',
  },
  Huambo: {
    nome: 'Huambo',
    primaria: '#8B1A2F',
    secundaria: '#2D5016',
    lingua: 'Umbundu',
  },
  Huíla: {
    nome: 'Huíla',
    primaria: '#6B1A8B',
    secundaria: '#2A6B1A',
    lingua: 'Nyaneka',
  },
  Malanje: {
    nome: 'Malanje',
    primaria: '#5B3A2A',
    secundaria: '#1F5A74',
    lingua: 'Kimbundu',
  },
  Moxico: {
    nome: 'Moxico',
    primaria: '#4F2E6A',
    secundaria: '#27624D',
    lingua: 'Chokwe',
  },
  Uíge: {
    nome: 'Uíge',
    primaria: '#3B5F4A',
    secundaria: '#7A2C27',
    lingua: 'Kikongo',
  },
  Zaire: {
    nome: 'Zaire',
    primaria: '#2B6B5C',
    secundaria: '#87421F',
    lingua: 'Kikongo',
  },
  'Lunda Norte': {
    nome: 'Lunda Norte',
    primaria: '#5A2F6C',
    secundaria: '#2D6B45',
    lingua: 'Chokwe',
  },
  'Lunda Sul': {
    nome: 'Lunda Sul',
    primaria: '#6A3F6B',
    secundaria: '#2A5F4D',
    lingua: 'Chokwe',
  },
  Namibe: {
    nome: 'Namibe',
    primaria: '#C17A2E',
    secundaria: '#1A4A6B',
    lingua: 'Nyaneka',
  },
};
