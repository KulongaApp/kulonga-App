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
        primary:   '#C8511B',  // laranja angolano — botões principais
        secondary: '#1D5C8A',  // azul — cabeçalhos e secções
        ouro:      '#B8922A',  // dourado Lukashi — destaques
        fundo:     '#F3F4F6',  // cinza claro — fundo dos ecrãs
        nota: {
          boa:     '#16A34A',  // verde — nota >= 14
          media:   '#D97706',  // âmbar — nota 10 a 13
          ma:      '#DC2626',  // vermelho — nota < 10
        },
      },
    },
  },
  plugins: [],
};