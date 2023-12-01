import type { NextPage } from 'next';
import { useContext } from 'react';
import cls from 'classnames';

import utilsStyles from '@styles/utils.module.scss';
import Header from '@components/Header/Header';
import Footer from '@components/Footer/Footer';
import Head from '@components/Head/Head';
import config from '@constants/config.json';
import AssistantScreen from '@components/AssistantScreen/AssistantScreen';
import { WalletContext } from '@contexts/wallet';
import IconText from '@components/IconText/IconText';
import SadFace from '@icons/sad_face.svg';

const Home: NextPage = () => {
  const { wallet } = useContext(WalletContext);

  return (
    <>
      <Head title={config.siteName} description={config.siteName + ' dApp'} />

      <Header />

      <main className={cls(utilsStyles.main)}>
        {!wallet?.user?.address || !wallet?.user?.did ? (
          <IconText title='You must be logged in to use the assistant' Img={SadFace} imgSize={50} />
        ) : (
          <AssistantScreen />
        )}
      </main>

      <Footer showActionsButton showAccountButton />
    </>
  );
};

export default Home;
