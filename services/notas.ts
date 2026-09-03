// Funções para gestão de notas — offline-first
// O professor lança sem internet, sincroniza depois
// Esta é a parte mais importante do Kulonga

import { supabase } from './supabase';

export interface NotaPayload {
  alunoId: string;
  disciplinaId: string;
  trimestre: 1 | 2 | 3;
  valor: number;
  autorPapel: 'professor' | 'coordenador' | 'secretaria';
  autorId: string;
}

// ── Buscar notas de um aluno (encarregado) ─────────────────
export async function buscarNotasAluno(alunoId: string) {
  try {
    // Usa a VIEW notas_vigentes — aplica a hierarquia de papéis
    const { data, error } = await supabase
      .from('notas_vigentes')
      .select('*')
      .eq('aluno_id', alunoId);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro ao buscar notas:', e);
    return null;
  }
}

// ── Lançar nota (guarda offline, sincroniza depois) ────────
export async function lancarNota(
  payload: NotaPayload
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // TODO: guardar no WatermelonDB local primeiro:
    // await database.write(async () => {
    //   await database.get('notas_pendentes').create(n => {
    //     n.alunoId      = payload.alunoId;
    //     n.disciplinaId = payload.disciplinaId;
    //     n.trimestre    = payload.trimestre;
    //     n.valor        = payload.valor;
    //     n.autorPapel   = payload.autorPapel;
    //     n.autorId      = payload.autorId;
    //     n.lancadoEm    = new Date().toISOString();
    //     n.status       = 'pendente';
    //   });
    // });

    // TODO: se online, sincronizar imediatamente:
    // import NetInfo from '@react-native-community/netinfo';
    // const { isConnected } = await NetInfo.fetch();
    // if (isConnected) await sincronizarPendentes();

    console.log('Nota lançada (mock):', payload);
    return { sucesso: true };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}

// ── Sincronizar notas pendentes com o servidor ─────────────
export async function sincronizarPendentes(): Promise<{
  sincronizadas: number;
  erros: number;
}> {
  try {
    // TODO: motor de sync offline-first completo:
    //
    // PASSO 1: Buscar notas pendentes no WatermelonDB
    // const pendentes = await database
    //   .get('notas_pendentes')
    //   .query(Q.where('status', 'pendente'))
    //   .fetch();
    //
    // PASSO 2: Enviar ao servidor em batches de 50
    // const res = await fetch(`${API_URL}/api/notas/sync`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`,
    //   },
    //   body: JSON.stringify({ notas: pendentes }),
    // });
    //
    // PASSO 3: O servidor aplica hierarquia de conflitos:
    //   secretaria(3) > coordenador(2) > professor(1)
    //   Em empate: nota mais recente vence
    //
    // PASSO 4: Marcar como sincronizadas
    // const { aceitas } = await res.json();
    // await database.write(async () => {
    //   for (const id of aceitas) {
    //     const nota = pendentes.find(n => n.id === id);
    //     await nota?.update(n => { n.status = 'sync'; });
    //   }
    // });

    console.log('TODO: sincronizarPendentes()');
    return { sincronizadas: 0, erros: 0 };
  } catch (e) {
    console.error('Erro de sync:', e);
    return { sincronizadas: 0, erros: 1 };
  }
}

// ── Gerar token de acesso (secretaria) ────────────────────
export async function gerarTokenAluno(
  alunoId: string,
  geradoPor: string
): Promise<{ sucesso: boolean; codigo?: string; erro?: string }> {
  try {
    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const { error } = await supabase.from('tokens_acesso').insert({
      aluno_id: alunoId,
      codigo,
      ativo: true,
      gerado_por: geradoPor,
    });
    if (error) throw error;

    return { sucesso: true, codigo };
  } catch (e: any) {
    return { sucesso: false, erro: e.message };
  }
}