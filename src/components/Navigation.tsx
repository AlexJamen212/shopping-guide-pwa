import React from 'react'
import { ShoppingCart, FileText, Receipt, Settings, Plus, List, Calendar } from 'lucide-react'
import type { ShoppingList, Store } from '../types'

type View = 'shopping' | 'templates' | 'receipts' | 'settings'

interface NavigationProps {
  currentView: View
  onViewChange: (view: View) => void
  lists: ShoppingList[]
  onSelectList: (list: ShoppingList) => void
  onNewList: () => void
  currentStore: Store | null
}

export function Navigation({
  currentView,
  onViewChange,
  lists,
  onSelectList,
  onNewList,
  currentStore
}: NavigationProps) {
  const activeLists = lists.filter(list => list.isActive)
  const completedLists = lists.filter(list => !list.isActive).slice(0, 5) // Show last 5 completed

  const navItems = [
    {
      id: 'shopping' as const,
      label: 'Shopping',
      icon: ShoppingCart,
      count: activeLists.length
    },
    {
      id: 'templates' as const,
      label: 'Templates',
      icon: FileText,
      count: undefined
    },
    {
      id: 'receipts' as const,
      label: 'Receipts',
      icon: Receipt,
      count: undefined
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      count: undefined
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-fit">
      {/* Main Navigation */}
      <div className="p-4 border-b border-gray-200">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-primary-200 text-primary-800' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Shopping Lists Section */}
      {currentStore && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              {currentStore.name}
            </h3>
            <button
              onClick={onNewList}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              title="Create new list"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Active Lists */}
          {activeLists.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Active Lists
              </div>
              <div className="space-y-1">
                {activeLists.map((list) => (
                  <ListItem
                    key={list.id}
                    list={list}
                    onClick={() => onSelectList(list)}
                    isActive={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Lists */}
          {completedLists.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Recent
              </div>
              <div className="space-y-1">
                {completedLists.map((list) => (
                  <ListItem
                    key={list.id}
                    list={list}
                    onClick={() => onSelectList(list)}
                    isActive={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeLists.length === 0 && completedLists.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No shopping lists</p>
              <button
                onClick={onNewList}
                className="text-xs text-primary-600 hover:text-primary-700 mt-1"
              >
                Create your first list
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ListItem({ 
  list, 
  onClick, 
  isActive 
}: { 
  list: ShoppingList
  onClick: () => void
  isActive: boolean 
}) {
  const checkedItems = list.items.filter(item => item.checked).length
  const totalItems = list.items.length
  const completionRate = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-md border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
          {list.name}
        </h4>
        <div className="flex items-center space-x-2 ml-2">
          {isActive ? (
            <div className="w-2 h-2 bg-green-400 rounded-full" />
          ) : (
            <Calendar className="h-3 w-3 text-gray-400" />
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {checkedItems}/{totalItems} items
          {!isActive && ` • ${completionRate}%`}
        </span>
        <span>
          {formatDate(isActive ? list.createdAt : list.completedAt || list.createdAt)}
        </span>
      </div>
      
      {/* Progress bar for active lists */}
      {isActive && totalItems > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}