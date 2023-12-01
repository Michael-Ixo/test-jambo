import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@ixo/assistant-sdk/types/types/assistant';

import styles from './Messages.module.scss';
import ColoredIcon, { ICON_COLOR } from '@components/ColoredIcon/ColoredIcon';
import UserIcon from '@icons/user_icon.svg';
import AssistantIcon from '@icons/assistant_icon.svg';

type MessagesProps = {
  messages: ChatMessage[];
};

const Messages = ({ messages }: MessagesProps) => {
  return (
    <div className={styles.chatContainer}>
      {(messages ?? []).map((message: any, index: number) => (
        <div key={index} className={styles.messageContainer}>
          {message.role === 'user' ? (
            <div className={styles.row}>
              <ColoredIcon color={ICON_COLOR.grey} size={20} icon={UserIcon} /> <h6>You</h6>
            </div>
          ) : (
            <div className={styles.row}>
              <ColoredIcon color={ICON_COLOR.primary} size={20} icon={AssistantIcon} /> <h6>Assistant</h6>
            </div>
          )}
          <span className={styles.message}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </span>
        </div>
      ))}
    </div>
  );
};

export default Messages;
