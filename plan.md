# Plano de modernização do KULONGA

## Objectivo
Modernizar a aplicação Expo Router existente sem substituir a lógica real, preservando Supabase, autenticação, RLS, fluxo de convites, notas e assiduidade.

## Design
- **Movimento:** dashboard escolar profissional, inspirado em SaaS administrativo moderno, com densidade informativa controlada.
- **Princípios:** hierarquia clara, acções orientadas à tarefa, acessibilidade primeiro e feedback visível.
- **Paleta:** azul-marinho `#14213D` para navegação e confiança; azul `#2457D6` para acções; laranja `#E66A24` como assinatura Kulonga; verde `#15966A` para estados positivos; fundo `#F5F7FB`; cartões brancos; texto `#172033`.
- **Layout:** sidebar fixa no web largo e compacta no mobile; conteúdo fluido sem tabelas obrigatórias com scroll horizontal.
- **Elementos de assinatura:** marca laranja em indicadores activos, cartões com bordas suaves e ícones Ionicons consistentes.
- **Interacção:** cada acção confirma o resultado; estados loading, vazio, erro, sucesso e sem ligação são explícitos.
- **Tipografia:** hierarquia baseada no sistema nativo do Expo, com títulos fortes, labels compactas e corpo confortável para leitura em telemóvel.
- **Voz:** directa e acolhedora. Ex.: “O que precisa de atenção hoje?” e “Ainda não há registos nesta turma.”
- **Marca:** KULONGA é uma plataforma escolar angolana simples, segura e útil no dia-a-dia da escola.

## Etapas
1. **Shell e design system:** tokens visuais, sidebar responsiva, navegação por permissões e dashboards sem dados fictícios.
2. **Trabalhos/tarefas:** tabelas Supabase, criação pelo professor, consulta/submissão pelo aluno e feedback.
3. **Avisos:** publicação por escola/turma/perfil, histórico e permissões.
4. **Notificações:** centro in-app, não lidas, preferências e criação de eventos a partir de tarefas/avisos/feedback.
5. **Validação:** typecheck, export web, diff check, testes de RLS por papel e verificação em larguras móvel/tablet/desktop.

## Regras de segurança
- Nenhum contador ou actividade será inventado; estados sem dados serão mostrados como vazios.
- Tarefas, avisos e notificações terão `escola_id`, autor, público e RLS.
- Ficheiros de alunos só serão adicionados depois de validar armazenamento, limites e autorização.
- A migração SQL será incremental e não removerá tabelas existentes.
