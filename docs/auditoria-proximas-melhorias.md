# Auditoria técnica e funcional — próximas melhorias do KULONGA

## Estado verificado

A versão actual passa `npm run typecheck` e `npm run build`. A auditoria de rotas não encontrou referências a páginas inexistentes depois da remoção da página redundante de perfil no onboarding.

O `expo-doctor` passa 17 de 18 verificações. A única verificação pendente é informativa: o WatermelonDB ainda não tem validação declarada para a New Architecture e `@nozbe/simdjson` não tem metadados no React Native Directory. Não é um erro de compilação, mas deve ser acompanhado antes de actualizar o Expo novamente.

## Prioridade P0 — corrigir antes de produção

### 1. Remover métricas fictícias do painel do professor

`app/(professor)/painel.tsx` ainda usa `ProfessorMock`, `notasLancadas: 0` e `notasPendentes: 0`. As turmas e o número de alunos são consultados, mas o progresso de notas continua sempre a zero.

**Acção:** criar uma consulta agregada ou uma RPC que devolva, por turma e disciplina, o total de alunos, notas vigentes e notas pendentes. Enquanto a consulta não existir, o painel deve mostrar “Sem dados de notas” em vez de uma percentagem que parece real.

### 2. Tornar o ano lectivo configurável

O texto `2025/2026` aparece directamente no código em vários ecrãs, incluindo sidebar, secretaria, encarregado e boletim.

**Acção:** guardar o ano lectivo na tabela `escolas`, carregá-lo no contexto da sessão e usar um valor configurável nas definições da secretaria. Não deve haver valores escolares fixos no frontend.

### 3. Substituir `Alert.prompt` na criação de turmas

A secretaria usa `Alert.prompt` para criar turmas. Esse componente não tem comportamento consistente em Android e web, não permite validação adequada e não permite configurar turno/ano lectivo.

**Acção:** criar um modal ou ecrã próprio com nome, ano lectivo, turno, validação inline, loading, sucesso e erro.

### 4. Completar o ciclo de trabalhos

O professor consegue criar trabalhos e o aluno consegue enviar texto. Ainda falta ao professor ver e corrigir entregas.

**Acção:** adicionar lista de entregas por trabalho, estado, nota de 0–20, feedback, data de correcção e actualização das políticas RLS para permitir a correcção apenas ao professor responsável ou secretaria autorizada.

## Prioridade P1 — próxima sprint

### 5. Melhorar o formulário de trabalhos

O professor ainda não escolhe disciplina nem prazo no formulário. A migração já suporta `disciplina_id` e `prazo`, mas o ecrã não os preenche.

Adicionar selector de disciplina, data/hora de prazo e validação de título, descrição e turma antes de enviar.

### 6. Upload de ficheiros

A tabela `entregas_trabalho` já tem `ficheiro_url`, mas o ecrã do aluno ainda só envia texto.

Adicionar bucket privado no Supabase Storage, upload com nome seguro, limite de tamanho, extensão permitida e URL assinada para o professor.

### 7. Testar efectivamente RLS com quatro papéis

As políticas SQL existem, mas precisam de testes reais com contas separadas:

- Secretaria.
- Professor.
- Aluno.
- Encarregado.

Testar leitura, criação, alteração e tentativa de acesso cruzado entre escolas e turmas.

### 8. Substituir `any` e `catch {}` nos fluxos críticos

Ainda existem muitos `as any` e blocos que escondem erros, sobretudo em professor, contactos, sincronização e comunicação escolar.

**Acção:** criar tipos para aluno, professor, turma, nota, trabalho e entrega; mostrar estados de erro no ecrã e enviar detalhes para um mecanismo de logging seguro em produção.

## Prioridade P2 — qualidade de produto

### 9. Centralizar o contexto de sessão e escola

A sidebar mostra “A minha escola” e “Ano lectivo 2025/2026” em vez dos dados reais. Criar um `SchoolSessionProvider` para disponibilizar escola, ano lectivo, utilizador e papel activo a todos os ecrãs.

### 10. Sincronização offline além das notas

O modo offline cobre notas pendentes, mas não cobre tarefas, avisos, assiduidade ou alterações de perfil. Definir quais operações podem funcionar offline e mostrar claramente o estado de sincronização por domínio.

### 11. Rever acessibilidade

Adicionar `accessibilityRole`, `accessibilityLabel` e estados seleccionados a todos os botões de ícone. Garantir contraste de texto secundário, foco visível na web e áreas de toque de pelo menos 44–48 px.

### 12. Uniformizar os ecrãs antigos

Alguns ecrãs ainda usam estilos próprios em vez de `Button`, `Input`, `Card`, cabeçalho e estados partilhados. A próxima ronda deve reduzir duplicação visual, sobretudo em boletim, notas, perfis e sincronização.

## Conclusão

A base de navegação e o onboarding estão agora coerentes. O maior risco já não é visual: é apresentar dados incompletos como se fossem reais. A ordem recomendada é:

1. Métricas reais do professor.
2. Ano lectivo real e configurável.
3. Modal profissional para criar turma.
4. Correcção e feedback de trabalhos.
5. Upload de ficheiros.
6. Testes RLS com contas reais.
7. Tipagem, erros e offline.
