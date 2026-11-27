// Corre depois de "expo export --platform web".
// 1) garante que os ficheiros de public/ (manifesto e ícones) existem em dist/
// 2) garante título, cor do tema, manifesto e ícone no index.html
// É seguro correr mais de uma vez.
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const dist = path.join(raiz, 'dist');
const publico = path.join(raiz, 'public');

if (!fs.existsSync(dist)) {
  console.error('pos-build-web: pasta dist não encontrada. Corre primeiro: npx expo export --platform web');
  process.exit(1);
}

// 1) copiar public/ -> dist/ sem apagar nada
if (fs.existsSync(publico)) {
  for (const nome of fs.readdirSync(publico)) {
    const origem = path.join(publico, nome);
    const destino = path.join(dist, nome);
    if (fs.statSync(origem).isFile() && !fs.existsSync(destino)) {
      fs.copyFileSync(origem, destino);
      console.log('pos-build-web: copiado', nome);
    }
  }
}

// 2) preparar o index.html
const ficheiro = path.join(dist, 'index.html');
let html = fs.readFileSync(ficheiro, 'utf8');

if (html.includes('manifest.webmanifest')) {
  console.log('pos-build-web: index.html já está preparado.');
  process.exit(0);
}

const tags = [
  '<meta name="description" content="Notas, avisos e gestão escolar para alunos, encarregados, professores e secretaria." />',
  '<meta name="theme-color" content="#123C69" />',
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<style>body{background-color:#F6EFE3}</style>',
].join('');

html = html.replace(/<html lang="[^"]*"/, '<html lang="pt-AO"');
if (/<title>[\s\S]*?<\/title>/.test(html)) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Kulonga — A escola no teu bolso</title>');
} else {
  html = html.replace('</head>', '<title>Kulonga — A escola no teu bolso</title></head>');
}
if (!html.includes('</head>')) {
  console.error('pos-build-web: index.html sem </head>; nada alterado.');
  process.exit(1);
}
html = html.replace('</head>', tags + '</head>');
fs.writeFileSync(ficheiro, html);
console.log('pos-build-web: index.html actualizado.');
