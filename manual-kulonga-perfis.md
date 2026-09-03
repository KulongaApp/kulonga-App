# Kulonga — Manual de Utilização por Perfil
**Versão:** 1.0 — 03/09/2026 | **App:** kulonga-app.vercel.app | **Ciclo:** Escola → Professor → Aluno/Encarregado

---

## Visão Geral do Ciclo
```
[Onboarding] → Escolher Perfil → Entrar/Criar
      ↓
[Secretaria] cria Escola → Turmas → Alunos → Professores → Disciplinas → Tokens
      ↓
[Professor] ativa conta (email da secretaria) → vê Turmas → Lança Notas (MAC+PT→MF)
      ↓
[Aluno] cria conta → vê Painel/Boletim (notas_vigentes)
[Encarregado] valida token 6 dígitos → vê Painel do filho + Contactos
      ↓
[Sync Offline] WatermelonDB → quando volta online envia notas_pendentes
```

Todos ligados por `escola_id` e `turma_id`. RLS garante: secretaria vê tudo da escola, professor só suas turmas, aluno só si, encarregado só filho.

---

## Onboarding (primeira vez)
1. **Província** — escolhe entre 18 (ex: Namibe)
2. **Língua** — pt / Umbundu / Kimbundu
3. **Perfil principal** — só preferência (Encarregado/Professor/Secretaria/Aluno) → guarda `kulonga_perfil` → vai para `Entrar ou Criar conta`

Não repete pergunta: onboarding guarda preferência, `escolher-perfil` decide Entrar vs Criar.

---

## 1. 🏫 Secretaria / Direcção — Admin da Escola

### Criar conta
`Criar conta → Escola / Direcção` → preenche: nome escola, província, município, endereço, telefone, email escola + nome/telefone/email/senha do director → `supabase.auth.signUp` + RPC `registar_escola` (cria `escolas` + `professores` com `user_id=auth.uid()`) → auto-entra em `/(secretaria)`

> **Auto-login**: já entra direto, não precisa fazer login depois.

### O que faz
- **Início**: métricas reais — `alunos.length`, `professores.length`, `turmas.length`
- **Turmas > Criar Turma** (novo botão): digita nome ex: `10ªA` → insert `turmas (escola_id, nome, ano_lectivo 2025/2026, turno Manhã)` → lista atualiza → toca vai para `turma-[id]` (vê alunos matriculados, disciplinas)
- **Alunos**: `+` adiciona aluno (nome_completo, género M/F, data_nasc, telefone) → `alunos.escola_id` + `turma_alunos` quando matricula
- **Professores > Adicionar Professor**: nome, email, telefone, disciplina → insert `professores (user_id NULL, escola_id, email)` → **mostra senha temporária** (ex: `a8k2x9pq`) → entrega ao professor. Professor depois vai em `Criar conta → Professor — Ativar conta` com **mesmo email** → RPC `registar_professor` faz `UPDATE professores SET user_id=auth.uid() WHERE lower(email)=lower(p_email) AND user_id IS NULL` → vincula.
- **Disciplinas**: cria `Matemática` etc → `disciplinas.escola_id` → atribui a professor/turma via `disciplina_professor`
- **Gerar Token**: lista alunos reais → escolhe aluno → `gerarTokenAluno(aluno_id, user.id)` → insert `tokens_acesso (codigo 6 dígitos random, ativo true, expira_em +30d, gerado_por)` → mostra código para entregar ao encarregado

### Ligação BD
`escolas.id` ← `professores.escola_id`, `alunos.escola_id`, `turmas.escola_id`, `disciplinas.escola_id`

---

## 2. 👨‍🏫 Professor — Lança Notas

### Ativar conta
Professor **não cria sozinho**. Secretaria já o adicionou. Ele vai em `Criar conta → Professor — Ativar conta` → escolhe escola, nome, email (**mesmo** da secretaria), telefone, disciplinas, senha → `signUp` + `registar_professor` vincula → depois `Login Professor` (email/senha) → `loginComEmail` lê `user_metadata.papeis` → guarda `kulonga_papeis`, `kulonga_papel_activo=professor`, `kulonga_sessao_activa=true` → `/(professor)`

### Painel
- Header: avatar, nome, escola
- Métricas: `Turmas` (count `listarTurmas`), `Alunos` (soma `turma_alunos` count por turma), `Pendentes` (notas_pendentes status pendente)
- `SyncStatusBar`: mostra `Sem internet — X notas` ou `Sincronizado`
- **Duas setas** (swap): verifica `kulonga_papeis`. Se tem `['professor','encarregado']` (prof com filho) → vai para `selector-perfil` para trocar; se só 1 → Alerta "Perfil único". Token encarregado agora faz merge: `if (!lista.includes('encarregado')) lista.push(...)` então professor que valida token ganha segundo perfil.

### Turmas
Lista turmas reais da escola (via `listarTurmas(escola_id)`) → toca → `Lançar notas`

### Lançar Notas (core)
Escolhe `Turma / Disciplina / Trimestre (1/Set-Dez, 2/Jan-Abr, 3/Mai-Jul)` → carrega `listarAlunosTurma(turma_id)` → por aluno: AC por mês (1-5 campos) → `calcularMAC` → `PT` → `MF=(MAC+PT)/2`

**Guardar**: para cada aluno com MAC não nulo → `tipo='frequencia', valor=MAC`; com PT → `tipo='prova', valor=PT` → `supabase.from('notas').insert` com `autor_id=auth.uid(), autor_papel='professor'` → respeita `CHECK tipo IN ('frequencia','prova','exame')` e `valor 0-20`. Depois `notas_vigentes` aplica hierarquia `secretaria(3) > coordenador(2) > professor(1)`.

**Offline**: se sem net, `lancarNota` chama `salvarNotaPendente` (WatermelonDB LokiJS `notas_pendentes` status pendente) → quando volta online `sincronizarPendentes` batch insert.

### Sair
`await logout()` (signOut + multiRemove todas chaves incluindo `kulonga_aluno_id/escola_id`) → `/(auth)/escolher-perfil` (sem Alert, funciona na web)

---

## 3. 🎓 Aluno — Vê as suas notas direto

### Criar conta
`Criar conta → Aluno` → escola, nome, email, género M/F, senha → `signUp` (papeis ['aluno']) + RPC `registar_aluno(p_escola_id, p_nome, p_email, p_genero)` → insert `alunos (user_id=auth.uid(), escola_id, email, genero)` → auto-entra `/(aluno)`

### Painel (`/(aluno)/painel`)
- `supabase.from('alunos').select('id,nome_completo').eq('user_id', auth.uid()).single()` → pega `aluno_id`
- `buscarNotasAluno(aluno_id)` → `notas_vigentes` → agrupa por `disciplina_id` → mostra por trimestre com `corNota` (verde≥14, âmbar≥10, vermelho<10)
- Média geral por trimestre + barra progresso
- Botão `Ver boletim completo` → `/(aluno)/boletim`

### Boletim (`/(aluno)/boletim`)
Tabela: `Disciplina | Trim. | Tipo | Nota` → lê `notas_vigentes` filtrado por `aluno_id`

### Perfil (`/(aluno)/perfil`)
Mostra `nome_completo, email, género` via `alunos where user_id` → `Sair` → `escolher-perfil`

**RLS**: `alunos WHERE user_id=auth.uid() OR id=ANY(alunos_do_encarregado()) OR escola_id=ANY(escolas_do_staff())` + policy `alunos_ver_proprio`

---

## 4. 👨‍👩‍👧 Encarregado — Vê filho via token (sem senha)

### Entrar
**Sem cadastro**. Secretaria gerou token `482917` → encarregado vai `Sou Encarregado → código 6 dígitos` → `validarTokenEncarregado(codigo)` → RPC `validar_e_vincular_token(p_codigo)` (SECURITY DEFINER) → verifica `tokens_acesso where codigo AND ativo AND expira_em>now()` → cria `encarregados (user_id=auth.uid() se logado, senão anon)` + `encarregado_aluno` → retorna `aluno_id` → guarda `kulonga_papeis=['encarregado']`, `kulonga_aluno_id`, `kulonga_sessao_activa=true` → `/(encarregado)`

> Token expira 30 dias, depois secretaria gera novo. Enquanto ativo, `SELECT USING false` bloqueia enumeração anon — só RPC valida.

### Painel (`/(encarregado)/painel`)
- `buscarAluno(kulonga_aluno_id)` → nome, turma
- `buscarNotasAluno` → agrupa igual aluno → mostra `Disciplinas` com `nota do trimestre` + `Ligar` professor via `Linking.openURL('tel:'+telefone)` (vem de `notas_vigentes.professor_telefone`)
- Média geral + barra
- `Ver todos os professores` → `/(encarregado)/contactos`

### Contactos (`/(encarregado)/contactos`)
Busca real: `aluno` + `disciplina_professor join professores` → lista professores com `ProfessorContactCard` + botão ligar

### Perfil (`/(encarregado)/perfil`)
Agora real (não mock): `buscarAluno` via `kulonga_aluno_id` → mostra `Encarregado de [nome]` + `Sair` direto (sem Alert) → `escolher-perfil`

---

## Como estão conectados — Diagrama BD simplificado
```
escolas (id)
  ├─ professores (escola_id, user_id → auth.users)
  ├─ alunos (escola_id, user_id nullable, email)
  ├─ turmas (escola_id, coordenador_id → professores)
  ├─ disciplinas (escola_id)
  ├─ turma_alunos (turma_id ↔ aluno_id)
  ├─ turma_disciplinas (turma_id ↔ disciplina_id)
  ├─ disciplina_professor (professor_id ↔ disciplina_id ↔ turma_id)
  ├─ notas (aluno_id, disciplina_id, turma_id, trimestre 1-3, tipo frequencia/prova/exame, valor 0-20, autor_id, autor_papel)
  │    └─ VIEW notas_vigentes (ROW_NUMBER hierarquia secretaria>coord>prof)
  ├─ encarregados (user_id nullable)
  ├─ encarregado_aluno (encarregado_id ↔ aluno_id)
  ├─ tokens_acesso (aluno_id, codigo UNIQUE 6d, ativo, expira_em, gerado_por)
  └─ notas_pendentes (offline queue)
```

**Fluxo completo exemplo prático:**
1. Diretora Ana cria `Escola 17 Setembro` (Namibe) → `escolas.id=abc`, `professores (Ana, user_id=uuidAna)`
2. Ana cria `Turma 10ªA` → `turmas.id=t1`
3. Ana adiciona `Aluno João (M)` → `alunos.id=a1, escola_id=abc` → matricula `turma_alunos (t1,a1)`
4. Ana adiciona `Prof Carlos (carlos@escola.ao)` → `professores (user_id NULL, email carlos@...)` → mostra senha `k9x2pq`
5. Carlos ativa conta com `carlos@escola.ao` → `UPDATE professores SET user_id=uuidCarlos WHERE email=carlos@...` → login → vê `10ªA`
6. Carlos lança `MAC 14 (frequencia) + PT 16 (prova) → MF 15` para João em Matemática 1º Trim → `notas` 2 linhas
7. Ana gera token `482917` para João → `tokens_acesso (a1,482917)`
8. Mãe valida `482917` → `encarregados (id=e1)` + `encarregado_aluno (e1,a1)` → vê `Matemática 15` + `Ligar Carlos`
9. João cria conta `joao@escola.ao` → `alunos.user_id=uuidJoao` → vê mesmo boletim direto
10. Carlos fica offline → lança notas → `notas_pendentes` → quando volta `sincronizarPendentes` envia batch

---

## Offline & Sync
- **DB local**: `db/schema.ts` (LokiJSAdapter web, SQLite nativo após `expo prebuild`) → `notas_pendentes`
- **Salvar**: `lancarNota` → `salvarNotaPendente` sempre + tenta `sync` se `NetInfo.isConnected`
- **Tela Sync** (`/(professor)/sync`): lista pendentes reais via `Q.where('status','pendente')` + botão `Sincronizar` → `supabase.from('notas').insert` + marca `status='sync'`

---

## Termos & Responsividade
- `escolher-perfil` agora só login (4 cards) + scroll + 1 botão `Não tens conta? Criar conta →` leva para `/(auth)/criar-conta` (3 opções Escola/Professor/Aluno + Termos). Resolve corte no telefone (antes sem ScrollView cortava abaixo de "Não tens conta").
- Splash sem `Custódio Cahilo` → `© 2025 Kulonga`.

---

## Próximos Passos
- Piloto: testar ciclo acima com dados reais em Namibe/Luanda
- Play Store: `expo prebuild` + `eas build`
- Revogar PAT exposto em github.com/settings/tokens

*Gerado automaticamente — Kulonga v1.0.0*
