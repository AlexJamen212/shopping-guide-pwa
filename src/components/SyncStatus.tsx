import React, { useState } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Smartphone } from 'lucide-react'

export function SyncStatus() {
  const { isOnline, lastSync, syncData } = useAppStore()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleManualSync = async () => {
    if (!isOnline) return
    
    setIsSyncing(true)
    try {
      await syncData()
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (lastSyncTime?: string) => {
    if (!lastSyncTime) return 'Never'
    
    const date = new Date(lastSyncTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  const getSyncStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
    }
    
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-gray-400" />
    }
    
    if (lastSync) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getSyncStatusText = () => {
    if (isSyncing) return 'Syncing...'
    if (!isOnline) return 'Offline'
    if (lastSync) return 'Synced'
    return 'Not synced'
  }

  const getSyncStatusColor = () => {
    if (isSyncing) return 'text-blue-600'
    if (!isOnline) return 'text-gray-500'
    if (lastSync) return 'text-green-600'
    return 'text-yellow-600'
  }

  return (
    <div className="space-y-4">
      {/* Main Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getSyncStatusIcon()}
          <div>
            <div className={`text-sm font-medium ${getSyncStatusColor()}`}>
              {getSyncStatusText()}
            </div>
            <div className="text-xs text-gray-500">
              Last sync: {formatLastSync(lastSync)}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center space-x-2 text-xs text-gray-600">
        {isOnline ? (
          <>
            <Cloud className="h-3 w-3 text-green-500" />
            <span>Connected to server</span>
          </>
        ) : (
          <>
            <CloudOff className="h-3 w-3 text-gray-400" />
            <span>Working offline - changes will sync when reconnected</span>
          </>
        )}
      </div>

      {/* Device Info */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
          <Smartphone className="h-3 w-3" />
          <span>This Device</span>
        </div>
        <div className="text-xs text-gray-600">
          <div>Device ID: {useAppStore.getState().user.deviceId.slice(-8)}</div>
          <div>User ID: {useAppStore.getState().user.id.slice(-8)}</div>
        </div>
      </div>

      {/* Sync Features */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs font-medium text-gray-700 mb-2">
          Sync Features
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Shopping lists</span>
            <Check className="h-3 w-3 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span>Templates</span>
            <Check className="h-3 w-3 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span>Store preferences</span>
            <Check className="h-3 w-3 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span>Shopping patterns</span>
            <Check className="h-3 w-3 text-green-500" />
          </div>
        </div>
      </div>

      {/* Auto-sync Info */}
      <div className="bg-blue-50 rounded-md p-3">
        <div className="text-xs text-blue-800">
          <div className="font-medium mb-1">Auto-sync enabled</div>
          <div>
            Your data automatically syncs across devices when online. 
            Changes are saved locally when offline and will sync when you reconnect.
          </div>
        </div>
      </div>
    </div>
  )
}