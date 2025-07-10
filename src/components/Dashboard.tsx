import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { MessageList } from './MessageList';
import { ReportsList } from './ReportsList';
import { AddReportForm } from './AddReportForm';
import { ReportFilters } from './ReportFilters';
import { Message } from '@/types/Message';
import { api } from '@/utils/api';
import { LogOut, Plus, MessageSquare, FileText, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: number;
  category_id: number;
  issue_id: number;
  solution_id: number;
  datetime: string;
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

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [issues, setIssues] = useState<{id: number, description: string, category_id: number, category_name: string}[]>([]);
  const [solutions, setSolutions] = useState<{id: number, desc: string, category_id: number, category_name: string}[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [currentSection, setCurrentSection] = useState<'messages' | 'reports'>('reports');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    selectedCategory: null as number | null,
    selectedIssue: null as number | null,
    selectedSolution: null as number | null,
  });
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

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await api.getReports(filters);
      console.log('Loaded reports:', data.length, 'reports');
      setReports(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports from database",
        variant: "destructive",
      });
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotalReports = async () => {
    try {
      const data = await api.getReports();
      setTotalReports(data);
    } catch (error) {
      console.error('Failed to load total reports:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadIssues = async () => {
    try {
      const data = await api.getIssuesWithCategories();
      setIssues(data);
    } catch (error) {
      console.error('Failed to load issues:', error);
    }
  };

  const loadSolutions = async () => {
    try {
      const data = await api.getSolutionsWithCategories();
      setSolutions(data);
    } catch (error) {
      console.error('Failed to load solutions:', error);
    }
  };

  useEffect(() => {
    // Always load both reports and messages to keep tab counts accurate
    loadReports();
    loadMessages();
    loadCategories();
    loadIssues();
    loadSolutions();
    loadTotalReports();
  }, []);

  useEffect(() => {
    if (currentSection === 'messages') {
      loadMessages();
    } else {
      loadReports();
    }
  }, [currentSection, filters]);

  // Refresh data when component mounts and when returning to list view
  useEffect(() => {
    if (currentView === 'list') {
      // Always load both to keep counts accurate
      loadReports();
      loadMessages();
      loadTotalReports();
    }
  }, [currentView, filters]);

  // Refresh data when the page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentView === 'list') {
        // Always load both to keep counts accurate
        loadReports();
        loadMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentView, filters]);

  const handleCreateNew = () => {
    setEditingMessage(null);
    setEditingReport(null);
    setCurrentView('create');
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setEditingReport(null);
    setCurrentView('edit');
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setEditingMessage(null);
    setCurrentView('edit');
  };

  const handleFormSuccess = () => {
    console.log('Form success - refreshing data...');
    if (currentSection === 'messages') {
      loadMessages();
    } else {
      loadReports();
    }
    setCurrentView('list');
    setEditingMessage(null);
    setEditingReport(null);
  };

  const handleRefresh = () => {
    // Always refresh both to keep counts accurate
    loadReports();
    loadMessages();
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      selectedCategory: null,
      selectedIssue: null,
      selectedSolution: null,
    });
  };

  const handleExportToExcel = async () => {
    try {
      if (reports.length === 0) {
        toast({
          title: "No Reports",
          description: "There are no reports to export",
          variant: "destructive",
        });
        return;
      }

      // Get the IDs of currently visible reports
      const reportIds = reports.map(report => report.id);
      
      toast({
        title: "Exporting...",
        description: "Preparing Excel file...",
      });

      const blob = await api.exportReportsToExcel(reportIds);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reports_export_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${reports.length} reports to Excel`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export reports to Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Report Logger</h1>
            <p className="text-gray-600">Welcome back, {user?.username}!</p>
          </div>
          <Button 
            onClick={logout} 
            variant="outline" 
            className="flex items-center gap-2 w-full sm:w-auto h-12 sm:h-10"
          >
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
              className="flex items-center gap-2 h-12 sm:h-10"
            >
              ← Back to List
            </Button>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'list' && (
          <>
            {/* Section Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={currentSection === 'reports' ? 'default' : 'outline'}
                onClick={() => setCurrentSection('reports')}
                className="flex items-center gap-2 h-12 sm:h-10"
              >
                <FileText className="h-4 w-4" />
                Reports ({totalReports.length})
              </Button>
              <Button
                variant={currentSection === 'messages' ? 'default' : 'outline'}
                onClick={() => setCurrentSection('messages')}
                className="flex items-center gap-2 h-12 sm:h-10"
              >
                <MessageSquare className="h-4 w-4" />
                Messages ({messages.length})
              </Button>
            </div>

            {/* Reports Section */}
            {currentSection === 'reports' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Reports (
                        {filters.dateFrom || filters.dateTo || filters.selectedCategory || filters.selectedIssue || filters.selectedSolution 
                          ? `${reports.length} of ${totalReports.length}`
                          : totalReports.length
                        }
                      )
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleExportToExcel}
                      disabled={reports.length === 0 || isLoading}
                      variant="outline"
                      className="flex items-center gap-2 w-full sm:w-auto h-12 sm:h-10"
                    >
                      <Download className="h-4 w-4" />
                      Create Excel Report
                    </Button>
                  <Button 
                    onClick={handleCreateNew} 
                    className="flex items-center gap-2 w-full sm:w-auto h-12 sm:h-10"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Report
                  </Button>
                  </div>
                </div>
                
                <ReportFilters
                  categories={categories}
                  issues={issues}
                  solutions={solutions}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  isOpen={filtersOpen}
                  onToggle={() => setFiltersOpen(!filtersOpen)}
                />
                
                <ReportsList 
                  reports={reports} 
                  onEdit={handleEditReport}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              </>
            )}

            {/* Messages Section */}
            {currentSection === 'messages' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Your Messages ({messages.length})
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleCreateNew} 
                    className="flex items-center gap-2 w-full sm:w-auto h-12 sm:h-10"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Message
                  </Button>
                </div>
                <MessageList 
                  messages={messages} 
                  onEdit={handleEditMessage}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              </>
            )}
          </>
        )}

        {currentView === 'create' && (
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle>
                {currentSection === 'reports' ? 'Create New Report' : 'Create New Message'}
              </CardTitle>
              <CardDescription>
                {currentSection === 'reports' 
                  ? 'Add a new report to your collection' 
                  : 'Add a new message to your collection'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSection === 'reports' ? (
                <AddReportForm 
                  onSuccess={handleFormSuccess}
                  onCancel={() => setCurrentView('list')}
                />
              ) : (
                <AddReportForm 
                  onSuccess={handleFormSuccess}
                  onCancel={() => setCurrentView('list')}
                />
              )}
            </CardContent>
          </Card>
        )}

        {currentView === 'edit' && (editingMessage || editingReport) && (
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle>
                {currentSection === 'reports' ? 'Edit Report' : 'Edit Message'}
              </CardTitle>
              <CardDescription>
                {currentSection === 'reports' 
                  ? 'Update your report' 
                  : 'Update your message'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddReportForm 
                message={currentSection === 'reports' ? editingReport : editingMessage}
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
