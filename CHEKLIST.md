# Kulonga MVP — Checklist de Lançamento
## Lukashi · Custódio Cahilo · 2025

---

## ✅ Frontend Concluído

### Onboarding
- [x] Splash screen com ícone real do Kulonga
- [x] Selecção de província (18 províncias)
- [x] Selecção de língua nacional (5 línguas)
- [x] Selecção de perfil (3 tipos)
- [x] Sessão persistente (não pede login de novo)
- [x] Perfil duplo (professor + encarregado)

### Autenticação
- [x] Login professor (email + senha)
- [x] Login secretaria (email + senha)
- [x] Token OTP encarregado (6 dígitos)
- [x] Selector de perfil duplo
- [x] Logout com limpeza de sessão

### Área do Encarregado
- [x] Painel com foto do aluno
- [x] Notas por trimestre (1º, 2º, 3º)
- [x] Cores semânticas (verde/âmbar/vermelho)
- [x] Coordenador com chamada directa
- [x] Disciplinas com botão ligar professor
- [x] Média geral com barra de progresso
- [x] Ecrã de contactos completo
- [x] Perfil com definições
- [x] TabBar (Notas / Contactos / Perfil)

### Área do Professor
- [x] Painel com métricas (turmas/alunos/pendentes)
- [x] Estado de sincronização
- [x] Lista de turmas com progresso
- [x] Lançamento de notas (Freq/Prova/Exame)
- [x] Média calculada automaticamente
- [x] Relatório completo da turma
- [x] Por género (M/F) com aprovados/reprovados
- [x] Nível de aproveitamento com percentagens
- [x] Lista ordenada por média
- [x] TabBar (Início / Turmas / Notas / Sync)

### Área da Secretaria
- [x] Painel com 4 abas (Início/Turmas/Professores/Alunos)
- [x] Métricas da escola
- [x] Gestão de turmas com pesquisa
- [x] Gestão de professores com chamada directa
- [x] Gestão de alunos com estado do token
- [x] Gerar token com modal de sucesso
- [x] Formulário adicionar professor
- [x] TabBar (Início / Tokens / Adicionar / Alunos)

---

## 🔧 Para Integrar com Supabase

### Passo 1 — Configuração
- [ ] Criar projecto em supabase.com
- [ ] Copiar Project URL e anon key
- [ ] Colar em services/supabase.ts
- [ ] Activar Email Auth no Dashboard

### Passo 2 — Base de dados
- [ ] Aplicar SQL do documento de especificação
      (escolas, alunos, professores, disciplinas,
       notas, encarregados, tokens_acesso)
- [ ] Criar VIEW notas_vigentes
- [ ] Activar RLS em todas as tabelas
- [ ] Activar extensões: pgcrypto, pg_trgm, unaccent
- [ ] Criar bucket Storage: fotos-alunos

### Passo 3 — Autenticação real
- [ ] Descomentar loginComEmail() em services/auth.ts
- [ ] Descomentar validarTokenEncarregado()
- [ ] Descomentar verificarSessao()
- [ ] Criar utilizadores de teste no Supabase Auth
      user_metadata: { papel: 'professor', escola_id: '...' }

### Passo 4 — Dados reais
- [ ] Descomentar buscarNotasAluno() em services/notas.ts
- [ ] Instalar WatermelonDB nativo (expo prebuild)
- [ ] Implementar sincronizarPendentes()
- [ ] Ligar painel encarregado ao Supabase
- [ ] Ligar lançamento de notas ao WatermelonDB

---

## 🚀 Checklist de Lançamento MVP

- [ ] Testar com escola piloto em Namibe ou Luanda
- [ ] Testar offline (sem internet) — lançar notas
- [ ] Testar token OTP com encarregado real
- [ ] Testar em Android 8, 10, 12 e 15
- [ ] Publicar na Play Store (Internal Testing)
- [ ] Criar email de suporte: suporte@kulonga.ao
- [ ] Preparar apresentação para escolas

---

## 📋 Fase 2 — Funcionalidades Futuras

- [ ] Scanner QR Code (expo-camera)
- [ ] Notificações push (expo-notifications)
- [ ] SMS digest semanal (Unitel/Movicel)
- [ ] Suporte áudio línguas nacionais
- [ ] Portal web Next.js
- [ ] Módulo financeiro (propinas e mensalidades)
- [ ] Módulo de frequências e faltas
- [ ] App iOS
- [ ] IA para previsão de abandono escolar
- [ ] Dashboard do Ministério da Educação

---

Kulonga v1.0.0 — Lukashi
© 2025 Custódio Cahilo — Namibe, Angola