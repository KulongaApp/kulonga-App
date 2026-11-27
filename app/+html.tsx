import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// Documento HTML base da versão web: título, cor da barra no telemóvel,
// ícone de instalação e fundo (evita o flash branco antes de a app carregar).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-AO">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>Kulonga — A escola no teu bolso</title>
        <meta name="description" content="Notas, avisos e gestão escolar para alunos, encarregados, professores e secretaria." />
        <meta name="theme-color" content="#123C69" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background-color:#F6EFE3}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
