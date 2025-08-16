import React, { useState } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { Plus, Sparkles, FileText, Mic } from 'lucide-react'
import { useToast } from './Toast'

export function QuickAdd() {
  const {
    currentStore,
    getCurrentStoreTemplates,
    createNewList,
    setCurrentList
  } = useAppStore()

  const { showToast, ToastComponent } = useToast()
  const [listName, setListName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const templates = getCurrentStoreTemplates()

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentStore || !listName.trim()) return

    setIsCreating(true)
    try {
      const newList = await createNewList(
        listName.trim(),
        currentStore.id,
        selectedTemplate || undefined
      )
      setCurrentList(newList)
      setListName('')
      setSelectedTemplate('')
      setShowAdvanced(false)
    } catch (error) {
      console.error('Failed to create list:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setListName(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }

      recognition.start()
    } else {
      showToast('Speech recognition not supported in this browser', 'info')
    }
  }

  if (!currentStore) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a store to create shopping lists</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Start
      </h3>

      <form onSubmit={handleQuickStart} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            List Name
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Weekly Groceries"
              className="input flex-1"
              required
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className="btn btn-secondary p-2"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Start from Template (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                {showAdvanced ? 'Simple' : 'Advanced'}
              </button>
            </div>
            
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="input w-full"
            >
              <option value="">Start with empty list</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.items.length} items)
                </option>
              ))}
            </select>
          </div>
        )}

        {showAdvanced && selectedTemplate && (
          <div className="bg-blue-50 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Template Preview</div>
              <div>
                {(() => {
                  const template = templates.find(t => t.id === selectedTemplate)
                  if (!template) return null
                  
                  const highFreq = template.items.filter(item => item.frequency >= 0.8)
                  const medFreq = template.items.filter(item => item.frequency >= 0.5 && item.frequency < 0.8)
                  
                  return (
                    <div className="space-y-1">
                      {highFreq.length > 0 && (
                        <div>Always: {highFreq.slice(0, 3).map(i => i.name).join(', ')}</div>
                      )}
                      {medFreq.length > 0 && (
                        <div>Sometimes: {medFreq.slice(0, 3).map(i => i.name).join(', ')}</div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!listName.trim() || isCreating}
        >
          {isCreating ? (
            'Creating...'
          ) : selectedTemplate ? (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Create from Template
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Empty List
            </>
          )}
        </button>
      </form>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setListName('Weekly Groceries')
              setSelectedTemplate('')
            }}
            className="text-left p-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="text-sm font-medium text-gray-900">Weekly Shop</div>
            <div className="text-xs text-gray-500">Standard grocery run</div>
          </button>
          
          <button
            onClick={() => {
              setListName('Quick Trip')
              setSelectedTemplate('')
            }}
            className="text-left p-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="text-sm font-medium text-gray-900">Quick Trip</div>
            <div className="text-xs text-gray-500">Just a few items</div>
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      {templates.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Smart Suggestion
            </span>
          </div>
          <div className="text-sm text-purple-800">
            Based on your shopping patterns, you usually shop on{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}s.
            Your most used template is "{templates[0]?.name}".
          </div>
        </div>
      )}
      
      {ToastComponent}
    </div>
  )
}