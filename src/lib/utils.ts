import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timestamp: number | string) {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(timestamp: number | string) {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  return date.toLocaleDateString()
}

export function formatDateTime(timestamp: number | string) {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  return date.toLocaleString()
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getTimeAgo(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'just now'
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidPhoneNumber(phone: string) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`
  }
  return phone
}

export function getMessageType(message: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const emailRegex = /\S+@\S+\.\S+/g
  const phoneRegex = /[\+]?[1-9][\d]{0,15}/g
  
  if (urlRegex.test(message)) return 'link'
  if (emailRegex.test(message)) return 'email'
  if (phoneRegex.test(message)) return 'phone'
  return 'text'
}

export function extractUrls(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

export function highlightText(text: string, query: string) {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRandomColor() {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function downloadFile(data: any, filename: string, type: string) {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
    document.body.removeChild(textArea)
    return Promise.resolve()
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(err => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay))
    }
    throw err
  })
}

export function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function calculatePercentage(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}



export function isToday(timestamp: number | string) {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isYesterday(timestamp: number | string) {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

export function groupMessagesByDate(messages: any[]) {
  const groups: { [key: string]: any[] } = {}
  
  messages.forEach(message => {
    const date = new Date(parseInt(message.timestamp))
    let key: string
    
    if (isToday(message.timestamp)) {
      key = 'Today'
    } else if (isYesterday(message.timestamp)) {
      key = 'Yesterday'
    } else {
      key = date.toLocaleDateString()
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(message)
  })
  
  return groups
}

export const themes = {
  light: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    accent: 'bg-blue-500',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200'
  },
  dark: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    accent: 'bg-blue-600',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700'
  }
}
