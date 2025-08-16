import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { Plus, Edit, Trash2, Play, Clock, TrendingUp, Star } from 'lucide-react'
import type { Template } from '../types'

export function TemplateManager() {
  const {
    currentStore,
    getCurrentStoreTemplates,
    loadTemplates
  } = useAppStore()

  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const templates = getCurrentStoreTemplates()

  useEffect(() => {
    if (currentStore) {
      loadTemplates(currentStore.id)
    }
  }, [currentStore, loadTemplates])

  const handleCreateTemplate = () => {
    setShowCreateTemplate(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
  }

  const handleGenerateList = async (template: Template) => {
    // This would generate a list from the template
    console.log('Generating list from template:', template.name)
  }

  if (!currentStore) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          Select a store to manage templates
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Shopping Templates
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create reusable shopping lists for {currentStore.name}
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-gray-600 mb-6">
              Templates help you create consistent shopping lists. They learn from your shopping patterns and suggest items automatically.
            </p>
            <button
              onClick={handleCreateTemplate}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleEditTemplate(template)}
              onGenerateList={() => handleGenerateList(template)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateTemplate && (
        <CreateTemplateModal
          storeId={currentStore.id}
          onClose={() => setShowCreateTemplate(false)}
          onCreated={() => {
            setShowCreateTemplate(false)
            loadTemplates(currentStore.id)
          }}
        />
      )}

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onUpdated={() => {
            setEditingTemplate(null)
            loadTemplates(currentStore.id)
          }}
        />
      )}
    </div>
  )
}

function TemplateCard({
  template,
  onEdit,
  onGenerateList
}: {
  template: Template
  onEdit: () => void
  onGenerateList: () => void
}) {
  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 'Never used'
    
    const date = new Date(lastUsed)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString()
  }

  const highFrequencyItems = template.items.filter(item => item.frequency >= 0.8)
  const mediumFrequencyItems = template.items.filter(item => item.frequency >= 0.5 && item.frequency < 0.8)

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {template.name}
          </h3>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{template.items.length} items</span>
            <span>{template.usage.timesUsed} uses</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Edit template"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onGenerateList}
            className="p-1 text-gray-400 hover:text-green-600 rounded"
            title="Generate shopping list"
          >
            <Play className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(template.usage.completionRate * 100)}%
          </div>
          <div className="text-xs text-gray-500">Completion</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {template.usage.averageItems}
          </div>
          <div className="text-xs text-gray-500">Avg Items</div>
        </div>
      </div>

      {/* Item Categories */}
      <div className="space-y-2 mb-4">
        {highFrequencyItems.length > 0 && (
          <div>
            <div className="text-xs font-medium text-green-700 mb-1">
              Always ({highFrequencyItems.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {highFrequencyItems.slice(0, 3).map((item) => (
                <span
                  key={item.name}
                  className="badge badge-success text-xs"
                >
                  {item.name}
                </span>
              ))}
              {highFrequencyItems.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{highFrequencyItems.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {mediumFrequencyItems.length > 0 && (
          <div>
            <div className="text-xs font-medium text-yellow-700 mb-1">
              Sometimes ({mediumFrequencyItems.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {mediumFrequencyItems.slice(0, 2).map((item) => (
                <span
                  key={item.name}
                  className="badge badge-warning text-xs"
                >
                  {item.name}
                </span>
              ))}
              {mediumFrequencyItems.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{mediumFrequencyItems.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{formatLastUsed(template.usage.lastUsed)}</span>
        </div>
        {template.usage.evolution.length > 0 && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>Learning</span>
          </div>
        )}
      </div>

      {/* Generate List Button */}
      <button
        onClick={onGenerateList}
        className="w-full mt-4 btn btn-primary btn-sm"
      >
        <Play className="h-3 w-3 mr-2" />
        Generate List
      </button>
    </div>
  )
}

function CreateTemplateModal({
  storeId,
  onClose,
  onCreated
}: {
  storeId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const handleRemoveItem = (item: string) => {
    setItems(items.filter(i => i !== item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || items.length === 0) return

    setIsSubmitting(true)
    try {
      // This would call the API to create a template
      console.log('Creating template:', { name, storeId, items })
      onCreated()
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Template
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Weekly Groceries"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Items
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                    className="input flex-1"
                    placeholder="Enter item name"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn btn-secondary"
                    disabled={!newItem.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Items ({items.length})
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={!name.trim() || items.length === 0 || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

function EditTemplateModal({
  template,
  onClose,
  onUpdated
}: {
  template: Template
  onClose: () => void
  onUpdated: () => void
}) {
  // Similar to CreateTemplateModal but pre-filled with template data
  // Implementation would be similar but with edit functionality
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Template: {template.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Template editing functionality would be implemented here
            </p>
            <button
              onClick={onClose}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}