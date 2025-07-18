'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Send, 
  Trash2, 
  Volume2,
  Download,
  Waveform
} from 'lucide-react'
import Button from './ui/Button'
import { cn, formatTime } from '@/lib/utils'

interface VoiceMessagePlayerProps {
  audioUrl: string
  duration?: number
  isOwn?: boolean
  className?: string
}

export function VoiceMessagePlayer({ audioUrl, duration, isOwn, className }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setAudioDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * audioDuration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 rounded-lg max-w-xs',
      isOwn
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white',
      className
    )}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <Button
        onClick={togglePlay}
        variant="ghost"
        size="sm"
        className={cn(
          'p-2 rounded-full',
          isOwn
            ? 'hover:bg-blue-600 text-white'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
      />

      <div className="flex-1 space-y-1">
        <div
          className="h-1 bg-black/20 dark:bg-white/20 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOwn ? 'bg-white' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span>{formatTime(Math.floor(currentTime))}</span>
          <span>{formatTime(Math.floor(audioDuration))}</span>
        </div>
      </div>

      <Volume2 size={14} className="opacity-60" />
    </div>
  )
}

interface VoiceRecorderProps {
  onSend?: (audioBlob: Blob, duration: number) => void
  onCancel?: () => void
  className?: string
}

interface AudioVisualizerProps {
  isRecording: boolean
  audioData?: number[]
}

function AudioVisualizer({ isRecording, audioData }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      if (isRecording) {
        // Generate random waveform for demo
        const bars = 20
        const barWidth = width / bars
        
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * height * 0.8 + height * 0.1
          const x = i * barWidth
          const y = (height - barHeight) / 2
          
          ctx.fillStyle = `hsl(${200 + Math.random() * 60}, 70%, ${50 + Math.random() * 30}%)`
          ctx.fillRect(x + 2, y, barWidth - 4, barHeight)
        }
        
        animationRef.current = requestAnimationFrame(draw)
      } else if (audioData) {
        // Draw static waveform
        const bars = audioData.length
        const barWidth = width / bars
        
        audioData.forEach((value, i) => {
          const barHeight = value * height
          const x = i * barWidth
          const y = (height - barHeight) / 2
          
          ctx.fillStyle = '#3B82F6'
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
        })
      }
    }

    if (isRecording) {
      draw()
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, audioData])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded"
    />
  )
}

export default function VoiceRecorder({ onSend, onCancel, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSend = () => {
    if (audioBlob && onSend) {
      onSend(audioBlob, recordingTime)
      resetRecorder()
    }
  }

  const handleCancel = () => {
    resetRecorder()
    if (onCancel) {
      onCancel()
    }
  }

  const resetRecorder = () => {
    setIsRecording(false)
    setIsPaused(false)
    setIsPlaying(false)
    setRecordingTime(0)
    setAudioBlob(null)
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null
    }
  }

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `voice-message-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg',
        className
      )}
    >
      {/* Audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Recording Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-3 h-3 rounded-full',
            isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          )} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRecording && !isPaused ? 'Recording...' : 
             isPaused ? 'Paused' : 
             audioBlob ? 'Ready to send' : 'Ready to record'}
          </span>
        </div>
        
        <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* Waveform Visualizer */}
      <div className="mb-4">
        <AudioVisualizer isRecording={isRecording && !isPaused} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-3">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full"
            icon={<Mic size={20} />}
          >
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            {!isPaused ? (
              <Button
                onClick={pauseRecording}
                variant="outline"
                className="px-4 py-2"
                icon={<Pause size={16} />}
              >
                Pause
              </Button>
            ) : (
              <Button
                onClick={resumeRecording}
                variant="outline"
                className="px-4 py-2"
                icon={<Play size={16} />}
              >
                Resume
              </Button>
            )}
            
            <Button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
              icon={<Square size={16} />}
            >
              Stop
            </Button>
          </>
        )}

        {audioBlob && (
          <>
            <Button
              onClick={isPlaying ? pauseAudio : playAudio}
              variant="outline"
              className="px-4 py-2"
              icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={downloadAudio}
              variant="outline"
              className="px-4 py-2"
              icon={<Download size={16} />}
            >
              Download
            </Button>
            
            <Button
              onClick={handleSend}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              icon={<Send size={16} />}
            >
              Send
            </Button>
            
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-4 py-2 text-red-600 hover:text-red-700"
              icon={<Trash2 size={16} />}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Recording Tips */}
      {!isRecording && !audioBlob && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Volume2 size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Recording Tips:</p>
              <ul className="text-xs space-y-1">
                <li>• Speak clearly and close to your microphone</li>
                <li>• Keep background noise to a minimum</li>
                <li>• You can pause and resume recording</li>
                <li>• Maximum recording time: 5 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
