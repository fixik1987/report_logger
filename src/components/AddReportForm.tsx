import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Message } from '@/types/Message';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const messageSchema = z.object({
  category: z.string().optional(),
  categoryDropdown: z.string().min(1, 'Select a category'),
  solution: z.string().optional(),
  solutionDropdown: z.string().min(1, 'Select a solution'),
  solutionCategoryDropdown: z.string().optional(),
  issue: z.string().optional(),
  issueDropdown: z.string().min(1, 'Select an issue'),
  content: z.string().min(1, 'Notes is required').max(1000, 'Notes must be less than 1000 characters'),
});

type AddReportFormData = z.infer<typeof messageSchema>;

interface AddReportFormProps {
  message?: Message | {
    id: number;
    category_id: number;
    issue_id: number;
    solution_id: number;
    datetime: string;
    notes: string;
    category_name: string;
    issue_description: string;
    solution_description: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddReportForm: React.FC<AddReportFormProps> = ({ message, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!message;
  const [categoryDropdown, setCategoryDropdown] = useState('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Solution states
  const [solutionDropdown, setSolutionDropdown] = useState('');
  const [solutions, setSolutions] = useState<string[]>([]);
  const [solutionsWithCategories, setSolutionsWithCategories] = useState<{id: number, desc: string, category_id: number, category_name: string}[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(true);
  const [newSolutionName, setNewSolutionName] = useState('');
  const [isAddingSolution, setIsAddingSolution] = useState(false);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [showEditSolutionModal, setShowEditSolutionModal] = useState(false);
  const [editSolutionName, setEditSolutionName] = useState('');
  const [editSolutionCategoryId, setEditSolutionCategoryId] = useState<number>(0);

  // Issue states
  const [issueDropdown, setIssueDropdown] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [issuesWithCategories, setIssuesWithCategories] = useState<{id: number, description: string, category_id: number, category_name: string}[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [newIssueName, setNewIssueName] = useState('');
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [isEditingIssue, setIsEditingIssue] = useState(false);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [editIssueName, setEditIssueName] = useState('');
  const [editIssueCategoryId, setEditIssueCategoryId] = useState<number>(0);
  const [issuesLoadedForCategory, setIssuesLoadedForCategory] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddReportFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      category: message?.title || '',
      categoryDropdown: '',
      solution: '',
      solutionDropdown: '',
      solutionCategoryDropdown: '',
      issue: '',
      issueDropdown: '',
      content: message?.content || '',
    },
  });

  const watchedCategory = watch('category');

  const loadSolutionsByCategory = async (categoryId: number) => {
    console.log('loadSolutionsByCategory called with categoryId:', categoryId);
    try {
      setIsLoadingSolutions(true);
      const [sols, solsWithCats] = await Promise.all([
        api.getSolutionsByCategory(categoryId),
        api.getSolutionsWithCategories()
      ]);
      console.log('API response - solutions:', sols);
      console.log('API response - solutionsWithCategories:', solsWithCats);
      setSolutions(sols);
      setSolutionsWithCategories(solsWithCats);
      if (sols.length > 0) {
        setSolutionDropdown(sols[0]);
        setValue('solutionDropdown', sols[0]);
        setTimeout(() => {
          setValue('solutionDropdown', sols[0], { shouldValidate: true });
        }, 100);
        console.log('Set first solution:', sols[0]);
      } else {
        setSolutionDropdown('');
        setValue('solutionDropdown', '');
        console.log('No solutions found, cleared dropdown');
      }
    } catch (error) {
      console.error('Error in loadSolutionsByCategory:', error);
      toast({
        title: "Error",
        description: "Failed to load solutions for this category",
        variant: "destructive",
      });
      console.error('Failed to load solutions by category:', error);
    } finally {
      setIsLoadingSolutions(false);
      console.log('Finished loading solutions');
    }
  };

  const loadIssuesByCategory = async (categoryId: number) => {
    try {
      setIsLoadingIssues(true);
      const [iss, issWithCats] = await Promise.all([
        api.getIssuesByCategory(categoryId),
        api.getIssuesWithCategories()
      ]);
      setIssues(iss);
      setIssuesWithCategories(issWithCats);
      setIssuesLoadedForCategory(categoryId);
      
      if (iss.length > 0) {
        setIssueDropdown(iss[0]);
        setValue('issueDropdown', iss[0]);
        setTimeout(() => {
          setValue('issueDropdown', iss[0], { shouldValidate: true });
        }, 100);
      } else {
        setIssueDropdown('');
        setValue('issueDropdown', '');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load issues for this category",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIssues(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        
        if (isEditing && message) {
          // In edit mode, we need to load the existing report data
          if ('category_name' in message) {
            // This is a Report object
            const report = message as any;
            setCategoryDropdown(report.category_name);
            setValue('categoryDropdown', report.category_name);
            setValue('content', report.notes || '');
            
            // Load solutions and issues for this category
            const selectedCategory = cats.find(cat => cat.name === report.category_name);
            if (selectedCategory) {
              loadSolutionsByCategory(selectedCategory.id);
              loadIssuesByCategory(selectedCategory.id);
              
              // Set the existing solution and issue after they're loaded
              setTimeout(() => {
                setSolutionDropdown(report.solution_description);
                setValue('solutionDropdown', report.solution_description);
                setIssueDropdown(report.issue_description);
                setValue('issueDropdown', report.issue_description);
              }, 500);
            }
          } else {
            // This is a Message object (legacy)
            if (cats.length > 0) {
              setCategoryDropdown(cats[0].name);
              setValue('categoryDropdown', cats[0].name);
              setTimeout(() => {
                setValue('categoryDropdown', cats[0].name, { shouldValidate: true });
              }, 100);
            }
          }
        } else {
          // Try to restore saved category selection from localStorage
          const savedCategory = localStorage.getItem('selectedCategory');
          if (savedCategory && cats.find(cat => cat.name === savedCategory)) {
            setCategoryDropdown(savedCategory);
            setValue('categoryDropdown', savedCategory);
            // Trigger form validation after setting the value
            setTimeout(() => {
              setValue('categoryDropdown', savedCategory, { shouldValidate: true });
            }, 100);
          } else if (cats.length > 0) {
            // If no saved category or saved category doesn't exist, use first category
            setCategoryDropdown(cats[0].name);
            setValue('categoryDropdown', cats[0].name);
            // Trigger form validation after setting the value
            setTimeout(() => {
              setValue('categoryDropdown', cats[0].name, { shouldValidate: true });
            }, 100);
          }
        }
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, [setValue, toast, isEditing, message]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    try {
      const newCategory = await api.createCategory(newCategoryName.trim());
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setValue('category', '');
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
      console.error('Failed to add category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleEditCategoryClick = () => {
    const selectedCategory = categories.find(cat => cat.name === categoryDropdown);
    if (selectedCategory) {
      setEditCategoryName(selectedCategory.name);
      setShowEditModal(true);
    }
  };

  const handleEditCategoryAccept = async () => {
    const selectedCategory = categories.find(cat => cat.name === categoryDropdown);
    if (!selectedCategory || !editCategoryName.trim()) return;
    
    setIsEditingCategory(true);
    try {
      const updatedCategory = await api.updateCategory(selectedCategory.id, editCategoryName.trim());
      setCategories(categories.map(cat => 
        cat.id === selectedCategory.id ? updatedCategory : cat
      ));
      setCategoryDropdown(updatedCategory.name);
      setValue('categoryDropdown', updatedCategory.name);
      setShowEditModal(false);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      console.error('Failed to update category:', error);
    } finally {
      setIsEditingCategory(false);
    }
  };

  const handleEditCategoryCancel = () => {
    setShowEditModal(false);
    setEditCategoryName('');
  };

  const handleAddSolution = async () => {
    if (!newSolutionName.trim() || !categoryDropdown) return;
    
    const selectedCategory = categories.find(cat => cat.name === categoryDropdown);
    if (!selectedCategory) return;
    
    console.log('Adding solution:', { name: newSolutionName.trim(), categoryId: selectedCategory.id });
    
    setIsAddingSolution(true);
    try {
      const newSolution = await api.createSolution(newSolutionName.trim(), selectedCategory.id);
      console.log('Solution created successfully:', newSolution);
      
      setSolutions([...solutions, newSolution.desc]);
      setSolutionsWithCategories([...solutionsWithCategories, {
        id: newSolution.id,
        desc: newSolution.desc,
        category_id: newSolution.category_id,
        category_name: selectedCategory.name
      }]);
      
      // Automatically select the newly created solution
      setSolutionDropdown(newSolution.desc);
      setValue('solutionDropdown', newSolution.desc);
      setTimeout(() => {
        setValue('solutionDropdown', newSolution.desc, { shouldValidate: true });
      }, 100);
      
      setNewSolutionName('');
      setValue('solution', '');
      toast({
        title: "Success",
        description: "Solution added successfully",
      });
    } catch (error) {
      console.error('Error creating solution:', error);
      toast({
        title: "Error",
        description: "Failed to add solution",
        variant: "destructive",
      });
      console.error('Failed to add solution:', error);
    } finally {
      setIsAddingSolution(false);
    }
  };

  const handleEditSolutionClick = () => {
    const selectedSolution = solutions.find(sol => sol === solutionDropdown);
    const selectedSolutionWithCat = solutionsWithCategories.find(sol => sol.desc === solutionDropdown);
    if (selectedSolution && selectedSolutionWithCat) {
      setEditSolutionName(selectedSolution);
      setEditSolutionCategoryId(selectedSolutionWithCat.category_id);
      setShowEditSolutionModal(true);
    }
  };

  const handleEditSolutionAccept = async () => {
    const selectedSolution = solutions.find(sol => sol === solutionDropdown);
    if (!selectedSolution || !editSolutionName.trim()) return;
    
    setIsEditingSolution(true);
    try {
      const selectedSolutionWithCat = solutionsWithCategories.find(sol => sol.desc === selectedSolution);
      if (!selectedSolutionWithCat) return;
      
      const updatedSolution = await api.updateSolution(selectedSolutionWithCat.id, editSolutionName.trim(), editSolutionCategoryId);
      setSolutions(solutions.map(sol => 
        sol === selectedSolution ? updatedSolution.desc : sol
      ));
      setSolutionDropdown(updatedSolution.desc);
      setValue('solutionDropdown', updatedSolution.desc);
      setShowEditSolutionModal(false);
      toast({
        title: "Success",
        description: "Solution updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update solution",
        variant: "destructive",
      });
      console.error('Failed to update solution:', error);
    } finally {
      setIsEditingSolution(false);
    }
  };

  const handleEditSolutionCancel = () => {
    setShowEditSolutionModal(false);
    setEditSolutionName('');
    setEditSolutionCategoryId(0);
  };

  const handleAddIssue = async () => {
    if (!newIssueName.trim()) return;
    
    // If no category is selected, show error
    if (!categoryDropdown) {
      toast({
        title: "Error",
        description: "Please select a category first to add an issue",
        variant: "destructive",
      });
      return;
    }
    
    const selectedCategory = categories.find(cat => cat.name === categoryDropdown);
    if (!selectedCategory) return;
    
    console.log('Adding issue:', { name: newIssueName.trim(), categoryId: selectedCategory.id });
    
    setIsAddingIssue(true);
    try {
      const newIssue = await api.createIssue(newIssueName.trim(), selectedCategory.id);
      console.log('Issue created successfully:', newIssue);
      
      setIssues([...issues, newIssue.description]);
      setIssuesWithCategories([...issuesWithCategories, {
        id: newIssue.id,
        description: newIssue.description,
        category_id: newIssue.category_id,
        category_name: selectedCategory.name
      }]);
      
      // Automatically select the newly created issue
      setIssueDropdown(newIssue.description);
      setValue('issueDropdown', newIssue.description);
      setTimeout(() => {
        setValue('issueDropdown', newIssue.description, { shouldValidate: true });
      }, 100);
      
      setNewIssueName('');
      setValue('issue', '');
      toast({ title: "Success", description: "Issue added successfully" });
    } catch (error) {
      console.error('Error creating issue:', error);
      toast({ title: "Error", description: "Failed to add issue", variant: "destructive" });
    } finally {
      setIsAddingIssue(false);
    }
  };

  const handleEditIssueClick = () => {
    const selectedIssue = issues.find(iss => iss === issueDropdown);
    const selectedIssueWithCat = issuesWithCategories.find(iss => iss.description === issueDropdown);
    if (selectedIssue && selectedIssueWithCat) {
      setEditIssueName(selectedIssue);
      setEditIssueCategoryId(selectedIssueWithCat.category_id);
      setShowEditIssueModal(true);
    }
  };

  const handleEditIssueAccept = async () => {
    const selectedIssue = issues.find(iss => iss === issueDropdown);
    if (!selectedIssue || !editIssueName.trim()) return;
    setIsEditingIssue(true);
    try {
      const selectedIssueWithCat = issuesWithCategories.find(iss => iss.description === selectedIssue);
      if (!selectedIssueWithCat) return;
      const updatedIssue = await api.updateIssue(selectedIssueWithCat.id, editIssueName.trim(), editIssueCategoryId);
      setIssues(issues.map(iss => iss === selectedIssue ? updatedIssue.description : iss));
      setIssueDropdown(updatedIssue.description);
      setValue('issueDropdown', updatedIssue.description);
      setShowEditIssueModal(false);
      toast({ title: "Success", description: "Issue updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update issue", variant: "destructive" });
    } finally {
      setIsEditingIssue(false);
    }
  };

  const handleEditIssueCancel = () => {
    setShowEditIssueModal(false);
    setEditIssueName('');
    setEditIssueCategoryId(0);
  };

  const onSubmit = async (data: AddReportFormData) => {
    console.log('Form submission data:', data);
    console.log('Current dropdown states:', {
      categoryDropdown,
      solutionDropdown,
      issueDropdown
    });
    
    try {
      // Get the selected category ID
      const selectedCategory = categories.find(cat => cat.name === data.categoryDropdown);
      if (!selectedCategory) {
        toast({
          title: "Error",
          description: "Please select a category",
          variant: "destructive",
        });
        return;
      }

      // Get the selected solution ID
      const selectedSolution = solutionsWithCategories.find(sol => sol.desc === data.solutionDropdown);
      if (!selectedSolution) {
        toast({
          title: "Error",
          description: "Please select a solution",
          variant: "destructive",
        });
        return;
      }

      // Get the selected issue ID
      const selectedIssue = issuesWithCategories.find(iss => iss.description === data.issueDropdown);
      if (!selectedIssue) {
        toast({
          title: "Error",
          description: "Please select an issue",
          variant: "destructive",
        });
        return;
      }

      const submitData = {
        category_id: selectedCategory.id,
        solution_id: selectedSolution.id,
        issue_id: selectedIssue.id,
        notes: data.content,
      };

      if (isEditing && message) {
        // Determine the ID based on the message type
        const reportId = 'category_name' in message ? message.id : parseInt(message.id);
        await api.updateReport(reportId, submitData);
        toast({
          title: "Success",
          description: "Report updated successfully",
        });
      } else {
        await api.createReport(submitData);
        toast({
          title: "Success",
          description: "Report created successfully",
        });
      }
      onSuccess();
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing ? "Failed to update report" : "Failed to create report",
        variant: "destructive",
      });
      console.error('Form submission error:', error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            Category
            <span className="text-xs text-gray-500">(select to filter solutions)</span>
          </Label>
          <div className="space-y-3">
            <select
              id="categoryDropdown"
              value={categoryDropdown}
              onChange={e => {
                const selectedValue = e.target.value;
                setCategoryDropdown(selectedValue);
                setValue('categoryDropdown', selectedValue);
                
                // Save selected category to localStorage
                localStorage.setItem('selectedCategory', selectedValue);
                
                const selectedCategory = categories.find(cat => cat.name === selectedValue);
                console.log('Category selected:', selectedValue);
                console.log('Selected category object:', selectedCategory);
                if (selectedCategory) {
                  console.log('Loading solutions for category ID:', selectedCategory.id);
                  loadSolutionsByCategory(selectedCategory.id);
                  loadIssuesByCategory(selectedCategory.id);
                } else {
                  console.log('No category found for:', selectedValue);
                }
              }}
              className="w-full border rounded px-3 py-2 h-12 text-base hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoadingCategories}
            >
              {isLoadingCategories ? (
                <option>Loading...</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="category"
                {...register('category')}
                placeholder="add new category"
                className="flex-1 h-12 text-base"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || isAddingCategory}
                size="sm"
                className="h-12 sm:h-10 px-4"
              >
                {isAddingCategory ? 'Adding...' : 'Add'}
              </Button>
              <Button
                type="button"
                onClick={handleEditCategoryClick}
                disabled={isEditingCategory}
                size="sm"
                variant="outline"
                className="h-12 sm:h-10 px-4"
              >
                {isEditingCategory ? 'Editing...' : 'Edit'}
              </Button>
            </div>
          </div>
          {errors.categoryDropdown && (
            <p className="text-sm text-red-500">
              {errors.categoryDropdown.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution">Solution</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                id="solutionDropdown"
                value={solutionDropdown}
                onChange={e => {
                  setSolutionDropdown(e.target.value);
                  setValue('solutionDropdown', e.target.value);
                }}
                className={`flex-1 border rounded px-3 py-2 h-12 text-base transition-all duration-200 ${
                  isLoadingSolutions ? 'opacity-50 bg-gray-50' : 'opacity-100'
                }`}
                disabled={isLoadingSolutions}
              >
                {!categoryDropdown ? (
                  <option>Select a category first</option>
                ) : isLoadingSolutions ? (
                  <option>Loading solutions...</option>
                ) : solutions.length === 0 ? (
                  <option>No solutions available</option>
                ) : (
                  solutions.map((desc) => (
                    <option key={desc} value={desc}>
                      {desc}
                    </option>
                  ))
                )}
              </select>
              <div className={`flex items-center px-3 py-2 text-sm rounded border transition-all duration-200 h-12 ${
                !categoryDropdown
                  ? 'text-gray-500 bg-gray-50 border-gray-200'
                  : isLoadingSolutions 
                    ? 'text-blue-600 bg-blue-50 border-blue-200' 
                    : solutions.length === 0 
                      ? 'text-orange-600 bg-orange-50 border-orange-200'
                      : 'text-green-600 bg-green-50 border-green-200'
              }`}>
                {!categoryDropdown ? (
                  <span>0</span>
                ) : isLoadingSolutions ? (
                  <span>...</span>
                ) : (
                  <span>{solutions.length}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="solution"
                {...register('solution')}
                placeholder="add new solution"
                className="flex-1 h-12 text-base"
                value={newSolutionName}
                onChange={(e) => setNewSolutionName(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleAddSolution}
                disabled={!newSolutionName.trim() || isAddingSolution}
                size="sm"
                className="h-12 sm:h-10 px-4"
              >
                {isAddingSolution ? 'Adding...' : 'Add Solution'}
              </Button>
              <Button
                type="button"
                onClick={handleEditSolutionClick}
                disabled={isEditingSolution}
                size="sm"
                variant="outline"
                className="h-12 sm:h-10 px-4"
              >
                {isEditingSolution ? 'Editing...' : 'Edit Solution'}
              </Button>
            </div>
          </div>
          {errors.solutionDropdown && (
            <p className="text-sm text-red-500">
              {errors.solutionDropdown.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue">Issue</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                id="issueDropdown"
                value={issueDropdown}
                onChange={e => {
                  setIssueDropdown(e.target.value);
                  setValue('issueDropdown', e.target.value);
                }}
                className={`flex-1 border rounded px-3 py-2 h-12 text-base transition-all duration-200 ${isLoadingIssues ? 'opacity-50 bg-gray-50' : 'opacity-100'}`}
                disabled={isLoadingIssues}
              >
                {!categoryDropdown ? (
                  <option>Select a category first</option>
                ) : isLoadingIssues ? (
                  <option>Loading issues...</option>
                ) : issues.length === 0 ? (
                  <option>No issues available</option>
                ) : (
                  issues.map((description) => (
                    <option key={description} value={description}>{description}</option>
                  ))
                )}
              </select>
              <div className={`flex items-center px-3 py-2 text-sm rounded border transition-all duration-200 h-12 ${
                !categoryDropdown
                  ? 'text-gray-500 bg-gray-50 border-gray-200'
                  : isLoadingIssues 
                    ? 'text-blue-600 bg-blue-50 border-blue-200' 
                    : issues.length === 0 
                      ? 'text-orange-600 bg-orange-50 border-orange-200'
                      : 'text-green-600 bg-green-50 border-green-200'
              }`}>
                {!categoryDropdown ? (
                  <span>0</span>
                ) : isLoadingIssues ? (
                  <span>...</span>
                ) : (
                  <span>{issues.length}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="issue"
                {...register('issue')}
                placeholder="add new issue"
                className="flex-1 h-12 text-base"
                value={newIssueName}
                onChange={(e) => setNewIssueName(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleAddIssue}
                disabled={!newIssueName.trim() || isAddingIssue}
                size="sm"
                className="h-12 sm:h-10 px-4"
              >
                {isAddingIssue ? 'Adding...' : 'Add Issue'}
              </Button>
              <Button
                type="button"
                onClick={handleEditIssueClick}
                disabled={isEditingIssue}
                size="sm"
                variant="outline"
                className="h-12 sm:h-10 px-4"
              >
                {isEditingIssue ? 'Editing...' : 'Edit Issue'}
              </Button>
            </div>
          </div>
          {errors.issueDropdown && (
            <p className="text-sm text-red-500">
              {errors.issueDropdown.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Notes</Label>
          <Textarea
            id="content"
            {...register('content')}
            placeholder="Enter notes content"
            rows={6}
            className={`${errors.content ? 'border-red-500' : ''} text-base`}
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="h-12 sm:h-10 text-base font-medium"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Report' : 'Create Report'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="h-12 sm:h-10 text-base"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="h-12 text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditCategoryCancel}
                disabled={isEditingCategory}
                className="h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEditCategoryAccept}
                disabled={!editCategoryName.trim() || isEditingCategory}
                className="h-12 sm:h-10"
              >
                {isEditingCategory ? 'Updating...' : 'Accept'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Solution Modal */}
      <Dialog open={showEditSolutionModal} onOpenChange={setShowEditSolutionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Solution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSolutionName">Solution Name</Label>
              <Input
                id="editSolutionName"
                value={editSolutionName}
                onChange={(e) => setEditSolutionName(e.target.value)}
                placeholder="Enter solution name"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSolutionCategory">Category</Label>
              <select
                id="editSolutionCategory"
                value={editSolutionCategoryId}
                onChange={(e) => setEditSolutionCategoryId(Number(e.target.value))}
                className="border rounded px-3 py-2 w-full h-12 text-base"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditSolutionCancel}
                disabled={isEditingSolution}
                className="h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEditSolutionAccept}
                disabled={!editSolutionName.trim() || isEditingSolution}
                className="h-12 sm:h-10"
              >
                {isEditingSolution ? 'Updating...' : 'Accept'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Issue Modal */}
      <Dialog open={showEditIssueModal} onOpenChange={setShowEditIssueModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editIssueName">Issue Name</Label>
              <Input
                id="editIssueName"
                value={editIssueName}
                onChange={(e) => setEditIssueName(e.target.value)}
                placeholder="Enter issue name"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editIssueCategory">Category</Label>
              <select
                id="editIssueCategory"
                value={editIssueCategoryId}
                onChange={(e) => setEditIssueCategoryId(Number(e.target.value))}
                className="border rounded px-3 py-2 w-full h-12 text-base"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditIssueCancel}
                disabled={isEditingIssue}
                className="h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEditIssueAccept}
                disabled={!editIssueName.trim() || isEditingIssue}
                className="h-12 sm:h-10"
              >
                {isEditingIssue ? 'Updating...' : 'Accept'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 