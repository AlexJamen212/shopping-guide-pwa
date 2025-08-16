import type { Store, ShoppingList, ShoppingItem, Template, ReceiptData } from '../types'

interface LocalDatabase {
  stores: Store[]
  lists: ShoppingList[]
  templates: Template[]
  receipts: ReceiptData[]
  settings: {
    lastBackup: string
    storageUsed: number
    itemHistory: { [itemName: string]: { count: number; lastUsed: string } }
  }
}

class LocalDataService {
  private dbName = 'ShoppingGuideDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Stores table
        if (!db.objectStoreNames.contains('stores')) {
          const storesStore = db.createObjectStore('stores', { keyPath: 'id' })
          storesStore.createIndex('type', 'type', { unique: false })
          storesStore.createIndex('name', 'name', { unique: false })
        }

        // Lists table
        if (!db.objectStoreNames.contains('lists')) {
          const listsStore = db.createObjectStore('lists', { keyPath: 'id' })
          listsStore.createIndex('storeId', 'storeId', { unique: false })
          listsStore.createIndex('isActive', 'isActive', { unique: false })
          listsStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Templates table
        if (!db.objectStoreNames.contains('templates')) {
          const templatesStore = db.createObjectStore('templates', { keyPath: 'id' })
          templatesStore.createIndex('storeId', 'storeId', { unique: false })
          templatesStore.createIndex('name', 'name', { unique: false })
        }

        // Receipts table
        if (!db.objectStoreNames.contains('receipts')) {
          const receiptsStore = db.createObjectStore('receipts', { keyPath: 'id' })
          receiptsStore.createIndex('storeId', 'storeId', { unique: false })
          receiptsStore.createIndex('date', 'date', { unique: false })
        }

        // Settings table
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB()
    }
    return this.db!
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // =============================================================================
  // STORE OPERATIONS - Replace 5 API endpoints
  // =============================================================================

  async getStores(): Promise<Store[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stores'], 'readonly')
      const store = transaction.objectStore('stores')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async createStore(storeData: Partial<Store>): Promise<Store> {
    const db = await this.ensureDB()
    
    const newStore: Store = {
      id: this.generateId(),
      name: storeData.name || 'New Store',
      type: storeData.type || 'custom',
      address: storeData.address || '',
      layout: storeData.layout || this.getDefaultLayout(),
      preferences: {
        defaultSort: 'category',
        showPrices: true,
        estimatedShopTime: 30,
        ...storeData.preferences
      },
      createdAt: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stores'], 'readwrite')
      const store = transaction.objectStore('stores')
      const request = store.add(newStore)

      request.onsuccess = () => resolve(newStore)
      request.onerror = () => reject(request.error)
    })
  }

  async updateStore(id: string, updates: Partial<Store>): Promise<Store> {
    const db = await this.ensureDB()
    
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(['stores'], 'readwrite')
      const store = transaction.objectStore('stores')
      
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const existingStore = getRequest.result
        if (!existingStore) {
          reject(new Error('Store not found'))
          return
        }

        const updatedStore = { ...existingStore, ...updates, id }
        const putRequest = store.put(updatedStore)
        
        putRequest.onsuccess = () => resolve(updatedStore)
        putRequest.onerror = () => reject(putRequest.error)
      }
    })
  }

  async deleteStore(id: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stores', 'lists', 'templates'], 'readwrite')
      
      // Delete store
      const storesStore = transaction.objectStore('stores')
      const deleteStoreRequest = storesStore.delete(id)
      
      // Delete associated lists
      const listsStore = transaction.objectStore('lists')
      const listsIndex = listsStore.index('storeId')
      const getListsRequest = listsIndex.getAllKeys(id)
      
      getListsRequest.onsuccess = () => {
        const listIds = getListsRequest.result
        listIds.forEach(listId => listsStore.delete(listId))
      }
      
      // Delete associated templates
      const templatesStore = transaction.objectStore('templates')
      const templatesIndex = templatesStore.index('storeId')
      const getTemplatesRequest = templatesIndex.getAllKeys(id)
      
      getTemplatesRequest.onsuccess = () => {
        const templateIds = getTemplatesRequest.result
        templateIds.forEach(templateId => templatesStore.delete(templateId))
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // =============================================================================
  // SHOPPING LIST OPERATIONS - Replace 8 API endpoints
  // =============================================================================

  async getLists(storeId?: string, activeOnly?: boolean): Promise<ShoppingList[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['lists'], 'readonly')
      const store = transaction.objectStore('lists')
      const request = store.getAll()

      request.onsuccess = () => {
        let lists = request.result || []
        
        if (storeId) {
          lists = lists.filter(list => list.storeId === storeId)
        }
        
        if (activeOnly) {
          lists = lists.filter(list => list.isActive)
        }
        
        // Sort by creation date (newest first)
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        resolve(lists)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async createList(listData: Partial<ShoppingList>): Promise<ShoppingList> {
    const db = await this.ensureDB()
    
    const newList: ShoppingList = {
      id: this.generateId(),
      name: listData.name || 'New List',
      storeId: listData.storeId || '',
      items: listData.items || [],
      templateId: listData.templateId,
      createdAt: new Date().toISOString(),
      isActive: true,
      lastModified: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['lists'], 'readwrite')
      const store = transaction.objectStore('lists')
      const request = store.add(newList)

      request.onsuccess = () => resolve(newList)
      request.onerror = () => reject(request.error)
    })
  }

  async updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['lists'], 'readwrite')
      const store = transaction.objectStore('lists')
      
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const existingList = getRequest.result
        if (!existingList) {
          reject(new Error('List not found'))
          return
        }

        const updatedList = { 
          ...existingList, 
          ...updates, 
          id,
          lastModified: new Date().toISOString()
        }
        const putRequest = store.put(updatedList)
        
        putRequest.onsuccess = () => resolve(updatedList)
        putRequest.onerror = () => reject(putRequest.error)
      }
    })
  }

  async addItemToList(listId: string, itemData: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const newItem: ShoppingItem = {
      id: this.generateId(),
      name: itemData.name || 'New Item',
      category: itemData.category || await this.categorizeItem(itemData.name || ''),
      checked: false,
      quantity: itemData.quantity || '1',
      notes: itemData.notes || '',
      addedAt: new Date().toISOString()
    }

    const list = await this.getList(listId)
    if (!list) throw new Error('List not found')

    const updatedList = {
      ...list,
      items: [...list.items, newItem],
      lastModified: new Date().toISOString()
    }

    await this.updateList(listId, updatedList)
    
    // Update item history for suggestions
    await this.updateItemHistory(newItem.name)
    
    return newItem
  }

  async updateListItem(listId: string, itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const list = await this.getList(listId)
    if (!list) throw new Error('List not found')

    const itemIndex = list.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) throw new Error('Item not found')

    const updatedItem = { ...list.items[itemIndex], ...updates }
    
    if (updates.checked && !list.items[itemIndex].checked) {
      updatedItem.checkedAt = new Date().toISOString()
    }

    const updatedItems = [...list.items]
    updatedItems[itemIndex] = updatedItem

    await this.updateList(listId, { 
      items: updatedItems,
      lastModified: new Date().toISOString()
    })

    return updatedItem
  }

  async deleteListItem(listId: string, itemId: string): Promise<void> {
    const list = await this.getList(listId)
    if (!list) throw new Error('List not found')

    const updatedItems = list.items.filter(item => item.id !== itemId)
    
    await this.updateList(listId, { 
      items: updatedItems,
      lastModified: new Date().toISOString()
    })
  }

  async completeList(id: string): Promise<void> {
    await this.updateList(id, {
      isActive: false,
      completedAt: new Date().toISOString()
    })

    // Update template learning from completed list
    const list = await this.getList(id)
    if (list && list.templateId) {
      await this.updateTemplateUsage(list.templateId, list)
    }
  }

  async getList(id: string): Promise<ShoppingList | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['lists'], 'readonly')
      const store = transaction.objectStore('lists')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // =============================================================================
  // TEMPLATE OPERATIONS - Replace 7 API endpoints
  // =============================================================================

  async getTemplates(storeId?: string): Promise<Template[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readonly')
      const store = transaction.objectStore('templates')
      const request = store.getAll()

      request.onsuccess = () => {
        let templates = request.result || []
        
        if (storeId) {
          templates = templates.filter(template => template.storeId === storeId)
        }
        
        resolve(templates)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async createTemplate(templateData: Partial<Template>): Promise<Template> {
    const db = await this.ensureDB()
    
    const newTemplate: Template = {
      id: this.generateId(),
      name: templateData.name || 'New Template',
      storeId: templateData.storeId || '',
      items: templateData.items || [],
      usage: {
        timesUsed: 0,
        averageItems: templateData.items?.length || 0,
        completionRate: 1.0,
        evolution: []
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readwrite')
      const store = transaction.objectStore('templates')
      const request = store.add(newTemplate)

      request.onsuccess = () => resolve(newTemplate)
      request.onerror = () => reject(request.error)
    })
  }

  async generateListFromTemplate(templateId: string, options: { listName?: string }): Promise<ShoppingList> {
    const template = await this.getTemplate(templateId)
    if (!template) throw new Error('Template not found')

    const newList: ShoppingList = {
      id: this.generateId(),
      name: options.listName || `${template.name} - ${new Date().toLocaleDateString()}`,
      storeId: template.storeId,
      templateId: template.id,
      items: template.items.map(templateItem => ({
        id: this.generateId(),
        name: templateItem.name,
        category: templateItem.category,
        checked: false,
        quantity: templateItem.suggestedQuantity || '1',
        notes: '',
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      isActive: true,
      lastModified: new Date().toISOString()
    }

    // Save the new list
    const savedList = await this.createList(newList)
    
    // Update template usage
    await this.updateTemplateUsage(templateId)
    
    return savedList
  }

  private async getTemplate(id: string): Promise<Template | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readonly')
      const store = transaction.objectStore('templates')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  private async updateTemplateUsage(templateId: string, completedList?: ShoppingList): Promise<void> {
    const template = await this.getTemplate(templateId)
    if (!template) return

    const updatedTemplate = {
      ...template,
      usage: {
        ...template.usage,
        timesUsed: template.usage.timesUsed + 1,
        lastUsed: new Date().toISOString()
      },
      lastModified: new Date().toISOString()
    }

    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readwrite')
      const store = transaction.objectStore('templates')
      const request = store.put(updatedTemplate)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // =============================================================================
  // LOCAL INTELLIGENCE - Replace AI features with simple algorithms
  // =============================================================================

  async getItemSuggestions(currentItems: string[], storeId: string): Promise<Array<{
    itemName: string
    reason: string
    confidence: number
  }>> {
    const suggestions: Array<{ itemName: string; reason: string; confidence: number }> = []
    
    // Get item history for frequency analysis
    const itemHistory = await this.getItemHistory()
    
    // Suggest frequently bought items not in current list
    const frequentItems = Object.entries(itemHistory)
      .filter(([itemName]) => !currentItems.some(current => 
        current.toLowerCase() === itemName.toLowerCase()
      ))
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)

    for (const [itemName, data] of frequentItems) {
      if (data.count >= 3) {
        suggestions.push({
          itemName,
          reason: `Bought ${data.count} times`,
          confidence: Math.min(0.9, data.count / 10)
        })
      }
    }

    // Add day-of-week patterns
    const dayOfWeek = new Date().getDay()
    const dayPatterns = await this.getDayPatterns(dayOfWeek)
    
    for (const item of dayPatterns) {
      if (!currentItems.some(current => current.toLowerCase() === item.toLowerCase())) {
        suggestions.push({
          itemName: item,
          reason: `Often bought on ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`,
          confidence: 0.6
        })
      }
    }

    return suggestions.slice(0, 8) // Limit to 8 suggestions
  }

  private async getItemHistory(): Promise<{ [itemName: string]: { count: number; lastUsed: string } }> {
    const settings = await this.getSetting('itemHistory')
    return settings || {}
  }

  private async updateItemHistory(itemName: string): Promise<void> {
    const history = await this.getItemHistory()
    const normalizedName = itemName.toLowerCase().trim()
    
    history[normalizedName] = {
      count: (history[normalizedName]?.count || 0) + 1,
      lastUsed: new Date().toISOString()
    }
    
    await this.setSetting('itemHistory', history)
  }

  private async getDayPatterns(dayOfWeek: number): Promise<string[]> {
    // Simple day-based patterns
    const patterns: { [key: number]: string[] } = {
      0: ['Coffee', 'Pastries'], // Sunday
      1: ['Lunch Items', 'Snacks'], // Monday  
      2: ['Fresh Produce'], // Tuesday
      3: ['Midweek Essentials'], // Wednesday
      4: ['Weekend Prep'], // Thursday
      5: ['Fresh Fish', 'Weekend Food'], // Friday
      6: ['Party Supplies', 'Treats'] // Saturday
    }
    
    return patterns[dayOfWeek] || []
  }

  private async categorizeItem(itemName: string): Promise<string> {
    const categories: { [key: string]: string[] } = {
      'produce': ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'carrot'],
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'eggs', 'cream'],
      'meat': ['chicken', 'beef', 'pork', 'fish', 'turkey'],
      'pantry': ['pasta', 'rice', 'bread', 'flour', 'sugar', 'oil'],
      'snacks': ['chips', 'crackers', 'cookies', 'nuts'],
      'beverages': ['water', 'soda', 'juice', 'coffee', 'tea'],
      'frozen': ['ice cream', 'frozen pizza', 'frozen vegetables'],
      'household': ['paper towels', 'soap', 'shampoo', 'detergent']
    }

    const lowerName = itemName.toLowerCase()
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category
      }
    }
    
    return 'misc'
  }

  // =============================================================================
  // RECEIPT OPERATIONS - Simplified local storage
  // =============================================================================

  async saveReceipt(receiptData: Partial<ReceiptData>): Promise<ReceiptData> {
    const db = await this.ensureDB()
    
    const newReceipt: ReceiptData = {
      id: this.generateId(),
      storeId: receiptData.storeId || '',
      date: receiptData.date || new Date().toISOString(),
      total: receiptData.total || 0,
      items: receiptData.items || [],
      processingStatus: 'processed',
      imageUrl: '', // No images in local-only mode
      rawText: receiptData.rawText || '',
      confidence: 1.0 // Manual entry is 100% confident
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['receipts'], 'readwrite')
      const store = transaction.objectStore('receipts')
      const request = store.add(newReceipt)

      request.onsuccess = () => {
        // Update item history from receipt
        newReceipt.items.forEach(item => {
          this.updateItemHistory(item.name)
        })
        resolve(newReceipt)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getReceipts(storeId?: string): Promise<ReceiptData[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['receipts'], 'readonly')
      const store = transaction.objectStore('receipts')
      const request = store.getAll()

      request.onsuccess = () => {
        let receipts = request.result || []
        
        if (storeId) {
          receipts = receipts.filter(receipt => receipt.storeId === storeId)
        }
        
        // Sort by date (newest first)
        receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        resolve(receipts)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // =============================================================================
  // BACKUP & RESTORE - For data portability
  // =============================================================================

  async exportData(): Promise<string> {
    const data = {
      stores: await this.getStores(),
      lists: await this.getLists(),
      templates: await this.getTemplates(),
      receipts: await this.getReceipts(),
      itemHistory: await this.getItemHistory(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    return JSON.stringify(data, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)
      
      // Clear existing data
      await this.clearAllData()
      
      // Import stores
      for (const store of data.stores || []) {
        await this.createStore(store)
      }
      
      // Import templates  
      for (const template of data.templates || []) {
        await this.createTemplate(template)
      }
      
      // Import lists
      for (const list of data.lists || []) {
        await this.createList(list)
      }
      
      // Import receipts
      for (const receipt of data.receipts || []) {
        await this.saveReceipt(receipt)
      }
      
      // Import item history
      if (data.itemHistory) {
        await this.setSetting('itemHistory', data.itemHistory)
      }
      
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message)
    }
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  private async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  private async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite')
      const store = transaction.objectStore('settings')
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['stores', 'lists', 'templates', 'receipts', 'settings'], 'readwrite')
      
      const stores = ['stores', 'lists', 'templates', 'receipts', 'settings']
      let completed = 0
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        
        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }
      })
      
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getStorageInfo(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0
      
      return { used, quota, percentage }
    }
    
    return { used: 0, quota: 0, percentage: 0 }
  }

  private getDefaultLayout() {
    return {
      sections: [
        {
          id: 'produce',
          name: 'Produce',
          order: 1,
          aisles: [
            {
              id: 'fresh-produce',
              name: 'Fresh Produce',
              categories: ['fruits', 'vegetables']
            }
          ]
        },
        {
          id: 'center-store',
          name: 'Center Store',
          order: 2,
          aisles: [
            {
              id: 'pantry',
              name: 'Pantry Items',
              categories: ['pantry', 'snacks', 'beverages']
            }
          ]
        },
        {
          id: 'perimeter',
          name: 'Perimeter',
          order: 3,
          aisles: [
            {
              id: 'dairy-meat',
              name: 'Dairy & Meat',
              categories: ['dairy', 'meat', 'frozen']
            }
          ]
        }
      ]
    }
  }
}

export const localData = new LocalDataService()