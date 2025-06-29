import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/utils/api';
import { Edit, Trash2, Calendar, Clock, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: number;
  category_id: number;
  issue_id: number;
  solution_id: number;
  datetime: string;
  notes: string;
  category_name: string;
  issue_description: string;
  solution_description: string;
}

interface ReportsListProps {
  reports: Report[];
  onEdit: (report: Report) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ReportsList: React.FC<ReportsListProps> = ({ 
  reports, 
  onEdit, 
  onRefresh,
  isLoading = false 
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    setDeletingId(id);
    
    try {
      await api.deleteReport(id);
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
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

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No reports found. Create your first report!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg break-words">{report.category_name}</CardTitle>
                <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(report.datetime)}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatTime(report.datetime)}
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(report)}
                  className="flex items-center gap-1 flex-1 sm:flex-none h-10 sm:h-8"
                >
                  <Edit className="h-3 w-3" />
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(report.id)}
                  disabled={deletingId === report.id}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 flex-1 sm:flex-none h-10 sm:h-8"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sm:hidden">
                    {deletingId === report.id ? 'Deleting...' : 'Delete'}
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">Issue</p>
                  <p className="text-sm text-gray-700">{report.issue_description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Solution</p>
                  <p className="text-sm text-gray-700">{report.solution_description}</p>
                </div>
              </div>
            </div>
            {report.notes && (
              <div className="pt-2 border-t">
                <p className="text-gray-700 whitespace-pre-wrap break-words">{report.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 