# Pesquisa funcional: plataformas escolares comparáveis e roadmap do Kulonga

**Destinatários:** equipa de produto da plataforma escolar Kulonga  
**Data:** 12 de Outubro de 2026  
**Base:** resultados de pesquisa fornecidos pela equipa + leitura do repositório actual (`manual-kulonga-perfis.md`, `docs/fluxo-acesso-convite.md`, `db/schema.ts`)

## 1. Resumo executivo

As seis plataformas analisadas convergem num padrão: **a aprendizagem, a avaliação, a comunicação e o acesso familiar são camadas relacionadas, mas nem sempre constituem um sistema escolar autoritativo completo**.

- **Google Classroom, Microsoft Teams for Education, Moodle, Canvas e Schoology** são sobretudo camadas de aprendizagem/colaboração, ligadas a um SIS ou a outra fonte institucional de dados. Mesmo quando têm notas, presenças ou rosters, isso não prova que substituam o registo escolar oficial.
- **PowerSchool** é o comparável mais próximo de um SIS: documenta alunos, matrículas, saúde, disciplina, histórico, horários, presenças, notas, portais familiares e relatórios. Ainda assim, suporte móvel não é prova de suporte offline.
- As capacidades mais recorrentes são: **turmas e matrículas, trabalhos, avaliação/notas, comunicação, portal familiar, notificações, relatórios, permissões e aplicações móveis**.
- **Presença/assiduidade é um ponto de fronteira importante**: em várias plataformas a evidência é apenas de presença numa reunião, de um módulo opcional ou de uma integração separada. No Kulonga, `frequencia` está actualmente a ser usada para MAC; deve ser separada de assiduidade antes de escalar.
- **Offline é limitado** nos comparáveis. Há sincronização de notas ou consulta de conteúdos descarregados, mas não há base para prometer paridade offline, submissões offline ou sincronização automática de todos os módulos.
- **Famílias precisam de uma experiência própria e com limites claros**. Os produtos documentam observadores, portais, resumos de trabalhos, notas e presenças, mas sempre com relações aluno–encarregado, permissões e configuração da escola.
- **Privacidade, controlo de acesso, auditoria e moderação são fundações de produto**, não apenas funcionalidades de administração. Nenhuma fonte analisada prova, por si só, um fluxo completo de protecção infantil, incidentes, encaminhamento e acompanhamento pastoral.

### Recomendação principal

O Kulonga deve evoluir primeiro para uma **plataforma escolar angolana segura e correcta de registos, avaliação, assiduidade e comunicação família–escola**, com integração futura para fontes externas. Não deve tentar copiar integralmente um LMS, um SIS, um pacote de videoconferência ou um sistema de safeguarding de um concorrente.

**Prioridade:**

1. **P0 — segurança e correcção:** modelo de dados escolar, autorização, convites, auditoria, correcção de notas, assiduidade separada, sincronização offline segura e recuperação operacional.
2. **P1 — valor escolar imediato:** trabalhos/tarefas, feedback, portal familiar accionável, notificações de baixo consumo, matrículas/rosters robustos, comunicação moderada, relatórios operacionais e acessibilidade linguística.
3. **P2 — escala e diferenciação:** analytics avançados, integrações, gradebook configurável, conteúdos offline mais amplos, automações, interoperabilidade e módulos especializados — apenas após a fundação estar comprovada em piloto.

## 2. Âmbito e leitura da evidência

Esta síntese usa apenas as fontes oficiais indicadas nos resultados fornecidos. Cada afirmação foi tratada como uma destas categorias:

- **Documentado:** aparece explicitamente na fonte oficial.
- **Condicional:** depende de edição, licença, configuração, integração, aplicação instalada ou política da escola.
- **Inferência:** conclusão de arquitectura ou de produto derivada de várias fontes; não é uma afirmação do fabricante.
- **Não estabelecido:** a pesquisa não fornece evidência suficiente para prometer a capacidade.

As páginas de produto podem descrever o portefólio do fabricante, enquanto a documentação operacional pode restringir a funcionalidade. Por isso, o roadmap deve exigir **teste no contexto angolano e na configuração real da escola** antes de transformar uma capacidade comparável numa promessa do Kulonga.

## 3. Contexto actual do Kulonga

A documentação do repositório descreve um produto já orientado para o ciclo **escola → professor → aluno/encarregado**:

- A secretaria cria escola, turmas, alunos, professores, disciplinas e convites.
- O professor lança MAC, PT e MF por trimestre; os valores são gravados em `notas` e apresentados através de `notas_vigentes`.
- O aluno consulta o boletim.
- O encarregado valida um token de seis dígitos, vê o boletim do filho e contacta professores.
- O RLS já pretende limitar a secretaria à escola, o professor às suas turmas, o aluno a si próprio e o encarregado ao filho.
- Existe fila offline para notas pendentes, com sincronização posterior.
- O onboarding já contempla província e português/Umbundu/Kimbundu.

### Limites relevantes encontrados

1. **Assiduidade não é a mesma coisa que MAC.** O esquema actual usa `tipo = frequencia` para guardar MAC. Isso pode gerar uma interpretação incorrecta de presença diária, atraso ou falta justificada.
2. **A fila offline é estreita.** O repositório documenta sobretudo `notas_pendentes`; não há evidência de cache offline completo de turmas, alunos, trabalhos, notificações ou presenças.
3. **A fonte autoritativa ainda é implícita.** O modelo liga entidades por `escola_id` e `turma_id`, mas necessita de ano lectivo, matrícula efectiva, histórico de alterações, estado e identificadores estáveis.
4. **O convite é um ponto de segurança crítico.** O documento de fluxo já toma boas decisões — tokens separados, pré-validação somente leitura, consumo transaccional, revogação e mensagens genéricas — mas estas regras precisam de testes automatizados e de monitorização.
5. **O produto está centrado no boletim.** Faltam no núcleo documentado trabalhos/tarefas, feedback, avisos, notificações, presenças operacionais, relatórios e um percurso familiar além da consulta de notas.

## 4. Padrões comuns observados

| Área | Padrão observado nos comparáveis | O que significa para o Kulonga |
|---|---|---|
| Identidade e rosters | Turmas, cursos, secções, matrículas e papéis são entidades separadas; integrações SIS podem provisionar listas. | Definir um modelo canónico de escola, ano lectivo, turma, disciplina, matrícula, professor e encarregado antes de criar integrações. |
| Registos de alunos | LMSs importam dados de um SIS; PowerSchool documenta um SIS mais amplo. | Tratar o Kulonga como fonte escolar operacional apenas onde assumir explicitamente a responsabilidade; preparar importação/exportação sem fingir ser um SIS universal. |
| Trabalho pedagógico | Trabalhos, perguntas/testes, materiais, submissões, feedback e rubricas aparecem em vários produtos. | A próxima camada de valor é o trabalho escolar, não uma cópia da interface de um concorrente. |
| Notas | Gradebook, escalas, rubricas, devolução, estados e relatórios são recorrentes; exportação pode ser paga/condicional. | Tornar cálculo, correcções, fecho de período, autoria e auditoria determinísticos. |
| Assiduidade | Reunião online, módulo opcional, LTI ou app separado; PowerSchool é o caso mais abrangente. | Criar assiduidade como domínio próprio, com estados e sessões; nunca reutilizar MAC como presença. |
| Família | Observador, portal, resumo semanal ou páginas parentais; visibilidade é configurável e ligada a um aluno. | Expandir o vínculo encarregado–aluno com consentimento, múltiplos filhos e mínimo privilégio. |
| Comunicação | Avisos, comentários, mensagens, fóruns e reuniões; moderação e políticas variam. | Começar por avisos e mensagens assíncronas moderadas; não começar por chat/vídeo em tempo real. |
| Notificações | Email, push, resumo diário/semanal e, em alguns casos, SMS; há diferenças por papel e configuração. | Usar notificações accionáveis e de baixo consumo, com preferências, consentimento, opt-out e fallback explícito. |
| Relatórios | Roster, notas, actividade, assiduidade, auditoria e relatórios configuráveis. | Entregar primeiro relatórios essenciais à secretaria e ao professor; evitar um construtor genérico prematuro. |
| Mobile/offline | Apps móveis são comuns; offline normalmente é consulta limitada, conteúdo descarregado ou fila de operações. | Documentar exactamente o que funciona sem rede; sincronização deve ser idempotente, observável e recuperável. |
| Segurança e privacidade | RBAC, escopo por escola/distrito, auditoria, retenção e políticas de dados são recorrentes. | Fazer segurança e governança parte da experiência, não apenas da base de dados. |
| Safeguarding | As fontes falam de moderação, acesso, auditoria e privacidade, mas não demonstram um caso de protecção infantil completo. | Não inferir incidentes, encaminhamentos ou acompanhamento pastoral a partir de um simples chat ou log. |

## 5. Matriz comparativa concisa

| Plataforma | Posicionamento e limite de dados | Avaliação/assiduidade | Família e comunicação | Mobile/offline e governança | Implicação para o Kulonga |
|---|---|---|---|---|---|
| **Google Classroom** | Camada de turma, trabalho e avaliação ligada a SIS/OneRoster; não evidência de SIS completo. | Trabalhos, notas, rubricas e feedback; presença documentada sobretudo para relatórios do Meet em edições elegíveis. | Resumos de encarregado sem notas; Stream, comentários, contacto e moderação. | Apps iOS/Android e alguns anexos offline; administração, auditoria e privacidade fortes, dependentes de edição. | Separar boletim, assiduidade, família e SIS; tornar as dependências de edição explícitas. |
| **Microsoft Teams for Education** | Colaboração, turmas e tarefas; SDS lê o sistema de registo e cria equipas. | Tarefas, quizzes, Grades e Insights; relatório de presença é de reunião. | Digest semanal opcional; políticas de chat, reunião, convidados e conteúdo. | Offline actual não estabelecido nas fontes analisadas; políticas M365 e auditoria são amplas. | Priorizar rosters controlados e comunicação assíncrona; não basear assiduidade escolar em reuniões. |
| **Moodle** | LMS altamente configurável; participantes e matrículas não provam SIS completo. | Gradebook, trabalhos, quizzes e módulo Attendance opcional; relatórios e Parent Pages. | Fóruns, mensagens, notificações e papel de encarregado configurável. | App com offline real mas limitado por actividade/plugin; privacidade e permissões configuráveis. | Especificar um modelo de papéis e instalar apenas módulos necessários; testar cada fluxo offline. |
| **Canvas LMS** | LMS com dados institucionais e SIS integrations; não evidência de SIS completo. | Gradebook, SpeedGrader, rubricas; Roll Call Attendance é LTI activável. | Observer/Parent app, Inbox, anúncios, discussões e notificações. | Conteúdo seleccionado read-only offline; papéis e acesso muito configuráveis. | Copiar o princípio de papéis e visibilidade, não a complexidade; assiduidade deve ser explicitamente activada. |
| **Schoology** | LMS K-12 com sincronização de escolas, utilizadores, cursos e matrículas. | Gradebook/mastery; presença pode ser desactivada e pode exigir app separado. | Conta familiar com trabalhos, notas, presenças e calendário, conforme permissões. | Android offline é essencialmente leitura; relatórios e permissões têm limites por canal. | Separar fonte de notas/presenças, família e app; declarar limitações móveis com precisão. |
| **PowerSchool** | SIS documentado para demografia, saúde, matrículas, disciplina, histórico, horários e relatórios. | Gradebook e assiduidade ligados a portais, relatórios e notificações. | Portais pai/aluno, vários filhos, comentários e SchoolMessenger multicanal. | Mobile Android/iOS; offline não estabelecido. Segurança, MFA, RBAC e auditoria são compromissos do fornecedor. | É referência de amplitude de SIS, não um backlog para copiar; adoptar o que resolve o ciclo angolano. |

## 6. Gaps com maior impacto em Angola

### 6.1 Correctude administrativa e confiança no boletim

O Kulonga já tem notas e hierarquia de valores vigentes, mas uma escola precisa de saber **quem lançou, quando, em que período, com que regra, se foi corrigido e se o período está fechado**. Uma nota incorrecta ou atribuída ao aluno/turma errados é um problema de confiança, não apenas um bug de interface.

**Gap:** identificadores, matrícula por ano lectivo, invariantes, estados de publicação, histórico e auditoria ainda não estão descritos como contrato de produto.

### 6.2 Assiduidade escolar real

A pesquisa distingue presença numa videoconferência, módulo Attendance, LTI/app e SIS. O Kulonga usa `frequencia` para MAC, o que deixa uma lacuna funcional e semântica.

**Gap:** diário de presença por sessão/aula, estados `presente`, `ausente`, `atrasado`, `justificado`, comentários, correcção autorizada e relatórios por aluno/turma/período.

### 6.3 Conectividade e dispositivos partilhados

Em Angola, a experiência deve tolerar rede intermitente, dados móveis caros, telemóveis partilhados e utilização por secretarias com equipamento modesto. A evidência comparável recomenda **degradação explícita**, não a promessa vaga de “offline”.

**Gap:** cache local seguro, sincronização idempotente, resolução de conflitos, estado visível, reenvio seguro e comportamento definido para dados atrasados.

### 6.4 Relação familiar e identidade

O token de encarregado é uma boa base de lançamento, mas famílias podem ter vários filhos, mais de um encarregado, números de telefone partilhados e necessidade de revogar acesso. O vínculo deve ser durável e auditável, sem expor dados de outro aluno.

**Gap:** gestão de múltiplos vínculos, reemissão/revogação, consentimento, recuperação de conta, contactos verificados, acessibilidade e notificações por relação familiar.

### 6.5 Comunicação com baixo custo e segurança

Os comparáveis têm anúncios, comentários, mensagens e digests. O Kulonga tem contactos de professores, mas isso não é uma comunicação escolar registada.

**Gap:** avisos por turma/escola, entrega e estado de leitura, mensagens assíncronas moderadas, anexos controlados, denúncias/bloqueio, preferências e fallback de canal. SMS ou outros canais devem ser opt-in, orçamentados e avaliados quanto a privacidade; não devem ser assumidos como gratuitos ou universalmente disponíveis.

### 6.6 Língua, acessibilidade e literacia digital

O onboarding já referencia português, Umbundu e Kimbundu. É necessário levar essa decisão para mensagens de erro, estados de sincronização, notificações, relatórios e ajuda, sem prometer tradução automática de todo o conteúdo escolar.

**Gap:** glossário controlado, conteúdo essencial traduzível, linguagem simples, tamanho de texto, áudio quando fizer sentido e testes com utilizadores de províncias diferentes.

### 6.7 Protecção de dados e safeguarding

As fontes documentam privacidade, papéis, logs, moderação, retenção e segurança. Não documentam automaticamente um fluxo de incidente de criança.

**Gap:** inventário de dados, retenção, exportação/correcção/eliminação conforme política da escola, acesso de suporte com justificação, auditoria, resposta a incidente e um requisito explícito sobre protecção infantil. Um módulo de casos, encaminhamento e acompanhamento só deve ser desenhado após política escolar, requisitos legais e responsáveis estarem definidos.

## 7. Roadmap priorizado

### P0 — segurança, correctude e operação mínima

| Entrega | Decisão de produto | Critérios de aceitação de alto nível |
|---|---|---|
| **Modelo canónico escolar** | Adicionar ano lectivo, período, matrícula, estado do aluno, pertença a turma/disciplina, papéis e identificadores estáveis. Não usar apenas nome, email ou `turma_id` para identidade. | Não é possível gravar nota/presença numa escola, turma ou matrícula incompatível; as operações são escopadas por `escola_id`; duplicados têm regra explícita. |
| **Autorização e convites seguros** | Manter tokens separados para aluno e encarregado; consumir de forma transaccional; permitir expirar/revogar/reemitir; suportar vários encarregados e vários filhos. | Testes de RLS e RPC cobrem IDOR, token repetido/expirado, escalada de papel, escola errada, enumeração e sessão inválida; mensagens externas são genéricas; cada uso é auditado. |
| **Notas determinísticas e auditáveis** | Formalizar MAC/PT/MF, trimestre, escala, arredondamento, fonte, autoria, correcção, publicação e fecho. Evitar que a “nota vigente” esconda conflitos. | Mesma entrada produz o mesmo resultado; cada alteração tem autor/data/motivo; período fechado bloqueia alterações normais; exportação/boletim mostra estado e versão correctos. |
| **Assiduidade como domínio separado** | Criar sessões e estados `presente`, `ausente`, `atrasado`, `justificado`, com comentários e correcção autorizada. Não gravar presença como `tipo='frequencia'` de uma nota MAC. | Secretaria/professor conseguem consultar e corrigir com escopo; o boletim não confunde MAC com presença; relatórios distinguem atraso, falta e justificação. |
| **Sincronização offline segura** | Evoluir `notas_pendentes` para operações com `operation_id`, estado, tentativas, erro legível, timestamps de dispositivo/servidor e idempotência; começar por notas e assiduidade. | Repetir um envio não duplica; o utilizador vê pendentes/sincronizados/falhados; conflito exige regra explícita; não se perde uma nota por fechar a aplicação. |
| **Auditoria, suporte e recuperação** | Registar acesso a dados sensíveis, alterações de notas/presenças, convites, exportações e acesso de suporte; definir cópias de segurança, restauração e resposta a incidente. | A equipa consegue responder “quem viu/alterou o quê e quando”; testes de restauração são executados; acesso de suporte é mínimo, temporário e justificável. |
| **Privacidade por desenho** | Inventariar dados, finalidades, retenção, exportação/correcção/eliminação e fornecedores; bloquear publicidade e usos não necessários; proteger tokens e dados locais. | Política da escola é configurável; dados de uma escola não aparecem noutra; segredos não estão no cliente; logs não contêm tokens completos nem dados desnecessários. |
| **Piloto de qualidade** | Testar em pelo menos duas escolas/províncias com fluxos online, offline, papel de secretaria, professor, aluno e encarregado. | Há métricas de erro de matrícula, notas, presença, convites, sincronização, tempo de resolução e incidentes; nenhum P0 conhecido fica sem responsável. |

### P1 — funcionalidades de alto valor para escolas, alunos e encarregados

| Entrega | Valor local | Guardrails |
|---|---|---|
| **Trabalhos/tarefas e feedback** | Professor publica tarefa, prazo, instrução e anexo; aluno entrega; professor devolve feedback e estado. Cria valor pedagógico além do boletim. | Começar com documentos/imagens e estados simples; limites de tamanho, antivírus quando aplicável e armazenamento com autorização; não iniciar por quizzes complexos. |
| **Painel familiar accionável** | Mostrar próximos prazos, trabalhos em falta/devolvidos, presenças relevantes, avisos e notas publicadas; permitir vários filhos e relação familiar. | Cada cartão indica origem, data e visibilidade; notas e dados de irmãos seguem mínimo privilégio; consentimento/revogação são claros. |
| **Notificações de baixo consumo** | In-app e push onde disponível; resumos configuráveis; fallback SMS apenas após estudo de custo, consentimento e privacidade. | Preferências por papel, opt-out, deduplicação, fila de entrega, estado de falha e conteúdo mínimo no ecrã bloqueado. |
| **Roster e matrículas robustos** | Importação/exportação CSV validada para reduzir trabalho da secretaria e preparar futura integração SIS. | Pré-visualização, validação, relatório de erros, idempotência, confirmação e reversão; não sobrescrever registos silenciosamente. |
| **Avisos e comunicação moderada** | Anúncios escola/turma, comentários controlados, contacto professor–encarregado e histórico de entrega/leitura. | Professor controla público; bloqueio/denúncia; não expor telefone pessoal por defeito; retenção e acesso auditados. |
| **Relatórios essenciais** | Roster, matrículas, notas por período, faltas, atrasos, alunos sem lançamento e actividade de sincronização. | CSV/PDF só para papéis autorizados; filtrar por escola/turma/período; marcar claramente dados provisórios e finais. |
| **Acessibilidade e localização** | Português europeu claro, suporte continuado a línguas configuradas, mensagens simples, visualização de baixa largura de banda e áudio quando necessário. | Traduções geridas como conteúdo versionado; fallback linguístico explícito; testes com professores, alunos e encarregados reais. |
| **Gestão de conta e recuperação** | Recuperação segura, reemissão de convite, troca de dispositivo, sessão visível e saída total; reduzir dependência de credenciais temporárias. | Verificação da identidade pela escola; não revelar se um email existe; limitar tentativas e registar acções sensíveis. |

### P2 — escala, diferenciação e integrações posteriores

| Entrega | Condição para avançar |
|---|---|
| **Gradebook configurável, rubricas, quizzes e escalas** | Regras de avaliação e currículo validadas em escolas-piloto; modelo de notas estável e auditável. |
| **Analytics de aprendizagem e adopção** | Definições de métrica, consentimento, retenção e utilidade pedagógica aprovadas; não transformar presença digital em avaliação automática do aluno. |
| **Integrações SIS/OneRoster e exportação de notas** | Contrato do modelo canónico, mapeamentos angolanos, idempotência e proprietário institucional dos dados definidos. Começar por CSV/API simples, não por uma matriz de integrações. |
| **Offline de conteúdos e submissões** | Telemetria P1 demonstra que a fila de notas/presenças é fiável; cada actividade declara o que sincroniza, como resolve conflito e como marca a hora. |
| **Construtor de relatórios e automações** | Relatórios essenciais cobrem a maioria dos pedidos; RBAC, limites de custo e auditoria já existem. |
| **Chat, vídeo e aulas síncronas** | Existe requisito de utilização e capacidade de suporte; privacidade, moderação, gravação e custo de dados estão resolvidos. Preferir integração existente quando apropriado. |
| **Safeguarding/casos de protecção infantil** | Política da escola, papéis responsáveis, retenção, consentimento, encaminhamento e requisitos legais definidos com especialistas. Não derivar este módulo de um simples sistema de mensagens. |
| **Ecossistema de conteúdos/plugins** | API, revisão de segurança, ciclo de actualizações e modelo de suporte estabelecidos; cada extensão deve declarar dados que lê e escreve. |

## 8. O que **não** construir já

1. **Um SIS completo “à PowerSchool” por imitação.** Primeiro consolidar o núcleo angolano de escola, matrícula, notas, presenças e família; um SIS abrangente traz saúde, disciplina, histórico, conformidade e migração muito maiores.
2. **Um clone de Classroom, Teams, Moodle, Canvas ou Schoology.** Copiar ecrãs não transfere a qualidade dos seus ecossistemas, integrações, suporte ou licenciamento. Adoptar princípios e resolver fluxos locais.
3. **Videoconferência, chat em tempo real e gravação.** São caros em dados, moderação, armazenamento e suporte; iniciar por avisos e mensagens assíncronas.
4. **Um construtor genérico de relatórios e analytics preditivo.** Sem definições de métricas, dados históricos e governança, aumenta ruído e risco de decisões injustas.
5. **Offline total.** Prometer “funciona offline” seria enganador. Entregar operações pequenas, explicitamente suportadas, com fila, idempotência e estados verificáveis.
6. **Integrações SIS complexas antes do modelo canónico.** Começar por importação/exportação validada e uma API estável; cada integração deve ter dono, mapeamento e plano de reconciliação.
7. **Um sistema de safeguarding sem política institucional.** Não inventar categorias de incidente, prazos ou fluxos de encaminhamento sem responsáveis e validação especializada. P0 deve cobrir prevenção, acesso, auditoria e resposta; o caso completo é uma decisão posterior.
8. **SMS/WhatsApp como canal garantido.** Avaliar custo, cobertura, consentimento, identidade, privacidade e continuidade do fornecedor; manter a experiência principal dentro do Kulonga.
9. **IA que classifica risco, comportamento ou desempenho.** Não há necessidade demonstrada e o risco de erro, estigma e explicabilidade é elevado; nenhum indicador deve substituir decisão de professor ou escola.
10. **Gamificação e funcionalidades de vaidade.** Só avançar se resolver uma necessidade pedagógica medida; não competir por cópia de badges, feeds ou rankings.

## 9. Decisões de arquitectura e produto recomendadas

- **Fonte de verdade por domínio:** escola/matrícula, avaliação, assiduidade e comunicação devem ter proprietários e regras de reconciliação explícitos.
- **Papel não é identidade.** Uma pessoa pode ser professor e encarregado, mas cada sessão, autorização e vista deve ser avaliada pelo contexto da escola e do aluno.
- **RLS + camada de serviço + testes de autorização.** A interface não é uma fronteira de segurança; cada RPC e consulta deve validar escola, turma, matrícula e relação familiar.
- **Eventos e auditoria como dados de primeira classe.** “Nota publicada”, “presença corrigida”, “convite revogado” e “exportação criada” precisam de actor, timestamp, motivo e referência.
- **Mobile-first não significa offline-first total.** Mostrar estado de rede e de sincronização, proteger armazenamento local e dar ao utilizador uma forma de recuperar operações falhadas.
- **Configuração regional, não hardcode.** Província, ano lectivo, períodos, escalas, língua, canais e políticas devem ser configuráveis por escola, mantendo defaults seguros.
- **Interoperabilidade pragmática.** CSV bem validado, API documentada e identificadores estáveis podem gerar mais valor inicial do que implementar todos os padrões de uma vez.
- **Métricas de produto orientadas à confiança:** erros de identidade, notas duplicadas, conflitos offline, convites inválidos, tempo de correcção, entrega de avisos e sucesso de acesso familiar.

## 10. Plano de decisão para a equipa

### Nos próximos 30 dias

1. Aprovar o modelo canónico e a separação entre MAC, nota e assiduidade.
2. Fazer threat model dos fluxos de convite, RLS, suporte e sincronização.
3. Definir contrato de nota: cálculo, arredondamento, publicação, fecho, correcção e auditoria.
4. Especificar o MVP de assiduidade e testar com uma secretaria e dois professores.
5. Criar dados de teste multi-escola, multi-filho e utilizador com papéis sobrepostos.

### Nos 60–90 dias seguintes

1. Implementar P0 com testes de integração, restauração e sincronização em rede interrompida.
2. Pilotar numa escola com baixa conectividade e medir o fluxo completo.
3. Implementar trabalhos/tarefas, painel familiar accionável, avisos e relatórios essenciais.
4. Validar textos em português e as línguas configuradas com utilizadores locais.
5. Só depois escolher uma primeira importação/exportação de dados e definir o seu proprietário.

### Gate para P2

Não avançar para integrações amplas, analytics, vídeo ou safeguarding especializado até haver: **zero falhas P0 abertas**, restauração testada, auditoria consultável, taxas de sincronização conhecidas, feedback de famílias/professores e uma política de dados aprovada pela escola piloto.

## 11. Referências

As referências abaixo são as fontes oficiais indicadas na pesquisa fornecida. Funcionalidades condicionais devem ser confirmadas na edição, versão e configuração alvo.

### Google Classroom

- [Produto Google Classroom](https://edu.google.com/intl/ALL_us/workspace-for-education/products/classroom/)
- [Resumos para encarregados](https://support.google.com/edu/classroom/answer/6388136?hl=en)
- [Importação de rosters via SIS](https://support.google.com/edu/classroom/answer/10495270?hl=en)
- [Integrações SIS e exportação de notas](https://support.google.com/edu/classroom/answer/9356588?hl=en)
- [Notas e devolução de trabalhos](https://support.google.com/edu/classroom/answer/6020294?hl=en&co=GENIE.Platform%3DDesktop)
- [Rubricas](https://support.google.com/edu/classroom/answer/9335428?hl=en&co=GENIE.Platform%3DDesktop)
- [Definições do Stream e moderação](https://support.google.com/edu/classroom/answer/6076302?hl=en&co=GENIE.Platform%3DDesktop)
- [Comentários e comunicação](https://support.google.com/edu/classroom/answer/6020274?hl=en&co=GENIE.Platform%3DDesktop)
- [Papéis de administração e encarregados](https://support.google.com/edu/classroom/answer/6071551?hl=en)
- [Relatórios de presença do Meet](https://support.google.com/edu/classroom/answer/10090454?hl=en)
- [Relatórios de utilização](https://support.google.com/edu/classroom/answer/7283376?hl=en)
- [Apps móveis](https://support.google.com/edu/classroom/answer/6118390?hl=en) e [uso offline](https://support.google.com/edu/classroom/answer/11015503?hl=en)
- [Privacidade e segurança Google for Education](https://edu.google.com/intl/ALL_us/why-google/privacy-security/)

### Microsoft Teams for Education

- [Produto Teams for Education](https://www.microsoft.com/en-us/education/products/teams)
- [Assignments e Grades](https://learn.microsoft.com/en-us/microsoftteams/expand-teams-across-your-org/assignments-in-teams)
- [Guia de ensino remoto e Class teams](https://learn.microsoft.com/en-us/microsoftteams/remote-learning-edu)
- [School Data Sync](https://learn.microsoft.com/en-us/microsoftteams/teams-quick-start-guide-edu)
- [Digest semanal para pais/encarregados](https://support.microsoft.com/en-us/education/assignments/send-weekly-assignment-summaries-to-parents-and-guardians)
- [Comunicação com encarregados](https://support.microsoft.com/en-us/teams/education/communicate-with-guardians-in-microsoft-teams)
- [Opções de reunião e presença](https://support.microsoft.com/en-us/teams/meetings/meeting-options-in-microsoft-teams)
- [Governança de Teams para educação](https://learn.microsoft.com/en-us/microsoftteams/plan-teams-governance-edu)
- [Baseline de segurança Microsoft 365 Education](https://learn.microsoft.com/en-us/microsoft-365/education/guide/0-start-baseline/start-baseline-all)

### Moodle

- [Funcionalidades do Moodle LMS](https://moodle.com/solutions/lms/features/)
- [Moodle para K-12](https://moodle.com/solutions/k-12/)
- [Moodle e comunicação](https://moodle.com/functionality-with-moodle/moodle-and-communications/)
- [Inscrição em cursos](https://docs.moodle.org/en/Course_enrolment) e [participantes](https://docs.moodle.org/en/Participants)
- [Actividade Attendance](https://docs.moodle.org/en/Attendance_activity)
- [Papel Parent (documentação de versão antiga)](https://docs.moodle.org/21/en/Parent_role)
- [Permissões](https://docs.moodle.org/en/Permissions)
- [Notificações](https://docs.moodle.org/en/Notifications)
- [Relatórios personalizados](https://docs.moodle.org/en/Custom_reports)
- [Funcionalidades offline da app](https://docs.moodle.org/en/Moodle_app_offline_features)
- [Privacidade](https://docs.moodle.org/en/Data_privacy) e [Privacy](https://docs.moodle.org/en/Privacy)
- [Recomendações de segurança](https://docs.moodle.org/en/Security_recommendations)

### Canvas LMS

- [Visão geral do Canvas](https://community.instructure.com/en/kb/articles/662716-what-is-canvas)
- [Canvas para K-12](https://www.instructure.com/k12)
- [FAQ de privacidade institucional](https://www.instructure.com/privacy-security/institutions-educators-faq)
- [FAQ de privacidade de alunos e pais](https://www.instructure.com/privacy-security/students-parents-faq)
- [Papéis e permissões](https://community.instructure.com/t5/Admin-Guide/What-user-roles-and-permissions-are-available-in-Canvas/ta-p/102)
- [Roll Call Attendance](https://community.instructure.com/en/kb/articles/662770-what-is-the-roll-call-attendance-tool)
- [Course Analytics](https://community.instructure.com/en/kb/articles/662739-what-is-course-analytics)
- [Notificações](https://community.instructure.com/en/kb/articles/662894-how-do-i-manage-my-canvas-notification-settings)
- [App Canvas](https://community.instructure.com/en/kb/articles/662784-what-is-the-canvas-app)
- [Offline Android](https://community.instructure.com/en/kb/articles/661720-how-do-i-view-course-content-offline-in-the-canvas-app-on-my-android-device) e [offline iOS](https://community.instructure.com/en/kb/articles/661650-how-do-i-view-course-content-offline-in-the-canvas-app-on-my-ios-device)

### Schoology

- [Schoology como LMS K-12](https://www.powerschool.com/products/classroom/learning-management/)
- [Página inicial para pais](https://uc.powerschool-docs.com/en/schoology/latest/home-page-overview-parents)
- [Notificações](https://uc.powerschool-docs.com/en/schoology/latest/personal-account-notifications)
- [Modo offline Android](https://uc.powerschool-docs.com/en/schoology/latest/using-mobile-offline-mode-on-the-schoology-android-app)
- [Presença](https://uc.powerschool-docs.com/en/schoology/latest/courses-attendance-students)
- [Papéis e permissões](https://uc.powerschool-docs.com/en/schoology/latest/set-up-roles-and-permissions) e [permissões administrativas](https://uc.powerschool-docs.com/en/schoology/latest/administration-settings-permissions)
- [Provisionamento via PowerSchool SIS](https://uc.powerschool-docs.com/en/schoology/latest/powerschool-sis-provisioning-guide)
- [Comunicação](https://uc.powerschool-docs.com/en/schoology/latest/homepage-tools-and-communication)
- [Relatórios de avaliação](https://uc.powerschool-docs.com/en/schoology/latest/assessment-reporting-and-item-analysis)
- [Segurança PowerSchool](https://www.powerschool.com/security/) e [privacidade](https://www.powerschool.com/privacy/)

### PowerSchool

- [PowerSchool SIS](https://www.powerschool.com/solutions/student-information-system/powerschool-sis/)
- [Recursos para pais e alunos](https://www.powerschool.com/community-support/parent-student-resource-center/)
- [PowerSchool Mobile](https://www.powerschool.com/solutions/communication/powerschool-mobile/)
- [SchoolMessenger](https://www.powerschool.com/solutions/communication/schoolmessenger/)
- [Relatórios do PowerSchool SIS](https://www.powerschool.com/powerschool-sis-reporting/)
- [Papéis e permissões](https://support.powerschool.com/help/sms/800/districtuser/Content/Topics/Managing_roles.htm)
- [Security & Trust Center](https://www.powerschool.com/security/)
- [Declaração de privacidade](https://www.powerschool.com/privacy/)

## Conclusão

O diferencial sustentável do Kulonga não será ter mais botões do que os comparáveis. Será **ser confiável para o ciclo escolar real angolano**, funcionar com conectividade imperfeita, proteger relações entre aluno e encarregado, respeitar o papel da escola como proprietária dos dados e tornar notas, presenças e comunicações explicáveis. A ordem correcta é: **segurança e correctude primeiro; tarefas e família depois; escala e integrações só quando a fundação estiver demonstrada**.
