import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* favicon: a marca da The Force (círculo com ponto) */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* a fonte do site desde o 1º paint (a intro não aparece em fonte serifada) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap" />
        {/* fundo base imediato (o app é ssr:false; sem isto pisca preto até o JS) */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { background: #ffffff; }
          html.dark { background: #0b0b0b; }
          body { margin: 0; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          /* 1º paint (antes do JS): só o branco da intro, sem outro carregador na frente */
          #tf-boot { position: fixed; inset: 0; z-index: 9999; background: #ffffff; }
        ` }} />
      </Head>
      <body>
        {/* aplica o tema salvo ANTES do render, evitando flash claro→escuro */}
        <script dangerouslySetInnerHTML={{ __html: `
          try { if (localStorage.getItem('tf_theme') === 'dark') document.documentElement.classList.add('dark'); } catch (e) {}
        ` }} />
        {/* loader inicial (removido pelo app quando a home está pronta) */}
        <div id="tf-boot" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
