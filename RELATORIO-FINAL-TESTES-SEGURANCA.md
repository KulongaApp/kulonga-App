# KULONGA — Relatório final de testes de segurança e performance

**Data:** 16 de Outubro de 2026  
**Ambiente:** projecto Supabase actual autorizado pelo utilizador  
**Aplicação:** Expo/React Native/Web com Supabase Auth, Postgres, RLS, RPCs e Storage  
**Estado:** validação funcional e de segurança concluída com sucesso; recomendações residuais documentadas abaixo.

## 1. Resumo executivo

A plataforma foi submetida a várias rondas de autenticação, autorização, RLS, tokens, isolamento entre perfis, carga concorrente e verificações anónimas.

### Resultado principal

- **27/27 testes pós-endurecimento aprovados.**
- **48/48 testes funcionais/RLS anteriores aprovados.**
- **96/96 pedidos no teste de carga misto final aprovados.**
- **0 erros HTTP no teste de carga final.**
- **0 recursões RLS após a correcção incremental.**
- **0 tokens de teste activos deixados após a limpeza funcional.**
- **Expo Doctor: 18/18 verificações aprovadas.**
- **TypeScript e build web aprovados.**
- Não foram encontrados segredos privados versionados no código analisado.

> A aplicação está significativamente mais protegida, mas nenhuma aplicação pode ser considerada impossível de atacar. O próximo nível de segurança depende sobretudo de rate limiting, gestão de convites, monitorização e actualização contínua de dependências.

## 2. Fluxos funcionais aprovados

### Autenticação

Foram testados e aprovados:

- Login da secretaria.
- Login do aluno.
- Login do encarregado.
- Rejeição de password inválida.
- Logout e limpeza do estado local no serviço de autenticação.
- Leitura da sessão autenticada.
- Associação do papel persistente da secretaria.

### Fluxo de tokens

Foram testados e aprovados:

- Geração de par de tokens pela secretaria.
- Token específico para aluno.
- Token específico para encarregado.
- Validação de tokens activos.
- Activação da conta do aluno.
- Activação da conta do encarregado.
- Associação do encarregado ao aluno correcto.
- Consumo atómico dos tokens.
- Rejeição de tokens reutilizados.
- Rotação de tokens antigos.
- Invalidação dos tokens anteriores.
- Rejeição de códigos inválidos e tipos não permitidos.
- Tokens temporários usados nos testes foram consumidos no final.

### Isolamento de dados

Foram aprovados os seguintes controlos:

- O aluno só lê o próprio registo.
- O aluno não enumera outros alunos.
- O aluno não enumera professores.
- O encarregado só lê o próprio perfil.
- O encarregado só lê alunos associados.
- A secretaria lê os dados da sua escola.
- O acesso a avisos, notas, trabalhos, notificações e assiduidade passa pelo RLS.
- Tentativas de criação de avisos por aluno foram bloqueadas.
- Tentativas de criação de trabalhos por aluno foram bloqueadas.
- Tokens não são expostos por leitura directa da tabela.

## 3. Políticas RLS

### Problemas encontrados e corrigidos

Durante a auditoria foram encontradas e corrigidas três famílias de problemas:

1. Recursão na policy de `encarregados`.
2. Recursão entre `assiduidade_sessoes` e `assiduidade_registos`.
3. Recursões introduzidas na primeira versão do endurecimento por papéis, envolvendo:
   - `alunos`;
   - `disciplinas`;
   - `turma_alunos`;
   - `avisos`;
   - `notas`;
   - `trabalhos`.

As correcções usam funções auxiliares `SECURITY DEFINER` com `search_path` controlado para calcular IDs autorizados sem consultar recursivamente a própria tabela protegida.

### Modelo de autorização validado

- **Secretaria:** gestão administrativa da escola.
- **Professor:** acesso às turmas e disciplinas atribuídas.
- **Professor:** edição de notas, trabalhos e assiduidade apenas nas turmas atribuídas.
- **Aluno:** acesso aos próprios dados e conteúdos autorizados.
- **Encarregado:** acesso apenas aos alunos associados.

O campo persistente de papel em `professores` separa:

```text
secretaria
professor
```

A autorização já não deve depender exclusivamente de `user_metadata` enviado pelo cliente.

## 4. Teste de carga final

### Configuração

- Workers simultâneos: **8**
- Rondas: **12**
- Pedidos totais: **96**
- Leituras: **77**
- Escritas transaccionais: **19**
- Perfis: secretaria, aluno e encarregado
- Operação de escrita: RPC segura `gerar_tokens_acesso`
- Operações de leitura: alunos, trabalhos, assiduidade e validação de tokens

### Resultado geral

| Métrica | Resultado |
|---|---:|
| Pedidos | **96** |
| Sucessos HTTP 200 | **96** |
| Erros | **0** |
| Duração | **3,246 s** |
| Throughput | **29,57 pedidos/s** |
| Latência média | **262,87 ms** |
| P50 | **210,68 ms** |
| P95 | **565,38 ms** |
| Latência máxima | **686,06 ms** |

### Leituras

| Métrica | Resultado |
|---|---:|
| Pedidos | 77 |
| Latência média | 264,71 ms |
| P50 | 210,47 ms |
| P95 | 565,38 ms |
| Máxima | 686,06 ms |

### Escritas

| Métrica | Resultado |
|---|---:|
| Transacções | 19 |
| Latência média | 255,41 ms |
| P50 | 210,68 ms |
| P95 | 415,31 ms |
| Máxima | 684,04 ms |
| Erros | 0 |

### Limpeza pós-teste

- Foi feita uma rotação final para controlar o último par de tokens.
- O token de aluno foi consumido.
- O token de encarregado foi consumido.
- A validação posterior confirmou que ambos ficaram inactivos.

Os registos históricos inactivos continuam sujeitos à limpeza administrativa através de `LIMPAR_TOKENS_TESTE.sql`.

## 5. Verificação de acesso anónimo

Foram efectuados pedidos sem sessão autenticada.

| Verificação | Resultado |
|---|---|
| Leitura anónima de alunos | HTTP 200 com lista vazia |
| Leitura anónima de professores | HTTP 200 com lista vazia |
| Geração anónima de tokens | Bloqueada com erro de sessão necessária |
| Login com credenciais inválidas | Rejeitado com `invalid_credentials` |
| Leitura de dados de negócio sem sessão | Sem dados devolvidos |

A resposta HTTP 200 com `[]` é compatível com RLS: o endpoint existe, mas não revela linhas.

## 6. Logs e tentativas de acesso

Foram procuradas, através da API pública disponível, tabelas de aplicação com nomes comuns:

- `security_events`
- `audit_logs`
- `logs`
- `auth_logs`
- `failed_logins`
- `seguranca_eventos`

Estas tabelas não existem no schema público ou não estão expostas pela API, com respostas `404` do PostgREST.

### Limitação importante

A chave disponível nesta sessão é uma chave de cliente, não uma `service_role` nem uma credencial do Supabase Dashboard. Por isso, não é possível consultar directamente:

- Logs internos de Auth do Supabase.
- Logs Postgres privados.
- Logs de API/edge functions do projecto.
- Histórico completo de IPs e tentativas no painel de segurança.

Assim, o resultado correcto é:

> Não foram encontrados logs de erro ou tabelas públicas de auditoria acessíveis através da API de cliente. Os logs internos do Supabase permanecem por verificar no Dashboard/Log Explorer.

Recomenda-se verificar manualmente no Supabase Dashboard:

1. **Authentication → Logs**
2. **Logs → Postgres**
3. **Logs → API**
4. **Logs → Edge Functions**, se existirem
5. Filtros por `401`, `403`, `429`, `500`, `invalid_credentials` e `infinite recursion`

## 7. Auditoria de código e deployment

### Aprovado

- `npx expo-doctor`: **18/18 checks passed**.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado.
- `git diff --check`: aprovado.
- Não foram encontrados `service_role`, chaves privadas, PATs ou passwords hardcoded.
- Não foram encontrados `eval`, `new Function`, `dangerouslySetInnerHTML` ou WebViews inseguros.
- Foram adicionados headers Vercel:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy`
  - `Permissions-Policy`

### Dependências

`npm audit --omit=dev` reportou dependências transitivas vulneráveis:

- 1 crítica.
- 32 altas.
- 22 moderadas.

As vulnerabilidades estão concentradas em cadeias Expo/Metro, Tailwind, Jest e outras ferramentas transitivas. Não foi executado `npm audit fix --force`, porque o próprio npm indicou alterações breaking em Expo/Tailwind.

Recomendação: actualizar Expo SDK numa branch dedicada, executar testes completos e só depois publicar.

## 8. Riscos ainda abertos

### Alta prioridade

1. **Rate limiting dos tokens**
   - Os códigos continuam curtos.
   - Falta limite robusto por IP, código e dispositivo.
   - Recomenda-se expiração, tentativas máximas e bloqueio progressivo.

2. **Convites de professor**
   - O novo modelo restringe `registar_professor`.
   - O fluxo ideal é a secretaria criar um convite único para o professor.
   - O auto-registo público não deve permitir escolher arbitrariamente uma escola.

3. **Storage de trabalhos**
   - Validar no servidor a relação aluno → turma → trabalho.
   - Definir limite de tamanho e MIME types.
   - Usar URLs assinados e bucket privado.

### Prioridade média

1. Criar uma tabela de auditoria para eventos de segurança.
2. Criar RPC `marcar_notificacao_lida` que só altera `lida_em`.
3. Limitar alterações de avisos ao autor ou secretaria autorizada.
4. Substituir a policy pública de escolas por view/RPC com apenas `id`, `nome` e `provincia`.
5. Actualizar dependências npm de forma controlada.
6. Avaliar `expo-secure-store` para tokens no native.

## 9. Conclusão

A ronda final confirmou que as policies RLS corrigidas suportam os fluxos funcionais e um teste misto de carga sem erros:

```text
27/27 testes de segurança aprovados
96/96 pedidos de carga aprovados
0 erros no teste final
0 recursões RLS
0 tokens activos deixados pelo teste
```

A plataforma encontra-se numa posição muito mais segura do que antes da auditoria. O próximo trabalho prioritário não é adicionar “armadilhas” contra atacantes, mas implementar controlos defensivos auditáveis: rate limiting, convites de professor, Storage estrito, logs de segurança e actualização de dependências.


## 10. Ronda adicional de produção — 17 de Outubro de 2026

Foram implementadas localmente as seguintes melhorias:

- Convites únicos de professores, com hash SHA-256, validade de 7 dias e utilização única.
- Remoção do selector público de escolas no auto-registo de professores.
- Activação do professor pelo email correspondente ao convite.
- Compatibilidade com confirmação de email através de convite pendente no login.
- Tokens de aluno/encarregado preparados para códigos hexadecimais de 12 caracteres.
- Expiração de tokens em 7 dias.
- Bloqueio de tokens expirados, consumidos ou bloqueados.
- Bucket privado para trabalhos.
- Limite de ficheiros de 10 MB.
- Lista de MIME types permitidos.
- Validação do caminho escola/trabalho/aluno no Storage.
- Validação local de tamanho, MIME e nome do ficheiro.
- Edge Function `validar-token` com janela de rate limiting por IP e user-agent.
- Respostas genéricas para convites inválidos.
- Limpeza ocasional das janelas de rate limiting antigas.
- `tsconfig` separado do runtime Deno da Edge Function.

### Resultado da nova validação

- TypeScript: aprovado.
- Build web Expo: aprovado.
- Suite pós-endurecimento: **27/27 aprovada**.
- Teste de carga: **96/96 pedidos aprovados**.
- Erros de carga: **0**.
- Recursões RLS: **0**.
- Limpeza de pares temporários: aprovada.

### Último teste de carga

| Métrica | Resultado |
|---|---:|
| Workers | 8 |
| Rondas | 12 |
| Pedidos | 96 |
| Sucessos HTTP 200 | 96 |
| Erros | 0 |
| Duração | 3,049 s |
| Throughput | 31,49 pedidos/s |
| Latência média | 237,50 ms |
| P50 | 202,25 ms |
| P95 | 541,87 ms |
| Máxima | 630,91 ms |

### Pendências externas ao código

A migração `HARDENING_PRODUCAO_CONVITES_UPLOADS.sql` e a Edge Function ainda precisam ser publicadas no projecto Supabase. O ambiente actual não possui Supabase CLI nem credencial `service_role`, pelo que não foi possível aplicar estas alterações automaticamente sem pedir acesso administrativo.

Até à publicação da Edge Function, o frontend mantém um fallback explícito para a RPC antiga, garantindo que a aplicação não fica indisponível durante a migração. Depois do deploy, a pré-validação passará pelo rate limiting server-side.

O comando `npx expo-doctor` foi executado, mas o check de configuração falhou por timeout de rede ao contactar `exp.host:443`; não foi reportado erro estrutural da aplicação. O typecheck e o build concluíram com sucesso.


## 11. Actualização conservadora de dependências

Foram actualizadas apenas dependências compatíveis dentro das versões maiores actuais do projecto:

- `@hookform/resolvers`
- `@supabase/supabase-js`
- `nativewind`
- `react-hook-form`
- `tailwindcss`
- `zod`

Não foi executado `npm audit fix --force`, porque o relatório inclui alterações breaking para Expo/React Native. Depois da actualização, o typecheck, o build, os testes RLS e o teste de carga foram repetidos com sucesso.

O `npm audit` ainda reporta 55 vulnerabilidades transitivas: 1 crítica, 32 altas e 22 moderadas. A correcção completa exige uma actualização dedicada do Expo SDK numa branch própria, com testes nativos Android/iOS.

### Resultado final após dependências

- TypeScript: aprovado.
- Build web: aprovado.
- Suite RLS/autenticação: **27/27 aprovada**.
- Carga: **96/96 aprovada**.
- Erros: **0**.
- Throughput: **36,23 pedidos/s**.
- Latência média: **209,95 ms**.
- P50: **206,07 ms**.
- P95: **259,07 ms**.
- Máxima: **297,90 ms**.


## 12. Fluxo real do professor no Supabase — aprovado

Depois da correcção de compatibilidade de funções PostgreSQL, foi executado um fluxo real completo com uma conta de professor de teste:

| Verificação | Resultado |
|---|---|
| Login da secretaria | Aprovado |
| Secretaria cria convite | Aprovado |
| Professor cria conta | Aprovado |
| Professor activa o convite | Aprovado |
| Papel persistente `professor` | Aprovado |
| Professor sem atribuições não lê alunos | Bloqueado |
| Professor sem atribuições não lê turmas | Bloqueado |
| Professor sem atribuições não lê disciplinas | Bloqueado |
| Professor sem atribuições não lê notas | Bloqueado |
| Professor sem atribuições não lê trabalhos | Bloqueado |
| Professor sem atribuições não lê assiduidade | Bloqueado |
| Professor não gera tokens administrativos | Bloqueado |
| Professor não cria trabalho fora de turma | Bloqueado |

Resultado: **14/14 verificações aprovadas**.

A geração de identificadores foi ajustada para usar `gen_random_uuid()`, disponível no schema actual. O hash dos convites usa `md5()` nativo, porque esta instalação não expõe `digest()` nem `gen_random_bytes()`.

## 13. Validação final antes do empacotamento

- Suite geral de autenticação/RLS: **27/27 aprovada**.
- Fluxo real do professor: **14/14 aprovado**.
- Teste de carga: **96/96 aprovado**.
- Erros de carga: **0**.
- TypeScript: aprovado.
- Build web: aprovado.
- Limpeza de tokens temporários: aprovada.

Última carga: 8 workers, 12 rondas, 36,39 pedidos/s, latência média de 207,18 ms, P95 de 284,18 ms e máxima de 439,56 ms.
