import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi, csvApi, contentApi, organizationsApi } from '../../lib/api'
import { Button, Card } from '@heroui/react'
import { useDropzone } from 'react-dropzone'
import { Upload, Sparkles, Copy } from 'lucide-react'
import { RichTextEditor } from '../../components/RichTextEditor'
import { ThumbnailUpload } from '../../components/ThumbnailUpload'
import { TagInput } from '../../components/TagInput'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/projects/create')({
    component: CreateProjectPage,
    beforeLoad: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            throw redirect({ to: '/login' })
        }
    },
})

function CreateProjectPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        organizationId: '',
        name: '',
        description: '',
        template: '',
        titleTemplate: '',
        metaDescriptionTemplate: '',
        tagsTemplate: '',
        slugTemplate: '',
        categories: [] as string[],
    })
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [csvColumns, setCsvColumns] = useState<string[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Fetch user's organizations
    const { data: organizations, isLoading: orgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const response = await organizationsApi.getAll()
            return response.data
        },
    })

    const createProjectMutation = useMutation({
        mutationFn: async () => {
            const validationErrors: string[] = []
            if (!formData.organizationId) validationErrors.push('Organization is required')
            if (!formData.name.trim()) validationErrors.push('Project name is required')
            if (!formData.template.trim()) validationErrors.push('Template is required')

            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '))
            }

            setErrors([])

            try {
                console.log('Creating project...', formData)
                const projectResponse = await Promise.race([
                    projectsApi.create(formData),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Project creation timed out')), 30000)
                    )
                ]) as any
                console.log('Project created:', projectResponse.data)

                const project = projectResponse.data

                // Upload thumbnail if provided
                if (thumbnailFile) {
                    console.log('Uploading thumbnail...')
                    await projectsApi.uploadThumbnail(project.id, thumbnailFile)
                    console.log('Thumbnail uploaded')
                }

                if (csvFile) {
                    console.log('Uploading CSV...')
                    await Promise.race([
                        csvApi.upload(project.id, csvFile),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('CSV upload timed out')), 30000)
                        )
                    ])
                    console.log('CSV uploaded')
                }

                console.log('Starting generation...')
                // Use synchronous generation (no Redis required)
                const contents = await Promise.race([
                    contentApi.generateSync(project.id),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Generation timed out after 60 seconds')), 60000)
                    )
                ]) as any
                console.log('Generation completed:', contents.data?.length || 0, 'items')

                // Navigate to project page after short delay
                setTimeout(() => {
                    navigate({ to: `/projects/${project.id}` })
                }, 1500)

                return { project }
            } catch (error: any) {
                console.error('Create project error:', error)
                throw error
            }
        },
        onSuccess: ({ project }) => {
            console.log('Success! Project created:', project.id)
            setSuccessMessage('Project created and content generated successfully! Redirecting...')
            toast.success('Content generated successfully!')
        },
        onError: (error: any) => {
            console.error('Mutation error:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create project'
            setErrors([errorMessage])
            toast.error(errorMessage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        },
    })

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0]
                setCsvFile(file)

                const text = await file.text()
                const firstLine = text.split('\n')[0]

                let delimiter = ','
                if (firstLine.includes(';')) delimiter = ';'
                else if (firstLine.includes('\t')) delimiter = '\t'
                else if (firstLine.includes('|')) delimiter = '|'

                Papa.parse(file, {
                    header: true,
                    preview: 1,
                    delimiter: delimiter,
                    complete: (results: any) => {
                        console.log('Detected delimiter:', delimiter)
                        console.log('Detected fields:', results.meta.fields)
                        if (results.meta.fields) {
                            setCsvColumns(results.meta.fields)
                        }
                    }
                })
            }
        },
    })

    const handleSubmit = () => {
        createProjectMutation.mutate()
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Project
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Set up your mass marketing SEO campaign
                </p>
            </div>

            {errors.length > 0 && (
                <Card className="p-4 mb-6 bg-red-50 border border-red-200">
                    <div className="space-y-2">
                        {errors.map((error, index) => (
                            <div key={index} className="flex items-start gap-2 text-red-700">
                                <span className="text-red-500 font-bold">✕</span>
                                <span>{error}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {successMessage && (
                <Card className="p-4 mb-6 bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                        <span className="text-green-500 font-bold">✓</span>
                        <span>{successMessage}</span>
                    </div>
                </Card>
            )}

            <div className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Project Details</h2>
                    <div className="space-y-4">
                        {/* Organization Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Organization <span className="text-red-500">*</span>
                            </label>
                            {orgsLoading ? (
                                <div className="text-sm text-gray-500">Loading organizations...</div>
                            ) : organizations && organizations.length > 0 ? (
                                <select
                                    value={formData.organizationId}
                                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select an organization</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        No organizations found. Please create an organization first.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Select which organization this project belongs to</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="My SEO Campaign"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}

                            />
                            <p className="text-xs text-gray-500 mt-1">Give your project a descriptive name</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe your project..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                            />
                            <p className="text-xs text-gray-500 mt-1">Optional project description</p>
                        </div>

                        {/* Thumbnail Upload */}
                        <div>
                            <ThumbnailUpload
                                onUpload={async (file) => {
                                    setThumbnailFile(file)
                                    toast.success('Thumbnail ready to upload')
                                }}
                            />
                        </div>

                        {/* Categories Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Categories</label>
                            <TagInput
                                value={formData.categories}
                                onChange={(categories) => setFormData({ ...formData, categories })}
                                placeholder="Add project categories..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Add tags to categorize your project</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">
                        Upload CSV Data
                        {csvFile && <span className="text-sm font-normal text-green-600 ml-2">✓ File uploaded</span>}
                    </h2>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        {csvFile ? (
                            <div>
                                <p className="text-lg font-semibold text-green-600">{csvFile.name}</p>
                                <p className="text-sm text-gray-500">
                                    {csvColumns.length} column{csvColumns.length !== 1 ? 's' : ''} detected
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{(csvFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-semibold mb-2">Drop your CSV file here</p>
                                <p className="text-sm text-gray-500">or click to browse</p>
                                <p className="text-xs text-gray-400 mt-2">Supports comma, semicolon, tab, and pipe delimiters</p>
                            </div>
                        )}
                    </div>
                    {csvColumns.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Detected columns: {csvColumns.join(', ')}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Use these in your template as {'{{columnName}}'}
                            </p>
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-2">HTML Template</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Use variables like <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{'{{columnName}}'}</code> to insert CSV data.
                        {csvColumns.length > 0 && ' Click variable chips below to copy them.'}
                    </p>

                    {csvColumns.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Available Variables (Click to Copy):</p>
                            <div className="flex flex-wrap gap-2">
                                {csvColumns.map(col => (
                                    <button
                                        key={col}
                                        onClick={() => {
                                            navigator.clipboard.writeText(`{{${col}}}`)
                                            toast.success(`Copied {{${col}}}`, { duration: 2000 })
                                        }}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm flex items-center gap-1 transition-colors"
                                    >
                                        <Copy className="w-3 h-3" />
                                        {`{{${col}}}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <RichTextEditor
                        value={formData.template}
                        onChange={(html) => setFormData({ ...formData, template: html })}
                        label=""
                    />

                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title Template</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="{{title}} - My Site"
                                value={formData.titleTemplate}
                                onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}

                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Used for page title and SEO. <strong>Columns in this template determine content combinations.</strong> Slug will be generated from the title.
                                {csvColumns.length > 0 && (
                                    <span className="text-blue-600 font-medium">
                                        {' '}Available: {csvColumns.join(', ')}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Meta Description Template</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="{{description}}"
                                rows={2}
                                value={formData.metaDescriptionTemplate}
                                onChange={(e) => setFormData({ ...formData, metaDescriptionTemplate: e.target.value })}

                            />
                            <p className="text-xs text-gray-500 mt-1">SEO meta description (150-160 chars recommended)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tags Template</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="{{category}}, {{type}}, SEO"
                                value={formData.tagsTemplate}
                                onChange={(e) => setFormData({ ...formData, tagsTemplate: e.target.value })}

                            />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated tags for content organization</p>
                        </div>
                    </div>
                </Card>

                <div className="flex gap-4 justify-end">
                    <Button
                        size="lg"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                        onClick={() => navigate({ to: '/projects' })}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        className={`text-white ${!formData.name || createProjectMutation.isPending
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        onClick={handleSubmit}
                        isDisabled={!formData.name || createProjectMutation.isPending}
                    >
                        {createProjectMutation.isPending ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Create & Generate
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
