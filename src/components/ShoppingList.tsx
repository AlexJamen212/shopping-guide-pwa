import React, { useState } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { Check, Plus, ShoppingCart } from 'lucide-react'
import type { ShoppingItem } from '../types'

export function ShoppingList() {
  const {
    currentList,
    currentStore,
    updateListItem,
    addItemToCurrentList,
    completeCurrentList
  } = useAppStore()

  const [newItemName, setNewItemName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!currentList || !currentStore) return null

  const handleCheckItem = async (item: ShoppingItem) => {
    try {
      await updateListItem(currentList.id, item.id, {
        checked: !item.checked,
        checkedAt: !item.checked ? new Date().toISOString() : undefined
      })
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    setIsAdding(true)
    try {
      await addItemToCurrentList({
        name: newItemName.trim(),
        category: 'misc',
        quantity: '1',
        notes: ''
      })
      setNewItemName('')
    } catch (error) {
      console.error('Failed to add item:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleCompleteList = async () => {
    if (window.confirm('Complete this shopping list? This action cannot be undone.')) {
      try {
        await completeCurrentList()
      } catch (error) {
        console.error('Failed to complete list:', error)
      }
    }
  }

  const checkedItems = currentList.items.filter(item => item.checked)
  const uncheckedItems = currentList.items.filter(item => !item.checked)
  const completionRate = Math.round((checkedItems.length / currentList.items.length) * 100) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentList.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentStore.name} • {checkedItems.length}/{currentList.items.length} items
            </p>
          </div>
          <button
            onClick={handleCompleteList}
            className="btn btn-primary btn-sm"
            disabled={checkedItems.length === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            Complete
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="flex space-x-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add item to list..."
            className="input flex-1"
            disabled={isAdding}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newItemName.trim() || isAdding}
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Shopping Items */}
      <div className="space-y-4">
        {/* Unchecked Items */}
        {uncheckedItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                To Buy ({uncheckedItems.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {uncheckedItems.map((item) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onCheck={() => handleCheckItem(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                In Cart ({checkedItems.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {checkedItems.map((item) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onCheck={() => handleCheckItem(item)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {currentList.items.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your list is empty
          </h3>
          <p className="text-gray-500">
            Add items above to start shopping
          </p>
        </div>
      )}
    </div>
  )
}

function ShoppingListItem({
  item,
  onCheck
}: {
  item: ShoppingItem
  onCheck: () => void
}) {
  return (
    <div className="p-4 flex items-center space-x-3 hover:bg-gray-50">
      <button
        onClick={onCheck}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          item.checked
            ? 'bg-primary-600 border-primary-600 text-white'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        {item.checked && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${
          item.checked ? 'text-gray-500 line-through' : 'text-gray-900'
        }`}>
          {item.name}
        </div>
        {(item.quantity !== '1' || item.notes) && (
          <div className="text-xs text-gray-500 mt-1">
            {item.quantity !== '1' && `Qty: ${item.quantity}`}
            {item.quantity !== '1' && item.notes && ' • '}
            {item.notes}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <span className="badge badge-secondary text-xs">
          {item.category}
        </span>
      </div>
    </div>
  )
}