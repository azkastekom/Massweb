import { createFileRoute, Link } from '@tanstack/react-router'
import { Button, Card } from '@heroui/react'
import { Sparkles, FileText, Zap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mass Marketing SEO
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Generate thousands of SEO-optimized content pages from CSV data with customizable templates
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="text-center p-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold mb-2">CSV Import</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your data and let the system create content combinations
            </p>
          </Card>

          <Card className="text-center p-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-xl font-bold mb-2">Template Engine</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Use Handlebars templates with drag-and-drop variable insertion
            </p>
          </Card>

          <Card className="text-center p-8">
            <Zap className="w-12 h-12 mx-auto mb-4 text-pink-600" />
            <h3 className="text-xl font-bold mb-2">Smart Publishing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Delayed publishing to avoid spam detection
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/projects">
            <Button
              size="lg"
              className="text-lg px-8 py-6 font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
