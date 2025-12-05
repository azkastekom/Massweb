import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '../../lib/api'
import { Button, Card } from '@heroui/react'
import { Save, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react'
import { RichTextEditor } from '../../components/RichTextEditor'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/contents/$contentId')({
  component: ContentEditPage,
})

function ContentEditPage() {
  const { contentId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPreview, setShowPreview] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    metaDescription: '',
    htmlContent: '',
    tags: '',
  })

  // Fetch content data
  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: async () => {
      const response = await contentApi.getById(contentId)
      const data = response.data
      setFormData({
        title: data.title || '',
        metaDescription: data.metaDescription || '',
        htmlContent: data.content || '',
        tags: data.tags || '',
      })
      return data
    },
  })

  // Update content mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      await contentApi.update(contentId, {
        title: formData.title,
        metaDescription: formData.metaDescription,
        content: formData.htmlContent,
        tags: formData.tags,
      })
    },
    onSuccess: () => {
      toast.success('Content saved successfully')
      queryClient.invalidateQueries({ queryKey: ['content', contentId] })
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
    onError: () => {
      toast.error('Failed to save content')
    },
  })

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await contentApi.delete(contentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
      if (content?.projectId) {
        navigate({ to: '/projects/$projectId', params: { projectId: content.projectId } })
      } else {
        navigate({ to: '/projects' })
      }
    },
  })

  const handleSubmit = () => {
    updateMutation.mutate()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate()
      toast.success('Content deleted')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          size="sm"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 mb-4"
          onClick={() => {
            if (content?.projectId) {
              navigate({ to: '/projects/$projectId', params: { projectId: content.projectId } })
            } else {
              navigate({ to: '/projects' })
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit Content
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Modify SEO fields and HTML content
        </p>
      </div>

      {/* Success/Error Messages */}
      {updateMutation.isSuccess && (
        <Card className="p-4 mb-6 bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-green-500 font-bold">✓</span>
            <span>Content updated successfully!</span>
          </div>
        </Card>
      )}

      {updateMutation.isError && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <div className="flex items-start gap-2 text-red-700">
            <span className="text-red-500 font-bold">✕</span>
            <span>Failed to update content</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">SEO Fields</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Page title for SEO</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Description</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length} chars (150-160 recommended)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">HTML Content</h2>
            <RichTextEditor
              value={formData.htmlContent}
              onChange={(html) => setFormData({ ...formData, htmlContent: html })}
              label=""
              placeholder="Start writing your content..."
            />
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-between">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              isDisabled={deleteMutation.isPending}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: content?.projectId || '' } })}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSubmit}
                isDisabled={updateMutation.isPending}
              >
                <Save className="w-5 h-5 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Preview</h2>
              <Button
                size="sm"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {showPreview && (
              <div className="space-y-4">
                {/* SEO Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">SEO Preview</h3>
                  <div className="space-y-1">
                    <p className="text-blue-600 hover:underline text-lg font-medium">
                      {formData.title || 'Untitled'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.metaDescription || 'No meta description'}
                    </p>
                    {formData.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* HTML Preview */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">HTML Preview</h3>
                  <div
                    className="p-4 border rounded-lg bg-white dark:bg-gray-900 overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                  />
                </div>

                {/* Raw HTML */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Raw HTML</h3>
                  <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto max-h-64 text-xs">
                    {formData.htmlContent}
                  </pre>
                </div>
              </div>
            )}
          </Card>

          {/* Content Info */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Content Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${content?.publishStatus === 'published' ? 'text-green-600' :
                  content?.publishStatus === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                  {content?.publishStatus || 'pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Slug:</span>
                <span className="font-mono text-blue-600">{content?.slug || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{content?.createdAt ? new Date(content.createdAt).toLocaleString() : '-'}</span>
              </div>
              {content?.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span>{new Date(content.publishedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
