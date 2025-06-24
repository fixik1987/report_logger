import { Message } from '@/types/Message';

const API_BASE_URL = 'http://localhost:3001';

export const api = {
  // Get all messages
  async getMessages(): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/messages`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    // Transform the data to match our Message interface
    return data.map((msg: any) => ({
      id: msg.id.toString(),
      title: msg.title,
      content: msg.content,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    }));
  },

  // Create a new message
  async createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: message.title,
        content: message.content,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create message');
    }
    
    const data = await response.json();
    return {
      id: data.id.toString(),
      title: data.title,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Update a message
  async updateMessage(id: string, updates: Partial<Omit<Message, 'id' | 'createdAt'>>): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: updates.title,
        content: updates.content,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update message');
    }
    
    const data = await response.json();
    return {
      id: data.id.toString(),
      title: data.title,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Delete a message
  async deleteMessage(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
    
    return true;
  },
};
