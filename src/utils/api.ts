import { Message } from '@/types/Message';

const API_BASE_URL = 'http://192.168.68.113:3001';

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

  // Get all categories
  async getCategories(): Promise<{id: number, name: string}[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  },

  // Create a new category
  async createCategory(name: string): Promise<{id: number, name: string}> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    
    return await response.json();
  },

  // Update a category
  async updateCategory(id: number, name: string): Promise<{id: number, name: string}> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    
    return await response.json();
  },

  // Get solutions by category
  async getSolutionsByCategory(categoryId: number): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/solutions/category/${categoryId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch solutions by category');
    }
    return await response.json();
  },

  // Get all solutions with categories
  async getSolutionsWithCategories(): Promise<{id: number, desc: string, category_id: number, category_name: string}[]> {
    const response = await fetch(`${API_BASE_URL}/solutions/with-categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch solutions with categories');
    }
    return await response.json();
  },

  // Create a new solution
  async createSolution(desc: string, category_id: number): Promise<{id: number, desc: string, category_id: number}> {
    const response = await fetch(`${API_BASE_URL}/solutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ desc, category_id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create solution');
    }
    
    return await response.json();
  },

  // Update a solution
  async updateSolution(id: number, desc: string, category_id: number): Promise<{id: number, desc: string, category_id: number}> {
    const response = await fetch(`${API_BASE_URL}/solutions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ desc, category_id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update solution');
    }
    
    return await response.json();
  },

  // Get issues by category
  async getIssuesByCategory(categoryId: number): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/issues/category/${categoryId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch issues by category');
    }
    return await response.json();
  },

  // Get all issues with categories
  async getIssuesWithCategories(): Promise<{id: number, description: string, category_id: number, category_name: string}[]> {
    const response = await fetch(`${API_BASE_URL}/issues/with-categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch issues with categories');
    }
    return await response.json();
  },

  // Create a new issue
  async createIssue(description: string, category_id: number): Promise<{id: number, description: string, category_id: number}> {
    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, category_id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create issue');
    }
    
    return await response.json();
  },

  // Update an issue
  async updateIssue(id: number, description: string, category_id: number): Promise<{id: number, description: string, category_id: number}> {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, category_id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update issue');
    }
    
    return await response.json();
  },

  // Delete an issue
  async deleteIssue(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete issue');
    }
    
    return true;
  },

  // Get all reports with optional filtering
  async getReports(filters?: {
    dateFrom?: string;
    dateTo?: string;
    selectedCategory?: number | null;
    selectedIssue?: number | null;
    selectedSolution?: number | null;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.selectedCategory) {
        params.append('categories', filters.selectedCategory.toString());
      }
      if (filters.selectedIssue) {
        params.append('issues', filters.selectedIssue.toString());
      }
      if (filters.selectedSolution) {
        params.append('solutions', filters.selectedSolution.toString());
      }
    }
    
    const url = filters && params.toString() 
      ? `${API_BASE_URL}/reports?${params.toString()}`
      : `${API_BASE_URL}/reports`;
      
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return await response.json();
  },

  // Create a new report
  async createReport(report: { category_id: number, issue_id: number, solution_id: number, notes?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create report');
    }
    
    return await response.json();
  },

  // Update a report
  async updateReport(id: number, updates: { category_id: number, issue_id: number, solution_id: number, notes?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update report');
    }
    
    return await response.json();
  },

  // Delete a report
  async deleteReport(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
    
    return true;
  },
};
