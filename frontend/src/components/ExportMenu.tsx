import { Button } from '@heroui/react'
import { FileJson, FileSpreadsheet, FileArchive } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ExportMenuProps {
    projectId: string
    projectName: string
    totalContents: number
}

export function ExportMenu({ projectId, projectName, totalContents }: ExportMenuProps) {
    const [exporting, setExporting] = useState<string | null>(null)

    const handleExport = async (format: 'csv' | 'json' | 'html-zip') => {
        if (totalContents === 0) {
            toast.error('No content to export')
            return
        }

        setExporting(format)
        try {
            const response = await fetch(
                `http://localhost:3001/api/content-generator/projects/${projectId}/export?format=${format}`
            )

            if (!response.ok) {
                throw new Error('Export failed')
            }

            const blob = await response.blob()
            const extension = format === 'html-zip' ? 'zip' : format
            const filename = `${projectName}-export.${extension}`

            // Download file
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)

            toast.success(`Exported as ${format.toUpperCase()}`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export content')
        } finally {
            setExporting(null)
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleExport('csv')}
                isDisabled={!!exporting || totalContents === 0}
            >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </Button>

            <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleExport('json')}
                isDisabled={!!exporting || totalContents === 0}
            >
                <FileJson className="w-4 h-4 mr-2" />
                {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
            </Button>

            <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleExport('html-zip')}
                isDisabled={!!exporting || totalContents === 0}
            >
                <FileArchive className="w-4 h-4 mr-2" />
                {exporting === 'html-zip' ? 'Exporting...' : 'Export HTML ZIP'}
            </Button>
        </div>
    )
}
