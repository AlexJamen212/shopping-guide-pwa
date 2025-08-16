export interface ShoppingItem {
  id: string
  name: string
  category: string
  checked: boolean
  quantity: string
  notes: string
  addedAt: string
  checkedAt?: string
  storeSpecific?: Record<string, {
    aisle: string
    section: string
    price: number
    lastUpdated: string
  }>
}

export interface ShoppingList {
  id: string
  name: string
  storeId: string
  items: ShoppingItem[]
  templateId?: string
  createdAt: string
  completedAt?: string
  isActive: boolean
  lastModified?: string
}

export interface Store {
  id: string
  name: string
  type: 'trader-joes' | 'price-chopper' | 'whole-foods' | 'custom'
  address?: string
  layout: StoreLayout
  preferences: {
    defaultSort: 'aisle' | 'category' | 'manual' | 'frequency'
    showPrices: boolean
    estimatedShopTime?: number
  }
  createdAt: string
}

export interface StoreLayout {
  sections: StoreSection[]
}

export interface StoreSection {
  id: string
  name: string
  order: number
  aisles: StoreAisle[]
}

export interface StoreAisle {
  id: string
  name: string
  categories: string[]
}

export interface Template {
  id: string
  name: string
  storeId: string
  items: TemplateItem[]
  usage: TemplateUsage
  createdAt: string
  lastModified: string
}

export interface TemplateItem {
  name: string
  category: string
  frequency: number
  suggestedQuantity: string
  alternatives?: string[]
}

export interface TemplateUsage {
  timesUsed: number
  lastUsed?: string
  averageItems: number
  completionRate: number
  evolution: TemplateEvolution[]
}

export interface TemplateEvolution {
  date: string
  action: 'item_added' | 'item_removed' | 'frequency_updated' | 'category_changed'
  itemName: string
  oldValue?: string
  newValue: string
  confidence: number
}

export interface ItemSuggestion {
  itemName: string
  reason: string
  confidence: number
  context: string
  basedOnPattern?: string
}

export interface ShoppingPattern {
  id: string
  type: 'frequent_pair' | 'seasonal_item' | 'substitute_item' | 'bulk_purchase' | 'time_based'
  items: string[]
  strength: number
  contexts: PatternContext[]
  discoveredAt: string
  lastConfirmed: string
  occurrences: number
  confidence: number
}

export interface PatternContext {
  storeId?: string
  season?: string
  dayOfWeek?: string
  timeOfDay?: string
  priceRange?: string
  frequency?: string
}

export interface ReceiptData {
  id: string
  storeId: string
  date: string
  total: number
  items: ReceiptItem[]
  processingStatus: 'pending' | 'processed' | 'failed' | 'manual_review'
  imageUrl: string
  rawText: string
  confidence?: number
}

export interface ReceiptItem {
  name: string
  price: number
  quantity: number
  category: string
  matched: boolean
  confidence: number
  normalizedName?: string
}

export interface SyncResult {
  success: boolean
  conflicts: SyncConflict[]
  updated: {
    lists: number
    templates: number
    stores: number
    itemHistory: number
    patterns: number
  }
  lastSync: string
}

export interface SyncConflict {
  id: string
  type: 'template' | 'list' | 'store'
  localVersion: any
  remoteVersion: any
  timestamp: string
}

export interface AppState {
  currentStore: Store | null
  currentList: ShoppingList | null
  stores: Store[]
  lists: ShoppingList[]
  templates: Template[]
  isOnline: boolean
  lastSync?: string
  user: {
    id: string
    deviceId: string
  }
}