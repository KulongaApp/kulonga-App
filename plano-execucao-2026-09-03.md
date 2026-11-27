# KULONGA — Plano de Execução 03/09/2026
Após análise profunda + dump Supabase real

## 1. Estado Atual
- **Dump confirma**: 13 tabelas OK, sem VIEW/RLS/RPC. É o esqueleto, falta camada de segurança e lógica.
- **Frontend**: 32 telas, 14 REAL / 8 HÍBRIDO / 7 MOCK
- **Bloqueadores**: lancar-notas 100% quebrado, professor órfão, encarregado órfão, sem offline, sem área aluno

## 2. Sprint 0 — HOTFIX CRÍTICO (1 dia) — FAZER AGORA
- [ ] Aplicar no Supabase SQL Editor na ordem:
  1. `schema-kulonga.sql` (se ainda não) OU só os 3 patches: `fix-rls-functions.sql` + `fix-rls-encarregados.sql` + `fix-cadastro-rpc.sql`
  2. `NOTIFY pgrst, 'reload schema';`
  3. Desligar "Confirm email" em Auth > Email
- [ ] Corrigir `app/(professor)/lancar-notas.tsx: guardar()` — trocar `tipo: 'MAC'/'PT'` para `'frequencia'/'prova'` (AC→frequencia, PT→prova) — **sem isso nenhuma nota entra**
- [ ] Alinhar `services/boletim.ts` com `mocks/turma-notas.ts` (calcularMAC/MF) — remover pesos 0.3/0.4/0.3
- [ ] Fix `services/auth.ts logout` incluir `kulonga_aluno_id` + `kulonga_escola_id`
- [ ] `vercel.json` já fixado (--legacy-peer-deps) — testar deploy

## 3. Sprint 1 — Integridade Dados (3 dias)
- [ ] **Encarregado**: criar RPC `vincular_encarregado(codigo TEXT)` SECURITY DEFINER que cria `encarregados`+`encarregado_aluno` atomico + trocar `token-encarregado.tsx` para chamar RPC em vez de select público
- [ ] **Professor**: refazer `secretaria/adicionar-professor.tsx` — em vez de `insert professores`, fazer `supabase.auth.signUp` + `registar_professor` (ou Edge Function invite). Professor com user_id null nunca loga.
- [ ] **Tokens**: fechar `tokens_validar USING (ativo=true)` público → criar função `validar_token(codigo)` SECURITY DEFINER + `expira_em = now()+30 dias` + retry colisão
- [ ] **Sessão**: `app/splash.tsx` chamar `verificarSessao()` (supabase) em vez de só AsyncStorage
- [ ] **Tipos**: `professores.disciplinas` ALTER para `TEXT[]`

## 4. Sprint 2 — Offline First (5 dias)
- [ ] `npx expo prebuild` + criar `db/schema.ts` + `db/index.ts`
- [ ] Criar 7 models WatermelonDB: Escola, Professor, Aluno, Turma, Disciplina, Nota, NotaPendente
- [ ] Reescrever `services/notas.ts`: `lancarNota` → cria `nota_pendente` local + `sincronizarPendentes` batch 50 → `notas.insert`
- [ ] Ligar `app/(professor)/sync.tsx` + `SyncStatusBar` a `useConectividade` + NetInfo
- [ ] Trocar `hooks/useAlunoDados.ts` de mock para `supabase + cache`

## 5. Sprint 3 — Telas Mock→Real (3 dias)
- [ ] `professor/turmas.tsx` → `listarTurmas` + `listarAlunosTurma` (hoje 10ªA/B/C hard-coded)
- [ ] `secretaria/aluno-[id].tsx` → `buscarAluno` + `matricularAluno` + `gerarTokenAluno`
- [ ] `secretaria/turma-[id].tsx` → `buscarTurma` + `listarAlunosTurma`
- [ ] `encarregado/contactos.tsx` + `perfil.tsx` + `editar-perfil.tsx` → `buscarAluno` real
- [ ] `auth/recuperar-senha.tsx` → `supabase.auth.resetPasswordForEmail`
- [ ] `secretaria/alunos.tsx` modal vincular `turma_alunos`

## 6. Sprint 4 — Área do Aluno (Decisão) + QA (5 dias)
**Opção A — Sem área aluno (recomendado MVP)**: Aluno vê só via encarregado. Economiza 5 dias.
**Opção B — Com área aluno**:
- [ ] Criar `app/(aluno)/_layout, painel, boletim, perfil` + adicionar `alunos.user_id FK auth.users` + RLS `alunos_ver_proprio`
- [ ] Auth `papel='aluno'` + cadastro aluno com email/senha
- [ ] Testes E2E completos: criar escola → professor → turma → aluno → matricular → lançar AC/PT → gerar token → encarregado vê → offline → sync
- [ ] `expo export` + Vercel prod + Play Store Internal Testing

## 7. Entrega & Checklist Final
- [ ] Todos os `mocks/*` removidos de produção
- [ ] `NOTIFY pgrst` após cada SQL
- [ ] Testar Android 8/10/12/15 offline
- [ ] Revogar PAT `ghp_W5o...` exposto e criar novo
- [ ] Domínio kulonga.ao na Vercel

**Total**: 12 dias úteis sem aluno | 17 dias com aluno
**Próximo passo imediato**: Sprint 0 — queres que eu comece agora pelo fix do `lancar-notas`?
