# Auditoria defensiva de segurança — KULONGA

**Data:** 15 de Outubro de 2026  
**Escopo:** aplicação Expo/React Native/Web, Supabase Auth/Postgres/RLS, RPCs, Storage, dependências npm e deployment Vercel.  
**Método:** análise estática local, revisão das policies/RPCs, verificações de dependências, headers HTTP e testes autenticados não destrutivos.

> Não existe uma aplicação “impossível de hackear”. O objectivo correcto é reduzir a superfície de ataque, aplicar menor privilégio, limitar tentativas, proteger dados e detectar incidentes rapidamente.

## Resumo executivo

### Pontos positivos

- Não foram encontrados `service_role`, chaves privadas, PATs ou passwords hardcoded no código versionado.
- `npx expo-doctor` passou: **18/18 verificações**.
- TypeScript e build web continuam a passar.
- Os testes anteriores validaram **48/48** casos de autenticação/RLS.
- O teste misto de carga validou **96/96** pedidos sem erros.
- As funções `SECURITY DEFINER` novas usam `SET search_path` e a RPC de tokens tem `REVOKE`/`GRANT` explícitos.
- Não foram encontrados `eval`, `new Function`, `dangerouslySetInnerHTML` ou WebViews inseguros no código analisado.

### Riscos prioritários

| ID | Área | Severidade | Situação |
|---|---|---:|---|
| SEC-01 | Autorização de staff demasiado ampla | **Crítica** | Corrigir antes de produção |
| SEC-02 | Bootstrap/RPCs `SECURITY DEFINER` com autorização insuficiente | **Crítica** | Rever e limitar imediatamente |
| SEC-03 | Tokens curtos e sem rate limiting/expiração forte | **Alta** | Reforçar antes de lançamento |
| SEC-04 | Policies de Storage não validam completamente o trabalho/aluno | **Alta** | Corrigir antes de uploads reais |
| SEC-05 | Headers web de segurança ausentes | **Média/Alta** | Adicionar no Vercel |
| SEC-06 | Dependências npm vulneráveis/transitivas | **Média/Alta** | Actualizar em branch dedicada |
| SEC-07 | Policies de notificações/avisos permitem alterações excessivas | **Média** | Aplicar menor privilégio |

## SEC-01 — Policies de staff demasiado amplas

No SQL consolidado, várias policies usam `FOR ALL` com `escolas_do_staff()`:

```sql
CREATE POLICY professores_staff ON public.professores
FOR ALL USING (user_id = auth.uid() OR escola_id = ANY(public.escolas_do_staff()));

CREATE POLICY alunos_staff ON public.alunos
FOR ALL USING (escola_id = ANY(public.escolas_do_staff()) ...);

CREATE POLICY turmas_staff ON public.turmas FOR ALL ...;
CREATE POLICY disciplinas_staff ON public.disciplinas FOR ALL ...;
```

Como a secretaria também está representada em `professores`, mas `escolas_do_staff()` inclui professores, um professor autenticado pode potencialmente actualizar ou apagar registos de toda a escola, dependendo do endpoint e da policy combinada.

### Impacto

- Alteração de alunos, professores, turmas ou disciplinas por um professor que deveria apenas consultar.
- Possível destruição ou adulteração de dados académicos.
- Violação do princípio de menor privilégio.

### Correcção recomendada

Separar explicitamente as permissões por capacidade:

- `is_secretaria_da_escola(escola_id)` — criar/editar dados administrativos.
- `is_professor_da_turma(turma_id)` — gerir apenas turmas/disciplina atribuídas.
- Policies separadas para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- Nunca confiar em `user_metadata` enviado pelo cliente para decidir se alguém é secretaria.
- Guardar o papel autorizado em tabela protegida ou em `app_metadata` gerido no servidor.

## SEC-02 — RPCs de bootstrap e `SECURITY DEFINER`

As funções de registo devem ser revistas com atenção especial:

- `registar_escola`
- `registar_professor`
- `registar_aluno`
- `activar_conta_por_token`
- `validar_e_vincular_token`

Uma função `SECURITY DEFINER` executa com privilégios do proprietário. Cada função deve validar explicitamente o actor, escola, convite e finalidade antes de inserir ou associar dados.

### Regras obrigatórias

- `registar_escola`: permitir apenas bootstrap controlado, impedir criação ilimitada associada ao mesmo utilizador/email.
- `registar_professor`: exigir secretaria autorizada da escola ou convite de professor de uso único.
- `registar_aluno`: exigir secretaria autorizada ou token válido.
- `activar_conta_por_token`: manter o token vinculado ao aluno e ao tipo correcto, com expiração e consumo atómico.
- Todas as funções: `SET search_path = public, pg_temp`, `REVOKE ALL FROM PUBLIC` e `GRANT EXECUTE` apenas ao papel necessário.
- Validar comprimentos máximos, UUIDs, emails e estado activo dentro da própria função, não apenas no formulário.

## SEC-03 — Tokens de acesso vulneráveis a brute force

Os tokens actuais são códigos numéricos de seis dígitos. Mesmo com validação correcta, existem apenas 1.000.000 de combinações e a RPC de validação é acessível através da API.

### Riscos

- Tentativas automatizadas de adivinhar tokens.
- Enumeração de alunos se a resposta da validação revelar demasiados dados.
- Ausência aparente de limite de tentativas por IP, utilizador, dispositivo ou código.

### Correcção recomendada

1. Usar tokens de 8–12 caracteres aleatórios com `gen_random_bytes`, ou códigos de seis dígitos apenas com rate limit rigoroso.
2. Guardar apenas hash do token na base de dados quando possível.
3. Adicionar `expira_em`, `tentativas_falhadas`, `bloqueado_ate` e `consumido_em`.
4. Aplicar limite, por exemplo:
   - 5 tentativas por token em 15 minutos;
   - limite por IP/dispositivo através de Edge Function ou gateway;
   - backoff progressivo após falhas.
5. Fazer a resposta de token inválido ser genérica.
6. Nunca devolver emails, UUIDs ou dados do aluno na RPC pública de validação.
7. Registar eventos de tentativa falhada sem guardar o token em texto.

## SEC-04 — Storage de entregas

A policy actual verifica que o terceiro segmento do caminho é um UUID igual ao utilizador autenticado:

```sql
split_part(name, '/', 3)::uuid = auth.uid()
```

Isto protege a identidade do uploader, mas não confirma completamente que:

- o aluno está matriculado na turma do trabalho;
- o trabalho existe e pertence à escola do aluno;
- o aluno pode entregar naquele trabalho;
- o caminho contém exactamente os segmentos esperados;
- o tipo e tamanho do ficheiro são aceitáveis.

### Correcção recomendada

- Validar o caminho completo com uma expressão estrita.
- Confirmar, numa policy ou Edge Function, a relação `aluno → turma → trabalho`.
- Definir no bucket:
  - tamanho máximo de ficheiro;
  - MIME types permitidos;
  - nomes e extensões permitidos.
- Não permitir `UPDATE`/`DELETE` de objectos por qualquer utilizador autenticado sem policy específica.
- Preferir nomes gerados pelo servidor em vez de aceitar nomes fornecidos pelo utilizador.
- Nunca expor o bucket como público; usar URLs assinados de curta duração.

## SEC-05 — Headers web

A aplicação publicada tem HSTS, mas a resposta verificada não apresentou headers adicionais importantes:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors` via CSP ou `X-Frame-Options`

Também foi observado `access-control-allow-origin: *` no hosting estático. Isto não expõe a chave anon por si só, mas deve ser revisto se forem adicionadas APIs ou endpoints com sessão.

### Correcção recomendada no Vercel

Adicionar headers para rotas web, por exemplo:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
      ]
    }
  ]
}
```

A CSP deve ser testada com cuidado porque Expo Web pode precisar de `unsafe-inline`/`unsafe-eval` no bundle actual. O objectivo é reduzir permissões progressivamente, não quebrar o login.

## SEC-06 — Dependências npm

`npm audit --omit=dev` encontrou **55 vulnerabilidades transitivas** no estado actual:

- 1 crítica
- 32 altas
- 22 moderadas

As cadeias incluem ferramentas Expo/Metro, `@xmldom/xmldom`, `brace-expansion`, `braces`, `image-size`, `js-yaml`, `nanoid`, `node-forge` e outras dependências transitivas.

O `npm audit` propõe algumas correcções com `--force` que fariam upgrades incompatíveis, incluindo mudanças grandes de Expo/Tailwind. Não se deve executar `npm audit fix --force` directamente na branch de produção.

### Plano seguro

1. Criar branch de actualização.
2. Actualizar primeiro Expo SDK e pacotes Expo compatíveis como conjunto.
3. Remover dependências não utilizadas.
4. Executar `npm audit`, `npx expo-doctor`, `npm run typecheck` e `npm run build`.
5. Repetir testes de autenticação, RLS e carga.
6. Publicar apenas depois de validar o bundle e as rotas web/native.

## SEC-07 — Avisos e notificações

Foram detectadas permissões mais amplas do que o necessário:

```sql
CREATE POLICY avisos_autor_editar ON public.avisos
FOR UPDATE USING (autor_id = auth.uid() OR escola_id = ANY(public.escolas_do_staff()));
```

Isto pode permitir que qualquer staff da escola edite avisos de outros autores. Da mesma forma, a policy de notificações deve permitir apenas alterar o estado de leitura, não o conteúdo completo.

### Correcção recomendada

- Avisos: editar pelo autor ou por secretaria/direcção autorizada.
- Avisos: validar que `escola_id`, `turma_id` e `publico` não mudam para uma escola/turma não autorizada.
- Notificações: substituir update directo por RPC `marcar_notificacao_lida(id)`, que apenas altera `lida_em`.
- Não permitir que o cliente defina livremente `utilizador_id`, `escola_id`, `entidade_id` ou `dedupe_key` em notificações.

## Dados e privacidade

A policy actual de escolas contém:

```sql
CREATE POLICY escolas_listar ON public.escolas
FOR SELECT USING (true);
```

Isto é conveniente para o onboarding, mas pode expor todas as colunas de todas as escolas a utilizadores anónimos. A solução mais segura é:

- criar uma view pública com apenas `id`, `nome` e `provincia`; ou
- criar uma RPC pública de pesquisa de escolas que devolva apenas campos mínimos e limite resultados; ou
- aplicar uma policy que permita apenas os campos necessários através de uma arquitectura de view/API.

## Observações adicionais

- A sessão no cliente usa armazenamento local/AsyncStorage. No native, deve ser avaliada a migração para armazenamento seguro do refresh token, como `expo-secure-store`.
- Não guardar tokens de acesso, passwords ou refresh tokens em logs.
- As mensagens de erro apresentadas ao utilizador não devem revelar detalhes SQL, nomes de tabelas ou existência de emails.
- Adicionar auditoria de eventos: login falhado, token falhado, alteração de permissões, alteração de notas, upload e eliminação.
- Configurar alertas para picos de falhas de login/token, alterações administrativas e criação anormal de escolas.
- Adicionar limites de paginação e de tamanho de resposta a todas as listagens.

## Prioridade de execução

### P0 — antes de produção

1. Separar permissões de secretaria/professor nas policies `FOR ALL`.
2. Rever e restringir as RPCs `SECURITY DEFINER` de bootstrap.
3. Implementar rate limiting, expiração e tentativas dos tokens.
4. Validar autorização completa dos uploads no Storage.
5. Remover a exposição global de todas as colunas de `escolas`.

### P1 — próxima ronda

1. Restringir edição de avisos e notificações.
2. Adicionar headers web de segurança.
3. Criar logs de segurança e alertas.
4. Definir retenção e limpeza de tokens consumidos.
5. Actualizar dependências Expo numa branch dedicada.

### P2 — endurecimento contínuo

1. Testes automatizados negativos por papel.
2. Testes de autorização entre escolas diferentes.
3. Testes de abuso de upload e payloads grandes.
4. Revisão trimestral de dependências.
5. Rotação de credenciais e verificação de secrets no CI.

## Conclusão

A aplicação tem boas bases: RLS activo, RPCs recentes, sem segredos detectados, Expo saudável e testes funcionais sólidos. Contudo, ainda não deve ser considerada endurecida contra ataques reais até serem corrigidos os problemas de autorização ampla, brute force dos tokens, Storage e bootstrap administrativo.

Não recomendo adicionar “armadilhas” ou backdoors no código. Recomendo **rate limiting, menor privilégio, logs de auditoria, alertas e bloqueios explícitos**: são medidas defensivas, auditáveis e eficazes sem criar novos riscos.
