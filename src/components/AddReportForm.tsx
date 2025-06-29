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
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  categoryDropdown: z.string().min(1, 'Select a category'),
  solution: z.string().min(1, 'Solution is required').max(100, 'Solution must be less than 100 characters'),
  solutionDropdown: z.string().min(1, 'Select a solution'),
  solutionCategoryDropdown: z.string().min(1, 'Select a solution category'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content must be less than 1000 characters'),
});

type AddReportFormData = z.infer<typeof messageSchema>;

interface AddReportFormProps {
  message?: Message;
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryDropdown(cats[0].name);
          setValue('categoryDropdown', cats[0].name);
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
  }, [setValue, toast, loadSolutionsByCategory]);

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
    
    setIsAddingSolution(true);
    try {
      const newSolution = await api.createSolution(newSolutionName.trim(), selectedCategory.id);
      setSolutions([...solutions, newSolution.desc]);
      setNewSolutionName('');
      setValue('solution', '');
      toast({
        title: "Success",
        description: "Solution added successfully",
      });
    } catch (error) {
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

  const onSubmit = async (data: AddReportFormData) => {
    try {
      const submitData = {
        title: data.category, // still using 'title' for backend compatibility
        content: data.content,
      };
      if (isEditing && message) {
        await api.updateMessage(message.id, submitData);
        toast({
          title: "Success",
          description: "Message updated successfully",
        });
      } else {
        await api.createMessage(submitData);
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
              {...register('categoryDropdown')}
              value={categoryDropdown}
              onChange={e => {
                setCategoryDropdown(e.target.value);
                setValue('categoryDropdown', e.target.value);
                const selectedCategory = categories.find(cat => cat.name === e.target.value);
                console.log('Category selected:', e.target.value);
                console.log('Selected category object:', selectedCategory);
                if (selectedCategory) {
                  console.log('Loading solutions for category ID:', selectedCategory.id);
                  loadSolutionsByCategory(selectedCategory.id);
                } else {
                  console.log('No category found for:', e.target.value);
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
                className={`flex-1 h-12 text-base ${errors.category ? 'border-red-500' : ''}`}
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
          {(errors.categoryDropdown || errors.category) && (
            <p className="text-sm text-red-500">
              {errors.categoryDropdown?.message || errors.category?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution">Solution</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                id="solutionDropdown"
                {...register('solutionDropdown')}
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
                className={`flex-1 h-12 text-base ${errors.solution ? 'border-red-500' : ''}`}
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
          {(errors.solutionDropdown || errors.solution) && (
            <p className="text-sm text-red-500">
              {errors.solutionDropdown?.message || errors.solution?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            {...register('content')}
            placeholder="Enter message content"
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
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Message' : 'Create Report'}
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
    </>
  );
}; 