import apiClient from '../api/client';
import type { Message, MessageRequest, UnreadCount } from '../api/types';

export const messageService = {
  async getInbox(): Promise<Message[]> {
    const response = await apiClient.get<Message[]>('/messages/inbox');
    return response.data;
  },

  async getSentMessages(): Promise<Message[]> {
    const response = await apiClient.get<Message[]>('/messages/sent');
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCount>('/messages/unread-count');
    return response.data.unread;
  },

  async getMessageById(id: number): Promise<Message> {
    const response = await apiClient.get<Message>(`/messages/${id}`);
    return response.data;
  },

  async composeMessage(message: MessageRequest): Promise<Message> {
    const response = await apiClient.post<Message>('/messages', message);
    return response.data;
  },
};
