import React, { useState, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { localData } from '../services/localDataService'
import { Camera, Upload, FileText, AlertCircle, Check, Clock } from 'lucide-react'
import type { ReceiptData } from '../types'
import { useToast } from './Toast'

export function ReceiptScanner() {
  const { currentStore } = useAppStore()
  const { showToast, ToastComponent } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleScan = async () => {
    if (!selectedFile || !currentStore) return

    setIsScanning(true)
    try {
      // Local-only mode: Manual receipt entry instead of OCR
      showToast('Switch to manual receipt entry for offline mode', 'info')
      
      // Clear form after showing info message
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Receipt scan failed:', error)
      showToast('Failed to scan receipt. Please try again.', 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Moved formatCurrency, getStatusIcon, getStatusText to ReceiptItem component

  if (!currentStore) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select a store to scan receipts
        </h3>
        <p className="text-gray-500">
          Receipt scanning helps track your purchases and improve shopping suggestions
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Receipt Scanner
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Scan receipts to track purchases and improve shopping recommendations
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Scan New Receipt
        </h3>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-lg p-4">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="max-w-full h-64 object-contain mx-auto rounded"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="btn btn-primary flex-1"
              >
                {isScanning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Scan Receipt
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="btn btn-secondary"
                disabled={isScanning}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCameraCapture}
                  className="btn btn-primary"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Take a photo or upload an image of your receipt
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Receipts History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Receipts
          </h3>
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No receipts scanned yet</p>
            <p className="text-xs">Scan your first receipt above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {receipts.map((receipt) => (
              <ReceiptItem key={receipt.id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Privacy & Security</div>
            <div>
              Receipt images are processed securely and help improve your shopping experience.
              Personal information is extracted and stored locally on your device.
            </div>
          </div>
        </div>
      </div>
      
      {ToastComponent}
    </div>
  )
}

function ReceiptItem({ receipt }: { receipt: ReceiptData }) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusIcon = (status: ReceiptData['processingStatus']) => {
    switch (status) {
      case 'processed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'manual_review':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: ReceiptData['processingStatus']) => {
    switch (status) {
      case 'processed':
        return 'Processed'
      case 'pending':
        return 'Processing...'
      case 'manual_review':
        return 'Needs Review'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon(receipt.processingStatus)}
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(receipt.total)}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(receipt.date)} • {receipt.items.length} items
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            receipt.processingStatus === 'processed' 
              ? 'bg-green-100 text-green-800'
              : receipt.processingStatus === 'manual_review'
              ? 'bg-orange-100 text-orange-800'
              : receipt.processingStatus === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {getStatusText(receipt.processingStatus)}
          </span>
          {receipt.confidence && (
            <span className="text-xs text-gray-500">
              {Math.round(receipt.confidence * 100)}% confident
            </span>
          )}
        </div>
      </div>

      {expanded && receipt.items.length > 0 && (
        <div className="mt-4 pl-7">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Items ({receipt.items.length})
          </div>
          <div className="space-y-1">
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-900">{item.name}</span>
                <span className="text-gray-600">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}