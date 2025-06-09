import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Meta-Agent System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Advanced AI Agent Management Platform
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ Core Infrastructure
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Development environment setup</li>
                  <li>• Repository structure configured</li>
                  <li>• Environment configuration ready</li>
                  <li>• OpenAI integration implemented</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🔧 Available APIs
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    <Link 
                      href="/api/openai/test" 
                      className="hover:underline"
                    >
                      • OpenAI Test Endpoint
                    </Link>
                  </li>
                  <li>• Authentication middleware</li>
                  <li>• Rate limiting system</li>
                  <li>• Environment validation</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Next Development Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <strong className="text-yellow-800">TASK-002:</strong>
                  <br />Agent Framework Implementation
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <strong className="text-purple-800">TASK-003:</strong>
                  <br />User Interface Development
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <strong className="text-orange-800">TASK-004:</strong>
                  <br />Agent Management System
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 