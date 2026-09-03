import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import NotaPendente from './models/NotaPendente';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'kulonga',
});

export const database = new Database({
  adapter,
  modelClasses: [NotaPendente as any],
});

export async function getPendentes() {
  try {
    return await database.get('notas_pendentes' as any).query().fetch() as any[];
  } catch {
    return [];
  }
}
