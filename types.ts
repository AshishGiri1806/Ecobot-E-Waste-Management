export type Sender = 'user' | 'bot';

export interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Message {
  id: number;
  sender: Sender;
  text: string;
  image?: string; // base64 data URL
  locations?: Location[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}
