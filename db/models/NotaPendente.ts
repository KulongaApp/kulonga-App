import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class NotaPendente extends Model {
  static table = 'notas_pendentes';
  static associations = {};
  // @ts-ignore
  @field('aluno_id') alunoId!: string;
  // @ts-ignore
  @field('disciplina_id') disciplinaId!: string;
  // @ts-ignore
  @field('turma_id') turmaId!: string;
  // @ts-ignore
  @field('trimestre') trimestre!: number;
  // @ts-ignore
  @field('tipo') tipo!: string;
  // @ts-ignore
  @field('valor') valor!: number;
  // @ts-ignore
  @field('autor_id') autorId!: string;
  // @ts-ignore
  @field('autor_papel') autorPapel!: string;
  // @ts-ignore
  @field('status') status!: string;
  // @ts-ignore
  @field('lancado_em') lancadoEm!: string;
  // @ts-ignore
  @field('sincronizado_em') sincronizadoEm?: string;
}
