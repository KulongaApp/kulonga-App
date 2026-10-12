// hooks/useAlunoDados.ts
// Carrega o dossiê completo de um aluno: turma, disciplinas, professores e
// notas vigentes. Substitui a versão antiga que devolvia `alunoMock`.
//
// Sem `alunoId`, resolve o aluno da sessão actual: primeiro o aluno ligado ao
// utilizador autenticado (papel aluno), depois o primeiro filho do encarregado.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { calcularMF, type Trimestre } from '../services/avaliacao';

export type Contacto = {
  id: string;
  nome: string;
  telefone: string;
};

export type NotaTrimestre = {
  trimestre: Trimestre;
  valor: number;
};

export type DisciplinaAluno = {
  id: string;
  nome: string;
  professor: Contacto;
  notas: NotaTrimestre[];
};

export type Aluno = {
  id: string;
  nomeCompleto: string;
  fotoUrl: string;
  turma: string;
  periodo: string;
  anoLetivo: string;
  coordenador: Contacto | null;
  disciplinas: DisciplinaAluno[];
};

const contactoVazio: Contacto = { id: '', nome: '—', telefone: '' };

/** Descobre de que aluno estamos a falar quando não é indicado um id. */
async function resolverAlunoId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: proprio } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (proprio?.id) return proprio.id;

  const { data: encarregado } = await supabase
    .from('encarregados')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!encarregado?.id) return null;

  const { data: vinculo } = await supabase
    .from('encarregado_aluno')
    .select('aluno_id')
    .eq('encarregado_id', encarregado.id)
    .limit(1)
    .maybeSingle();
  return vinculo?.aluno_id ?? null;
}

async function carregarAluno(alunoId: string): Promise<Aluno> {
  const { data: aluno, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', alunoId)
    .single();
  if (error) throw error;

  // Turma do aluno (matrícula) + coordenador da turma
  const { data: matriculas } = await supabase
    .from('turma_alunos')
    .select('turmas (*)')
    .eq('aluno_id', alunoId)
    .limit(1);
  const turma = (matriculas?.[0] as any)?.turmas ?? null;

  let coordenador: Contacto | null = null;
  if (turma?.coordenador_id) {
    const { data: coord } = await supabase
      .from('professores')
      .select('id, nome, telefone')
      .eq('id', turma.coordenador_id)
      .maybeSingle();
    if (coord) {
      coordenador = {
        id: coord.id,
        nome: coord.nome ?? '—',
        telefone: coord.telefone ?? '',
      };
    }
  }

  // Notas vigentes: já trazem nome da disciplina e do professor
  const { data: notasVigentes } = await supabase
    .from('notas_vigentes')
    .select('*')
    .eq('aluno_id', alunoId);

  const porDisciplina = new Map<string, { nome: string; professor: Contacto; tipos: Record<string, number>; trimestres: Set<Trimestre> }>();
  for (const n of (notasVigentes ?? []) as any[]) {
    const chave = n.disciplina_id;
    if (!porDisciplina.has(chave)) {
      porDisciplina.set(chave, {
        nome: n.disciplina_nome ?? '—',
        professor: {
          id: n.professor_id ?? '',
          nome: n.professor_nome ?? '—',
          telefone: n.professor_telefone ?? '',
        },
        tipos: {},
        trimestres: new Set(),
      });
    }
    const entrada = porDisciplina.get(chave)!;
    // Guarda o valor por "trimestre:tipo" para depois juntar MAC + PT
    entrada.tipos[`${n.trimestre}:${n.tipo}`] = Number(n.valor);
    entrada.trimestres.add(Number(n.trimestre) as Trimestre);
  }

  const disciplinas: DisciplinaAluno[] = Array.from(porDisciplina.entries()).map(
    ([id, entrada]) => {
      const notas: NotaTrimestre[] = Array.from(entrada.trimestres)
        .sort()
        .map((trimestre) => {
          const mac = entrada.tipos[`${trimestre}:frequencia`] ?? null;
          const pt = entrada.tipos[`${trimestre}:prova`] ?? null;
          const exame = entrada.tipos[`${trimestre}:exame`] ?? null;
          const mf = calcularMF(mac, pt) ?? exame ?? mac ?? pt ?? 0;
          return { trimestre, valor: mf };
        });
      return {
        id,
        nome: entrada.nome,
        professor: entrada.professor ?? contactoVazio,
        notas,
      };
    }
  );

  return {
    id: aluno.id,
    nomeCompleto: aluno.nome_completo ?? 'Aluno',
    fotoUrl: aluno.foto_url ?? '',
    turma: turma?.nome ?? '—',
    periodo: turma?.turno ?? '',
    anoLetivo: turma?.ano_lectivo ?? '',
    coordenador,
    disciplinas,
  };
}

export const useAlunoDados = (alunoIdParam?: string | null) => {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const alunoId = alunoIdParam ?? (await resolverAlunoId());
      if (!alunoId) {
        setAluno(null);
        setErro('Nenhum aluno associado a esta conta.');
        return;
      }
      setAluno(await carregarAluno(alunoId));
    } catch (e: any) {
      setAluno(null);
      setErro(e?.message ?? 'Não foi possível carregar os dados do aluno.');
    } finally {
      setLoading(false);
    }
  }, [alunoIdParam]);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (activo) await recarregar();
    })();
    return () => {
      activo = false;
    };
  }, [recarregar]);

  return { aluno, loading, erro, recarregar };
};
