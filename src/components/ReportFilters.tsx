import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, X } from 'lucide-react';

interface ReportFiltersProps {
  categories: { id: number; name: string }[];
  issues: { id: number; description: string; category_id: number; category_name: string }[];
  solutions: { id: number; desc: string; category_id: number; category_name: string }[];
  filters: {
    dateFrom: string;
    dateTo: string;
    selectedCategory: number | null;
    selectedIssue: number | null;
    selectedSolution: number | null;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  categories,
  issues,
  solutions,
  filters,
  onFilterChange,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  const handleCategoryChange = (value: string) => {
    const categoryId = value === 'none' ? null : parseInt(value);
    onFilterChange({
      ...filters,
      selectedCategory: categoryId,
    });
  };

  const handleIssueChange = (value: string) => {
    const issueId = value === 'none' ? null : parseInt(value);
    onFilterChange({
      ...filters,
      selectedIssue: issueId,
    });
  };

  const handleSolutionChange = (value: string) => {
    const solutionId = value === 'none' ? null : parseInt(value);
    onFilterChange({
      ...filters,
      selectedSolution: solutionId,
    });
  };

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.selectedCategory !== null || 
    filters.selectedIssue !== null || 
    filters.selectedSolution !== null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              Active
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom" className="text-sm">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo" className="text-sm">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Category</Label>
              <Select
                value={filters.selectedCategory?.toString() || 'none'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Issue</Label>
              <Select
                value={filters.selectedIssue?.toString() || 'none'}
                onValueChange={handleIssueChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id.toString()}>
                      <div className="flex flex-col">
                        <span>{issue.description}</span>
                        <span className="text-xs text-gray-500">{issue.category_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Solution Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Solution</Label>
              <Select
                value={filters.selectedSolution?.toString() || 'none'}
                onValueChange={handleSolutionChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a solution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {solutions.map((solution) => (
                    <SelectItem key={solution.id} value={solution.id.toString()}>
                      <div className="flex flex-col">
                        <span>{solution.desc}</span>
                        <span className="text-xs text-gray-500">{solution.category_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 