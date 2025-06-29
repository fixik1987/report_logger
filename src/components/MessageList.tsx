import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Message } from '@/types/Message';
import { api } from '@/utils/api';
import { Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageListProps {
  messages: Message[];
  onEdit: (message: Message) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onEdit, 
  onRefresh,
  isLoading = false 
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    setDeletingId(id);
    
    try {
      await api.deleteMessage(id);
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No messages found. Create your first message!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg break-words">{message.title}</CardTitle>
                <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(message.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatTime(message.createdAt)}
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(message)}
                  className="flex items-center gap-1 flex-1 sm:flex-none h-10 sm:h-8"
                >
                  <Edit className="h-3 w-3" />
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  disabled={deletingId === message.id}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 flex-1 sm:flex-none h-10 sm:h-8"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sm:hidden">
                    {deletingId === message.id ? 'Deleting...' : 'Delete'}
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
