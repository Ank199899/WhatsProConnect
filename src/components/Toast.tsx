'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // Wait for animation
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertCircle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        p-4 rounded-lg border shadow-lg
        ${bgColors[type]}
      `}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {title}
            </h4>
            {message && (
              <p className="mt-1 text-sm text-gray-600">
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(id), 300)
            }}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  // Make toast functions globally available
  useEffect(() => {
    (window as any).toast = {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo
    }
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
