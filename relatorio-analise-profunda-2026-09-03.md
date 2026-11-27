# Kulonga — Análise Profunda 03/09/2026

## Resumo Executivo
- **Frontend 95%**: 32 telas navegam, 40% ainda com mocks
- **Backend 70%**: services já chamam Supabase real, mas `lancar-notas`/`notas.ts` ainda quebrado
- **BD v2 OK**: schema + 3 fixes (registar_escola, RLS) aplicado
- **Área do Aluno**: INEXISTENTE (confirmado, não há `app/(aluno)`)
- **Build Vercel**: OK após `--legacy-peer-deps`, auto-deploy ativo

**Veredicto**: MVP demo vendável, não produção. Fluxo `escola→professor→turma→aluno→nota→encarregado` está bloqueado.

## Telas por Perfil (32)
| Tela | Estado |
|------|--------|
| splash | FUNCIONAL (2.5s, AsyncStorage) |
| onboarding/provincia | MOCK - não persiste |
| onboarding/lingua | OK |
| onboarding/perfil | OK (agora vai para escolher-perfil) |
| auth/escolher-perfil | CORRIGIDO hoje - pergunta "Tens conta?" |
| auth/cadastro-escola | REAL via RPC registar_escola |
| auth/cadastro-professor | REAL via RPC registar_professor |
| auth/login-professor | REAL |
| auth/login-secretaria | REAL |
| auth/token-encarregado | REAL mas órfão (não cria encarregado_aluno) |
| auth/recuperar-senha | MOCK (setTimeout) |
| professor/painel | HÍBRIDO - turmas reais mas 0 alunos |
| professor/turmas | MOCK PURO |
| professor/lancar-notas | HÍBRIDO CRÍTICO - UI MAC/PT vs BD frequencia/prova/exame = falha 100% |
| professor/sync | MOCK |
| secretaria/painel | REAL |
| secretaria/alunos | REAL |
| secretaria/aluno-[id] | MOCK |
| secretaria/turma-[id] | MOCK |
| secretaria/disciplinas | REAL completo |
| secretaria/gerar-token | REAL sem expira_em |
| secretaria/adicionar-professor | REAL PARCIAL - cria professor com user_id null = nunca loga |
| encarregado/painel | REAL (notas_vigentes) |
| encarregado/boletim | REAL |
| encarregado/contactos/perfil | MOCK |

**Não existe**: `app/(aluno)` - aluno só via encarregado.

## Services
- `supabase.ts` OK (EXPO_PUBLIC_* com fallback)
- `auth.ts` login/validarToken/verificarSessao/logout OK mas logout esquece kulonga_aluno_id
- `escolas.ts` RPC OK
- `professores.ts` adicionarProfessor quebra login
- `alunos.ts`/`turmas.ts`/`disciplinas.ts` OK
- `boletim.ts` calcularMedia com pesos diferentes de lancar-notas
- `notas.ts` buscarNotas REAL, lancarNota MOCK (console.log), sincronizarPendentes retorna 0

## BD / RLS
13 tabelas + view notas_vigentes (secretaria>coordenador>professor) corrigida (p.user_id). Funções escolas_do_staff/alunos_do_encarregado SECURITY DEFINER. Políticas OK mas tokens_validar é público (enumerável).

**Quebra crítica**: secretaria adiciona professor sem auth.users → órfão.

## Fluxos Testados
1. cadastro-escola → login-secretaria: OK
2. cadastro-professor → login-professor: OK se fix aplicado
3. gerar-token → validar OTP → painel encarregado: QUEBRA (não cria encarregados)
4. lancar-notas: FALHA 100% (CHECK tipo rejeita MAC/PT)
5. splash → onboarding → escolher-perfil: CORRIGIDO hoje

## Top 10 Falhas Críticas
1. lancar-notas MAC/PT vs CHECK frequencia/prova/exame
2. Encarregado órfão - RLS nega dados
3. adicionar-professor sem auth.users
4. Tokens públicos enumeráveis
5. splash usa AsyncStorage não supabase session
6. db/models vazio + offline falso
7. professor/turmas mock
8. recuperar-senha mock
9. secretaria/painel filtra aluno.turma inexistente
10. Trimestres divergentes

## O Que Falta
- Área Aluno (decisão produto)
- Unificar modelo notas
- RPC vincular_encarregado
- Fluxo convite professor
- WatermelonDB 7 models + sync
- Recuperar senha real
- expira_em tokens

## Plano Execução
**Sprint 0 Hotfix 1 dia**: corrigir tipo notas, alinhar boletim, logout completo
**Sprint 1 Integridade 3-4 dias**: RPC encarregado, refazer adicionar-professor, tokens SECURITY DEFINER, splash verificarSessao
**Sprint 2 Offline 5 dias**: prebuild + WatermelonDB + sync
**Sprint 3 Telas mock→real 3 dias**: turmas, aluno-[id], turma-[id], contactos
**Sprint 4 Área Aluno + QA 5 dias**: opcional criar app/(aluno) + testes E2E completos
**Total 12 dias sem aluno, 17 com aluno**
