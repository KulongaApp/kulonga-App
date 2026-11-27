/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#123C69',  // Azul Quadro — botões e marca
        secondary: '#17497E',  // azul médio — cabeçalhos e secções
        ouro:      '#E0A526',  // Ouro Imbondeiro — destaque (nunca texto sobre claro)
        ouroTinta: '#8F5F00',  // ouro escuro — texto e bordas sobre fundo claro
        fundo:     '#F6EFE3',  // Papel Cacimbo — fundo dos ecrãs
        papel:     '#FFFBF3',  // cartões
        tinta:     '#0B1F33',  // texto principal
        mulemba:   '#1A7358',  // aprovado, sucesso
        coral:     '#B83F28',  // alertas, faltas
        nota: {
          boa:     '#1A7358',  // verde Mulemba — nota >= 14
          media:   '#D97706',  // âmbar — nota 10 a 13
          ma:      '#B83F28',  // coral — nota < 10
        },
      },
    },
  },
  plugins: [],
};