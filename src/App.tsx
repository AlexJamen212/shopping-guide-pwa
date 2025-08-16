import React, { useEffect, useState } from 'react'
import { useAppStore } from './stores/useAppStore'
import { StoreSelector } from './components/StoreSelector'
import { ShoppingList } from './components/ShoppingList'
import { TemplateManager } from './components/TemplateManager'
import { ReceiptScanner } from './components/ReceiptScanner'
import { Navigation } from './components/Navigation'
import { QuickAdd } from './components/QuickAdd'
import { SyncStatus } from './components/SyncStatus'
import { Menu, ShoppingCart, Settings } from 'lucide-react'

type View = 'shopping' | 'templates' | 'receipts' | 'settings'

function App() {
  const {
    currentStore,
    currentList,
    isOnline,
    loadStores,
    setCurrentStore,
    setCurrentList,
    getCurrentStoreLists
  } = useAppStore()

  const [currentView, setCurrentView] = useState<View>('shopping')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    // Load initial data
    loadStores()
    
    // Store user and device IDs in localStorage if not already present
    const userId = localStorage.getItem('userId')
    const deviceId = localStorage.getItem('deviceId')
    
    if (!userId) {
      localStorage.setItem('userId', `user-${Date.now()}`)
    }
    if (!deviceId) {
      localStorage.setItem('deviceId', `device-${Date.now()}`)
    }
  }, [loadStores])

  // Load lists when currentStore changes (including on app initialization)
  useEffect(() => {
    if (currentStore) {
      setCurrentStore(currentStore) // This triggers loadLists and loadTemplates
    }
  }, [currentStore?.id, setCurrentStore])

  const storeLists = getCurrentStoreLists()
  const activeList = storeLists.find(list => list.isActive)

  const handleNewList = () => {
    setCurrentView('shopping')
    setCurrentList(null)
  }

  const handleSelectList = (list: any) => {
    setCurrentList(list)
    setCurrentView('shopping')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'shopping':
        return (
          <div className="space-y-4">
            {currentList ? (
              <ShoppingList />
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No active shopping list
                </h3>
                <p className="text-gray-500 mb-6">
                  Create a new list or select an existing one to get started
                </p>
                <QuickAdd />
              </div>
            )}
          </div>
        )
      case 'templates':
        return <TemplateManager />
      case 'receipts':
        return <ReceiptScanner />
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Sync Status</h3>
                <SyncStatus />
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Data Management</h3>
                <p className="text-sm text-gray-600">
                  Offline storage: {currentStore ? 'Enabled' : 'No store selected'}
                </p>
                <p className="text-sm text-gray-600">
                  Network: {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Shopping Guide
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {!isOnline && (
                <span className="text-sm text-orange-600 font-medium">
                  Offline
                </span>
              )}
              <StoreSelector />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className={`lg:w-64 ${showMobileMenu ? 'block' : 'hidden lg:block'}`}>
            <Navigation
              currentView={currentView}
              onViewChange={setCurrentView}
              lists={storeLists}
              onSelectList={handleSelectList}
              onNewList={handleNewList}
              currentStore={currentStore}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            {currentStore ? (
              renderCurrentView()
            ) : (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a store to get started
                </h3>
                <p className="text-gray-500 mb-6">
                  Choose your store from the dropdown above to create lists and templates
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App