import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input } from '@heroui/react';
import { Tag, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { categoriesApi } from '../../lib/api';
import type { Category } from '../../lib/api';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/organizations/$organizationId/categories')({
  component: OrganizationCategoriesPage,
});

const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

function OrganizationCategoriesPage() {
  const { organizationId } = Route.useParams();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: CATEGORY_COLORS[0] });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: async () => {
      const res = await categoriesApi.getByOrganization(organizationId);
      return res.data;
    },
  });

  // Create category
  const createMutation = useMutation({
    mutationFn: async () => {
      return await categoriesApi.create({
        organizationId,
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
      toast.success('Category created successfully');
      setIsCreating(false);
      setFormData({ name: '', description: '', color: CATEGORY_COLORS[0] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  // Update category
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string } }) => {
      return await categoriesApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
      toast.success('Category updated successfully');
      setEditingId(null);
      setFormData({ name: '', description: '', color: CATEGORY_COLORS[0] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    },
  });

  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await categoriesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', organizationId] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    },
  });

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || CATEGORY_COLORS[0],
    });
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', color: CATEGORY_COLORS[0] });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
      },
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/organizations/${organizationId}/settings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-gray-600">Manage categories for your projects</p>
          </div>
        </div>
        {!isCreating && !editingId && (
          <Button
            onPress={() => setIsCreating(true)}
            className="bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="p-6 mb-6 border-2 border-blue-200">
          <h3 className="font-semibold mb-4">Create New Category</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                        ? 'border-gray-800 scale-110'
                        : 'border-transparent hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onPress={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
                isDisabled={!formData.name.trim()}
                className="bg-blue-600 text-white"
              >
                Create Category
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  setIsCreating(false);
                  setFormData({ name: '', description: '', color: CATEGORY_COLORS[0] });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : categories.length === 0 && !isCreating ? (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
          <p className="text-gray-600 mb-4">
            Create categories to organize your projects and content.
          </p>
          <Button
            onPress={() => setIsCreating(true)}
            className="bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Category
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              {editingId === category.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                              ? 'border-gray-800 scale-110'
                              : 'border-transparent hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onPress={handleSaveEdit}
                      isLoading={updateMutation.isPending}
                      isDisabled={!formData.name.trim()}
                      className="bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button variant="ghost" onPress={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || CATEGORY_COLORS[0] }}
                    />
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleEdit(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        if (confirm('Are you sure you want to delete this category?')) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
