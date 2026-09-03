// @ts-nocheck
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class NotaPendente extends Model {
  static table = 'notas_pendentes';
  static associations = {};
  // @ts-ignore
  @field('aluno_id') alunoId;
  // @ts-ignore
  @field('disciplina_id') disciplinaId;
  // @ts-ignore
  @field('turma_id') turmaId;
  // @ts-ignore
  @field('trimestre') trimestre;
  // @ts-ignore
  @field('tipo') tipo;
  // @ts-ignore
  @field('valor') valor;
  // @ts-ignore
  @field('autor_id') autorId;
  // @ts-ignore
  @field('autor_papel') autorPapel;
  // @ts-ignore
  @field('status') status;
  // @ts-ignore
  @field('lancado_em') lancadoEm;
  // @ts-ignore
  @field('sincronizado_em') sincronizadoEm;
}
