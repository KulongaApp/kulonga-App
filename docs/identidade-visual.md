# Identidade visual Kulonga

Resumo para quem programa. O manual completo (logótipo, ícone, ecrãs de telemóvel e PC, dois tons) está no manual de marca da Kulonga.

## Cores (fonte única: `constants/marca.ts`)

| Nome | Hex | Uso |
|---|---|---|
| Azul Quadro | `#123C69` | marca, botões, cabeçalhos |
| Azul médio | `#17497E` | secções, estados activos |
| Azul profundo | `#0B2A4A` | menu lateral |
| Ouro Imbondeiro | `#E0A526` | destaque; nunca texto sobre fundo claro |
| Ouro tinta | `#8F5F00` | ouro para texto e bordas sobre fundo claro |
| Verde Mulemba | `#1A7358` | aprovado, sucesso |
| Coral Laterite | `#B83F28` | alertas, faltas, dívidas |
| Cacimbo | `#F6EFE3` | fundo dos ecrãs |
| Papel | `#FFFBF3` | cartões |
| Tinta | `#0B1F33` | texto principal |
| Texto secundário | `#55667A` | legendas e apoio |

Todos os pares texto/fundo usados têm contraste mínimo de 4.5:1. Verde e coral nunca vão sozinhos: levam sempre número, ✓ ou !.

## Regras de código

- Logótipo: usar `assets/logo-mark.png`. Nunca rodar nem esticar. Abaixo de 40 px usar o ícone simplificado (`assets/icon.png`).
- Botões com altura mínima de 48 px no telemóvel (40 px no PC).
- Primário (1.ª–6.ª): cantos de 24 px. Secundário e secretaria: 8 px.
- Código novo importa de `constants/marca.ts`; não escrever hexadecimais soltos.
- Ícones e favicon: `assets/` (app) e `public/` (web e instalação no telemóvel).

## Pendente (precisa de decisão ou de instalação)

- Fontes Lexend e Bricolage Grotesque: instalar `@expo-google-fonts/lexend` e `@expo-google-fonts/bricolage-grotesque` com `npx expo install`, carregar com `useFonts` em `app/_layout.tsx` e definir `fontFamily` nos estilos. Não foi feito para não adicionar dependências sem poder testar.
- Modo escuro completo (hoje só os cartões reagem ao tema do sistema).
