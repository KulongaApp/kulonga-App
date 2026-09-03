import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'notas_pendentes',
      columns: [
        { name: 'aluno_id', type: 'string' },
        { name: 'disciplina_id', type: 'string' },
        { name: 'turma_id', type: 'string' },
        { name: 'trimestre', type: 'number' },
        { name: 'tipo', type: 'string' },
        { name: 'valor', type: 'number' },
        { name: 'autor_id', type: 'string' },
        { name: 'autor_papel', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'lancado_em', type: 'string' },
        { name: 'sincronizado_em', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({ name: 'escolas', columns: [{ name: 'nome', type: 'string' }, { name: 'provincia', type: 'string' }] }),
    tableSchema({ name: 'alunos', columns: [{ name: 'nome_completo', type: 'string' }, { name: 'escola_id', type: 'string' }] }),
    tableSchema({ name: 'turmas', columns: [{ name: 'nome', type: 'string' }, { name: 'escola_id', type: 'string' }] }),
  ],
});
