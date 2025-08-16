import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState, Store, ShoppingList, Template } from '../types'
import { localData } from '../services/localDataService'

interface AppStore extends AppState {
  // Actions
  setCurrentStore: (store: Store | null) => void
  setCurrentList: (list: ShoppingList | null) => void
  loadStores: () => Promise<void>
  loadLists: (storeId?: string) => Promise<void>
  loadTemplates: (storeId?: string) => Promise<void>
  createNewList: (name: string, storeId: string, templateId?: string) => Promise<ShoppingList>
  updateListItem: (listId: string, itemId: string, updates: Partial<ShoppingList['items'][0]>) => Promise<void>
  addItemToCurrentList: (item: Partial<ShoppingList['items'][0]>) => Promise<void>
  completeCurrentList: () => Promise<void>
  syncData: () => Promise<void>
  setOnlineStatus: (isOnline: boolean) => void
  
  // Computed
  getCurrentStoreTemplates: () => Template[]
  getCurrentStoreLists: () => ShoppingList[]
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStore: null,
      currentList: null,
      stores: [],
      lists: [],
      templates: [],
      isOnline: navigator.onLine,
      user: {
        id: localStorage.getItem('userId') || `user-${Date.now()}`,
        deviceId: localStorage.getItem('deviceId') || `device-${Date.now()}`
      },

      // Actions
      setCurrentStore: (store) => {
        set({ currentStore: store })
        if (store) {
          get().loadLists(store.id)
          get().loadTemplates(store.id)
        }
      },

      setCurrentList: (list) => set({ currentList: list }),

      loadStores: async () => {
        try {
          const stores = await localData.getStores()
          set({ stores })
        } catch (error) {
          console.error('Failed to load stores:', error)
        }
      },

      loadLists: async (storeId) => {
        try {
          const lists = await localData.getLists(storeId, true)
          set({ lists })
        } catch (error) {
          console.error('Failed to load lists:', error)
        }
      },

      loadTemplates: async (storeId) => {
        try {
          const templates = await localData.getTemplates(storeId)
          set({ templates })
        } catch (error) {
          console.error('Failed to load templates:', error)
        }
      },

      createNewList: async (name, storeId, templateId) => {
        try {
          let newList: ShoppingList

          if (templateId) {
            // Generate from template
            newList = await localData.generateListFromTemplate(templateId, {
              listName: name
            })
          } else {
            // Create empty list
            newList = await localData.createList({
              name,
              storeId,
              items: []
            })
          }

          // Update local state
          set((state) => ({
            lists: [...state.lists, newList],
            currentList: newList
          }))

          return newList
        } catch (error) {
          console.error('Failed to create list:', error)
          throw error
        }
      },

      updateListItem: async (listId, itemId, updates) => {
        try {
          const updatedItem = await localData.updateListItem(listId, itemId, updates)
          
          set((state) => ({
            lists: state.lists.map(list =>
              list.id === listId
                ? {
                    ...list,
                    items: list.items.map(item =>
                      item.id === itemId ? updatedItem : item
                    )
                  }
                : list
            ),
            currentList: state.currentList?.id === listId
              ? {
                  ...state.currentList,
                  items: state.currentList.items.map(item =>
                    item.id === itemId ? updatedItem : item
                  )
                }
              : state.currentList
          }))
        } catch (error) {
          console.error('Failed to update list item:', error)
          throw error
        }
      },

      addItemToCurrentList: async (item) => {
        const { currentList } = get()
        if (!currentList) throw new Error('No current list selected')

        try {
          const newItem = await localData.addItemToList(currentList.id, item)
          
          set((state) => ({
            lists: state.lists.map(list =>
              list.id === currentList.id
                ? { ...list, items: [...list.items, newItem] }
                : list
            ),
            currentList: state.currentList
              ? { ...state.currentList, items: [...state.currentList.items, newItem] }
              : state.currentList
          }))
        } catch (error) {
          console.error('Failed to add item to list:', error)
          throw error
        }
      },

      completeCurrentList: async () => {
        const { currentList } = get()
        if (!currentList) throw new Error('No current list selected')

        try {
          await localData.completeList(currentList.id)
          
          set((state) => ({
            lists: state.lists.map(list =>
              list.id === currentList.id
                ? { ...list, isActive: false, completedAt: new Date().toISOString() }
                : list
            ),
            currentList: null
          }))
        } catch (error) {
          console.error('Failed to complete list:', error)
          throw error
        }
      },

      syncData: async () => {
        // Local-only mode - no sync needed
        console.log('Local-only mode: No sync required')
        set({ lastSync: new Date().toISOString() })
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline })
        if (isOnline) {
          // Auto-sync when coming back online
          get().syncData()
        }
      },

      // Computed getters
      getCurrentStoreTemplates: () => {
        const { templates, currentStore } = get()
        return currentStore ? templates.filter(t => t.storeId === currentStore.id) : []
      },

      getCurrentStoreLists: () => {
        const { lists, currentStore } = get()
        return currentStore ? lists.filter(l => l.storeId === currentStore.id) : []
      },
    }),
    {
      name: 'shopping-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStore: state.currentStore,
        stores: state.stores,
        user: state.user,
        lastSync: state.lastSync
      })
    }
  )
)

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setOnlineStatus(true))
  window.addEventListener('offline', () => useAppStore.getState().setOnlineStatus(false))
}

// Auto-sync every 5 minutes when online
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { isOnline, syncData } = useAppStore.getState()
    if (isOnline) {
      syncData()
    }
  }, 5 * 60 * 1000)
}