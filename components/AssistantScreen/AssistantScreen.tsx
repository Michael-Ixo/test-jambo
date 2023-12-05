import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@ixo/assistant-sdk/types/types/assistant';
import Assistant from '@ixo/assistant-sdk';

import AssistantInput from '@components/AssistantInput/AssistantInput';
import { decodeTransactionBody } from '@utils/encoding';
import Messages from '@components/Messages/Messages';
import styles from './AssistantScreen.module.scss';
import { broadCastMessages } from '@utils/wallets';
import { WalletContext } from '@contexts/wallet';
import useEffectOnce from '@hooks/useEffectOnce';
import { ChainContext } from '@contexts/chain';

const AssistantScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const { wallet } = useContext(WalletContext);
  const { chainInfo, chain } = useContext(ChainContext);

  const assistantRef: any = useRef();

  useEffectOnce(() => {
    if (!assistantRef.current) {
      assistantRef.current = new Assistant({
        apiKey: process.env.NEXT_PUBLIC_ASSISTANT_API_KEY!,
        address: wallet.user!?.address,
        did: wallet.user!?.did!,
        network: chain.chainNetwork,
      });
      const observer: any = {
        update: (updatedMessages: ChatMessage[]) => {
          setMessages([...updatedMessages]);
        },
      };
      assistantRef.current.subscribe(observer);
      assistantRef.current.newChat(false);
      return () => {
        assistantRef.current.unsubscribe(observer);
      };
    }
  });

  useEffect(() => {
    if (wallet && chain && assistantRef.current) {
      assistantRef.current.onTransaction((txBody: Uint8Array) => {
        const tx = decodeTransactionBody(txBody);
        return broadCastMessages(wallet, tx.messages, tx.memo, 'average', 'uixo', chainInfo);
      });
    }
  }, [wallet, chain, assistantRef.current]);

  const onSubmit = async (input: string) => {
    setLoading(true);
    await assistantRef.current?.chat(false, input);
    setLoading(false);
  };

  return (
    <div className={styles.assistantContainer}>
      {!!assistantRef.current && <Messages messages={messages ?? []} />}
      <AssistantInput loading={loading} onSubmit={onSubmit} />
    </div>
  );
};

export default AssistantScreen;
