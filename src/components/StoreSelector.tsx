import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { ChevronDown, Plus, MapPin, Clock } from 'lucide-react'
import { localData } from '../services/localDataService'
import type { Store } from '../types'

export function StoreSelector() {
  const {
    currentStore,
    stores,
    setCurrentStore,
    loadStores
  } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)
  const [showCreateStore, setShowCreateStore] = useState(false)

  useEffect(() => {
    if (stores.length === 0) {
      loadStores()
    }
  }, [stores.length, loadStores])

  const handleStoreSelect = (store: Store) => {
    setCurrentStore(store)
    setIsOpen(false)
  }

  const handleCreateStore = () => {
    setShowCreateStore(true)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">
          {currentStore ? currentStore.name : 'Select Store'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2">
                SELECT STORE
              </div>
              
              {stores.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No stores configured</p>
                  <p className="text-xs">Create your first store below</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSelect(store)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                        currentStore?.id === store.id 
                          ? 'bg-primary-50 text-primary-700 font-medium' 
                          : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{store.name}</div>
                          {store.address && (
                            <div className="text-xs text-gray-500 truncate">
                              {store.address}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {store.preferences.estimatedShopTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{store.preferences.estimatedShopTime}m</span>
                            </div>
                          )}
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={handleCreateStore}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Store</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Store Modal */}
      {showCreateStore && (
        <CreateStoreModal 
          onClose={() => setShowCreateStore(false)}
          onCreated={(store) => {
            setCurrentStore(store)
            loadStores() // Reload stores to get the new one
            setShowCreateStore(false)
          }}
        />
      )}
    </div>
  )
}

function CreateStoreModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void
  onCreated: (store: Store) => void 
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<Store['type']>('custom')
  const [address, setAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      // Call the API to create a store
      const storeData = {
        name: name.trim(),
        type,
        address: address.trim()
      }
      
      const newStore = await localData.createStore(storeData)
      onCreated(newStore)
    } catch (error) {
      console.error('Failed to create store:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Store
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Trader Joe's Downtown"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Store['type'])}
                  className="input w-full"
                >
                  <option value="custom">Custom Store</option>
                  <option value="trader-joes">Trader Joe's</option>
                  <option value="price-chopper">Price Chopper</option>
                  <option value="whole-foods">Whole Foods</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pre-configured stores include optimized layouts
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input w-full"
                  placeholder="123 Main St, City, State"
                />
              </div>

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
                  disabled={!name.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}