import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Spinner } from '@heroui/react';
import { contentApi, categoriesApi } from '../../lib/api';
import type { GeneratedContent, Category } from '../../lib/api';
import { useOrganization } from '../../contexts/organization-context';
import { Search, Filter, Eye, FileText, Tag, FolderOpen, X } from 'lucide-react';

export const Route = createFileRoute('/contents/')({
  component: ContentsPage,
});

function ContentsPage() {
  const { currentOrganization } = useOrganization();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce search
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const res = await categoriesApi.getByOrganization(currentOrganization.id);
      return res.data;
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch contents with filters
  const { data: contentsData, isLoading } = useQuery({
    queryKey: ['org-contents', currentOrganization?.id, page, statusFilter, categoryFilter, projectFilter, debouncedSearch],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      const res = await contentApi.searchOrganizationContents(currentOrganization.id, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        projectId: projectFilter !== 'all' ? projectFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      });
      return res.data;
    },
    enabled: !!currentOrganization?.id,
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setProjectFilter('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || projectFilter !== 'all' || debouncedSearch;

  if (!currentOrganization) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization from the header to view contents.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">All Contents</h1>
            <p className="text-gray-600">
              Browse all contents in {currentOrganization.name}
            </p>
          </div>
        </div>
        {contentsData && (
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{contentsData.total}</p>
            <p className="text-sm text-gray-500">Total Contents</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {contentsData?.projects.map((proj) => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onPress={clearFilters}
              className="text-gray-600"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Contents List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !contentsData || contentsData.contents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Contents Found</h2>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Create a project and generate content to get started.'}
          </p>
          {hasActiveFilters && (
            <Button onPress={clearFilters} className="bg-blue-600 text-white">
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {contentsData.contents.map((content: GeneratedContent) => {
              const project = contentsData.projects.find(p => p.id === content.projectId);
              return (
                <Card key={content.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{content.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${content.publishStatus === 'published'
                            ? 'bg-green-100 text-green-700'
                            : content.publishStatus === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {content.publishStatus}
                        </span>
                      </div>
                      {content.metaDescription && (
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                          {content.metaDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {project && (
                          <span className="flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            {project.name}
                          </span>
                        )}
                        <span>/{content.slug}</span>
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link to="/contents/$contentId" params={{ contentId: content.id }}>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {contentsData.totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                onPress={() => setPage(p => Math.max(1, p - 1))}
                isDisabled={page === 1}
                variant="ghost"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {page} of {contentsData.totalPages}
              </span>
              <Button
                onPress={() => setPage(p => Math.min(contentsData.totalPages, p + 1))}
                isDisabled={page === contentsData.totalPages}
                variant="ghost"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
