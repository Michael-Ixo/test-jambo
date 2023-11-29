import * as AssistantTypes from '../types/assistant';
import Observable from './observer';
export default class Assistant extends Observable {
    private url;
    private apiKey;
    private address;
    private did;
    private network;
    private count;
    private id?;
    private messages;
    private transactionHandler?;
    constructor({ apiKey, address, did, network, assistantUrl }: AssistantTypes.Config);
    private resetCount;
    private incrementCount;
    private get countExceeded();
    private addMessage;
    private addStreamMessage;
    private requestNewChat;
    private requestChat;
    private requestChatStream;
    private requestNewChatStream;
    newChat(stream?: boolean, contextMessages?: AssistantTypes.ChatMessage[]): Promise<AssistantTypes.ChatMessage[]>;
    chat(stream: boolean, message: string): Promise<AssistantTypes.ChatMessage[]>;
    private assistantChat;
    private handleTransaction;
    onTransaction(handler: AssistantTypes.TransactionHandler): Promise<void>;
    get getMessages(): AssistantTypes.ChatMessage[];
}
