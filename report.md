# Relatório de dados fictícios (mocks)

Este relatório lista todos os locais do projeto que usam dados fictícios (mocks), os ficheiros de mock encontrados e um resumo do conteúdo.

## Arquivos de mocks encontrados

- [mocks/aluno.ts](mocks/aluno.ts#L1-L200): definição de `Aluno` e `alunoMock` com disciplinas e notas de exemplo.
- [mocks/professores.ts](mocks/professores.ts#L1-L200): lista `professores` com vários professores fictícios.
- [mocks/turma-notas.ts](mocks/turma-notas.ts#L1-L200): `turmaMock`, funções de cálculo (`calcularMAC`, `calcularMF`, `classificacao`) e constantes de trimestres.

## Uso de dados fictícios pelo código

Principais ficheiros que referenciam mocks (não exaustivo):

- [app/(auth)/login-professor.tsx](app/(auth)/login-professor.tsx#L1-L80) — `professorMock` usado para login local.
- [app/(professor)/lancar-notas.tsx](app/(professor)/lancar-notas.tsx#L1-L220) — usa `turmaMock` para lançamento de notas na UI.
- [app/(professor)/painel.tsx](app/(professor)/painel.tsx#L1-L120) — `professorMock` mostrado no painel.
- [app/(secretaria)/painel.tsx](app/(secretaria)/painel.tsx#L1-L140) — vários `*Mock` (escola, turmas, professores, alunos).
- [hooks/useAlunoDados.ts](hooks/useAlunoDados.ts#L1-L40) — importa `alunoMock`.
- [services/auth.ts](services/auth.ts#L1-L140) — comentários e retornos mocked para autenticação.
- [services/notas.ts](services/notas.ts#L1-L100) — funções que logam operações como `mock`.

## Resumo do conteúdo dos mocks

- `alunoMock`: Aluno de exemplo `Ana Maria Damião` com disciplinas (Matemática, Física, Química, Português, História, Inglês) e notas para cada trimestre.
- `professores`: array com 6 professores fictícios (IDs `p-001` a `p-006`).
- `turmaMock`: turma `10ªA` com 10 alunos (ids `a1` a `a10`) e funções de avaliação no ficheiro.

## Observações

- Vários ficheiros usam comentários `// Mock` indicando código temporário a substituir por Supabase/BD real.
- Recomenda-se substituir: autenticação em `services/auth.ts`, dados de `turmaMock` e `alunoMock` por chamadas reais ao backend quando disponível.

-- Gerado automaticamente pelo assistente.
