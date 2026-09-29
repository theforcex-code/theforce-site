import Head from 'next/head';
import dynamic from 'next/dynamic';
const Portfolio = dynamic(() => import('../components/Portfolio'), { ssr: false });
// a intro fica fora do app para ser montada uma única vez
const BootIntro = dynamic(() => import('../components/world/Site').then((m) => m.BootIntro), { ssr: false });
export default function Home() {
  return (
    <>
      <Head>
        <title>THE FORCE</title>
        <meta name="description" content="THE FORCE — Culture & Experience Studio" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
      </Head>
      <BootIntro />
      <Portfolio />
    </>
  );
}
