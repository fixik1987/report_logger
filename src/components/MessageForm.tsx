import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Message } from '@/types/Message';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const messageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content must be less than 1000 characters'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageFormProps {
  message?: Message;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MessageForm: React.FC<MessageFormProps> = ({ message, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!message;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: message?.title || '',
      content: message?.content || '',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      if (isEditing && message) {
        await api.updateMessage(message.id, data);
        toast({
          title: "Success",
          description: "Message updated successfully",
        });
      } else {
        await api.createMessage(data);
        toast({
          title: "Success",
          description: "Message created successfully",
        });
      }
      onSuccess();
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing ? "Failed to update message" : "Failed to create message",
        variant: "destructive",
      });
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter message title"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          {...register('content')}
          placeholder="Enter message content"
          rows={6}
          className={errors.content ? 'border-red-500' : ''}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Message' : 'Create Message'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}; 