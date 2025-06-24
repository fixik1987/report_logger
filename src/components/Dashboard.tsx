import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { MessageList } from './MessageList';
import { MessageForm } from './MessageForm';
import { Message } from '@/types/Message';
import { api } from '@/utils/api';
import { LogOut, Plus, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMessages();
      setMessages(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages from database",
        variant: "destructive",
      });
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleCreateNew = () => {
    setEditingMessage(null);
    setCurrentView('create');
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setCurrentView('edit');
  };

  const handleFormSuccess = () => {
    loadMessages();
    setCurrentView('list');
    setEditingMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Message Logger</h1>
            <p className="text-gray-600">Welcome back, {user?.username}!</p>
          </div>
          <Button onClick={logout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Navigation */}
        {currentView !== 'list' && (
          <div className="mb-6">
            <Button 
              onClick={() => setCurrentView('list')} 
              variant="ghost"
              className="flex items-center gap-2"
            >
              ← Back to Messages
            </Button>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'list' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Messages ({messages.length})
              </h2>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Message
              </Button>
            </div>
            <MessageList 
              messages={messages} 
              onEdit={handleEdit}
              onRefresh={loadMessages}
              isLoading={isLoading}
            />
          </>
        )}

        {currentView === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Message</CardTitle>
              <CardDescription>Add a new message to your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageForm 
                onSuccess={handleFormSuccess}
                onCancel={() => setCurrentView('list')}
              />
            </CardContent>
          </Card>
        )}

        {currentView === 'edit' && editingMessage && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Message</CardTitle>
              <CardDescription>Update your message</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageForm 
                message={editingMessage}
                onSuccess={handleFormSuccess}
                onCancel={() => setCurrentView('list')}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
