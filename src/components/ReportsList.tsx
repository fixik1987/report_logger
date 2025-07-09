import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/utils/api';
import { Edit, Trash2, Calendar, Clock, Tag, AlertTriangle, CheckCircle, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://192.168.68.113:3001';

interface Report {
  id: number;
  category_id: number;
  issue_id: number;
  solution_id: number;
  datetime_created: string;
  datetime_done: string | null;
  notes: string;
  pic_name1?: string | null;
  pic_name2?: string | null;
  pic_name3?: string | null;
  status: string;
  priority: string;
  escalate_name?: string | null;
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
  const [fileSizes, setFileSizes] = useState<{[key: string]: string}>({});
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

  const handleDeletePicture = async (reportId: number, pictureField: string, picturePath: string) => {
    if (!confirm('Are you sure you want to delete this picture?')) {
      return;
    }

    try {
      // Call API to delete the picture
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/picture`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field: pictureField, path: picturePath })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Picture deleted successfully",
        });
        onRefresh();
      } else {
        throw new Error('Failed to delete picture');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete picture",
        variant: "destructive",
      });
      console.error('Delete picture error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchFileSizes = async (reports: Report[]) => {
    const allImagePaths = reports.flatMap(report => 
      [report.pic_name1, report.pic_name2, report.pic_name3].filter(Boolean)
    );
    
    if (allImagePaths.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/file-sizes?${allImagePaths.map(path => `files=${encodeURIComponent(path!)}`).join('&')}`);
        if (response.ok) {
          const sizes = await response.json();
          const formattedSizes: {[key: string]: string} = {};
          Object.entries(sizes).forEach(([path, size]) => {
            if (size !== null) {
              formattedSizes[path] = formatFileSize(size as number);
            } else {
              formattedSizes[path] = 'Unknown';
            }
          });
          setFileSizes(formattedSizes);
        }
      } catch (error) {
        console.error('Failed to fetch file sizes:', error);
      }
    }
  };

  // Fetch file sizes when reports change
  useEffect(() => {
    if (reports.length > 0) {
      fetchFileSizes(reports);
    }
  }, [reports]);

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
                    {formatDate(report.datetime_created)}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatTime(report.datetime_created)}
                  </span>
                  {report.datetime_done && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Done: {formatDate(report.datetime_done)}
                    </span>
                  )}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                <Tag className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Status</p>
                  <p className="text-sm text-gray-700 capitalize">
                    {report.status === 'in_progress' ? 'In Progress' : report.status}
                    {report.status === 'escalate' && report.escalate_name && (
                      <span className="block text-xs text-gray-500">
                        To: {report.escalate_name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border">
                <Tag className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Priority</p>
                  <p className="text-sm text-gray-700 capitalize">{report.priority}</p>
                </div>
              </div>
            </div>
            {report.notes && (
              <div className="pt-2 border-t">
                <p className="text-gray-700 whitespace-pre-wrap break-words">{report.notes}</p>
              </div>
            )}
            {[report.pic_name1, report.pic_name2, report.pic_name3].map((pic, idx) =>
              pic ? (
                <div key={idx} className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Picture {idx+1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={`${API_BASE_URL}${pic}`}
                      alt={`Report attachment ${idx+1}`}
                      className="max-w-full h-auto max-h-48 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(`${API_BASE_URL}${pic}`, '_blank')}
                    />
                    <div className="flex flex-col gap-1">
                      {fileSizes[pic] && (
                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {fileSizes[pic]}
                        </div>
                      )}
                      <Button 
                        type="button" 
                        onClick={() => handleDeletePicture(report.id, `pic_name${idx+1}`, pic)}
                        size="sm" 
                        variant="destructive" 
                        className="h-8 px-3 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 