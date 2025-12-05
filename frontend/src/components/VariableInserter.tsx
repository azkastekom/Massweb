import { useState } from 'react'
import { Card } from '@heroui/react'
import { Search } from 'lucide-react'
import type { editor } from 'monaco-editor'

interface VariableInserterProps {
    variables: string[]
    onInsert: (variable: string) => void
    editorRef?: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
}

export function VariableInserter({ variables, onInsert, editorRef }: VariableInserterProps) {
    const [search, setSearch] = useState('')

    const filteredVariables = variables.filter(v =>
        v.toLowerCase().includes(search.toLowerCase())
    )

    const handleInsert = (variable: string) => {
        // If we have monaco editor ref, insert at cursor
        if (editorRef?.current) {
            const editor = editorRef.current
            const position = editor.getPosition()
            if (position) {
                const range = new (window as any).monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                )
                editor.executeEdits('', [{
                    range,
                    text: `{{${variable}}}`,
                    forceMoveMarkers: true
                }])
                editor.focus()
            }
        } else {
            // Fallback to callback
            onInsert(variable)
        }
    }

    if (variables.length === 0) {
        return (
            <Card className="p-6 text-center text-gray-500">
                <p className="text-sm">Upload a CSV file to see available variables</p>
            </Card>
        )
    }

    return (
        <Card className="p-4">
            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-semibold mb-2">Available Variables</h3>
                    <p className="text-xs text-gray-600 mb-3">
                        Click to insert <code className="px-1 bg-gray-100 rounded">{'{{variable}}'}</code> into template
                    </p>
                </div>

                {variables.length > 5 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search variables..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {filteredVariables.length === 0 ? (
                        <p className="text-sm text-gray-500 w-full text-center py-4">
                            No variables found
                        </p>
                    ) : (
                        filteredVariables.map((variable) => (
                            <button
                                key={variable}
                                onClick={() => handleInsert(variable)}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm font-medium transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                            >
                                {variable}
                            </button>
                        ))
                    )}
                </div>

                {filteredVariables.length > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                        {filteredVariables.length} variable{filteredVariables.length !== 1 ? 's' : ''} available
                    </p>
                )}
            </div>
        </Card>
    )
}
