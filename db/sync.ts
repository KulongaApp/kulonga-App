import { supabase } from '../services/supabase';
import { database } from './index';
import { Q } from '@nozbe/watermelondb';

export async function salvarNotaPendente(payload: {
  alunoId: string; disciplinaId: string; turmaId: string; trimestre: number; tipo: string; valor: number; autorId: string; autorPapel: string;
}) {
  try {
    await database.write(async () => {
      const col = database.get('notas_pendentes' as any);
      await (col as any).create((r: any) => {
        r.alunoId = payload.alunoId;
        r.disciplinaId = payload.disciplinaId;
        r.turmaId = payload.turmaId;
        r.trimestre = payload.trimestre;
        r.tipo = payload.tipo;
        r.valor = payload.valor;
        r.autorId = payload.autorId;
        r.autorPapel = payload.autorPapel;
        r.status = 'pendente';
        r.lancadoEm = new Date().toISOString();
      });
    });
  } catch {}
}

export async function sincronizarPendentes(): Promise<{ sincronizadas: number; erros: number }> {
  try {
    const col = database.get('notas_pendentes' as any) as any;
    const pendentes: any[] = await col.query(Q.where('status', 'pendente')).fetch();
    if (pendentes.length === 0) return { sincronizadas: 0, erros: 0 };
    let ok = 0; let erros = 0;
    for (const p of pendentes) {
      const { error } = await supabase.from('notas').insert({
        aluno_id: p.alunoId,
        disciplina_id: p.disciplinaId,
        turma_id: p.turmaId,
        trimestre: p.trimestre,
        tipo: p.tipo,
        valor: p.valor,
        autor_id: p.autorId,
        autor_papel: p.autorPapel,
      });
      if (!error) {
        await database.write(async () => { await p.update((r: any) => { r.status = 'sync'; r.sincronizadoEm = new Date().toISOString(); }); });
        ok++;
      } else erros++;
    }
    return { sincronizadas: ok, erros };
  } catch {
    return { sincronizadas: 0, erros: 1 };
  }
}
