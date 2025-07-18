'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  Settings,
  Zap,
  Clock,
  MessageSquare,
  Users,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Save,
  X
} from 'lucide-react'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn } from '@/lib/utils'

interface Trigger {
  id: string
  type: 'message_received' | 'keyword' | 'time_based' | 'contact_added' | 'campaign_completed'
  name: string
  config: any
}

interface Condition {
  id: string
  type: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'time_range' | 'contact_tag'
  field: string
  operator: string
  value: string
}

interface Action {
  id: string
  type: 'send_message' | 'add_tag' | 'assign_agent' | 'create_task' | 'webhook' | 'delay'
  name: string
  config: any
}

interface WorkflowRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: Trigger
  conditions: Condition[]
  actions: Action[]
  stats: {
    triggered: number
    successful: number
    failed: number
  }
  createdAt: number
  updatedAt: number
}

interface AutomationWorkflowProps {
  className?: string
}

const triggerTypes = [
  { value: 'message_received', label: 'Message Received', icon: MessageSquare },
  { value: 'keyword', label: 'Keyword Detected', icon: Filter },
  { value: 'time_based', label: 'Time Based', icon: Clock },
  { value: 'contact_added', label: 'Contact Added', icon: Users },
  { value: 'campaign_completed', label: 'Campaign Completed', icon: Zap }
]

const actionTypes = [
  { value: 'send_message', label: 'Send Message', icon: MessageSquare },
  { value: 'add_tag', label: 'Add Tag', icon: Plus },
  { value: 'assign_agent', label: 'Assign Agent', icon: Users },
  { value: 'create_task', label: 'Create Task', icon: Plus },
  { value: 'webhook', label: 'Webhook', icon: Zap },
  { value: 'delay', label: 'Delay', icon: Clock }
]

export default function AutomationWorkflow({ className }: AutomationWorkflowProps) {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([
    {
      id: '1',
      name: 'Welcome Message',
      description: 'Send welcome message to new contacts',
      isActive: true,
      trigger: {
        id: 't1',
        type: 'contact_added',
        name: 'New Contact Added',
        config: {}
      },
      conditions: [],
      actions: [
        {
          id: 'a1',
          type: 'send_message',
          name: 'Send Welcome',
          config: {
            message: 'Welcome! Thanks for contacting us. How can we help you today?'
          }
        }
      ],
      stats: { triggered: 45, successful: 43, failed: 2 },
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000
    },
    {
      id: '2',
      name: 'Keyword Auto-Reply',
      description: 'Auto-reply for pricing inquiries',
      isActive: true,
      trigger: {
        id: 't2',
        type: 'keyword',
        name: 'Pricing Keywords',
        config: {
          keywords: ['price', 'cost', 'pricing', 'how much']
        }
      },
      conditions: [],
      actions: [
        {
          id: 'a2',
          type: 'send_message',
          name: 'Send Pricing Info',
          config: {
            message: 'Thanks for your interest! Our pricing starts at $99/month. Would you like to schedule a demo?'
          }
        },
        {
          id: 'a3',
          type: 'add_tag',
          name: 'Tag as Lead',
          config: {
            tag: 'pricing-inquiry'
          }
        }
      ],
      stats: { triggered: 23, successful: 23, failed: 0 },
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 7200000
    }
  ])

  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null)

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ))
  }

  const duplicateWorkflow = (workflow: WorkflowRule) => {
    const newWorkflow: WorkflowRule = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      stats: { triggered: 0, successful: 0, failed: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setWorkflows(prev => [...prev, newWorkflow])
  }

  const deleteWorkflow = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(prev => prev.filter(w => w.id !== id))
    }
  }

  const WorkflowCard = ({ workflow }: { workflow: WorkflowRule }) => {
    const isExpanded = expandedWorkflow === workflow.id
    const successRate = workflow.stats.triggered > 0 
      ? (workflow.stats.successful / workflow.stats.triggered * 100).toFixed(1)
      : '0'

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              <div className={cn(
                'w-3 h-3 rounded-full',
                workflow.isActive ? 'bg-green-500' : 'bg-gray-300'
              )} />
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {workflow.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {workflow.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right text-sm">
                <div className="text-gray-900 dark:text-white font-medium">
                  {workflow.stats.triggered} triggers
                </div>
                <div className="text-green-600 dark:text-green-400">
                  {successRate}% success
                </div>
              </div>
              
              <Button
                onClick={() => toggleWorkflow(workflow.id)}
                variant={workflow.isActive ? 'default' : 'outline'}
                size="sm"
                icon={workflow.isActive ? <Pause size={14} /> : <Play size={14} />}
              >
                {workflow.isActive ? 'Pause' : 'Start'}
              </Button>
              
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2">
                  <Settings size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              <div className="p-4 space-y-4">
                {/* Trigger */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Trigger
                  </h4>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      {workflow.trigger.name}
                    </span>
                  </div>
                </div>
                
                {/* Conditions */}
                {workflow.conditions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Conditions
                    </h4>
                    <div className="space-y-2">
                      {workflow.conditions.map((condition, index) => (
                        <div key={condition.id} className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <Filter size={16} className="text-yellow-600 dark:text-yellow-400" />
                          <span className="text-sm text-yellow-800 dark:text-yellow-200">
                            {condition.field} {condition.operator} "{condition.value}"
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Actions
                  </h4>
                  <div className="space-y-2">
                    {workflow.actions.map((action, index) => (
                      <div key={action.id} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex-1">
                          <MessageSquare size={16} className="text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-800 dark:text-green-200">
                            {action.name}
                          </span>
                        </div>
                        {index < workflow.actions.length - 1 && (
                          <ArrowRight size={16} className="text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setSelectedWorkflow(workflow)}
                      variant="outline"
                      size="sm"
                      icon={<Edit size={14} />}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => duplicateWorkflow(workflow)}
                      variant="outline"
                      size="sm"
                      icon={<Copy size={14} />}
                    >
                      Duplicate
                    </Button>
                    
                    <Button
                      onClick={() => deleteWorkflow(workflow.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Automation Workflows
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create intelligent workflows to automate your WhatsApp operations
          </p>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          icon={<Plus size={16} />}
        >
          Create Workflow
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {workflows.length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.filter(w => w.isActive).length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Triggers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {workflows.reduce((sum, w) => sum + w.stats.triggered, 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.length > 0 
                    ? (workflows.reduce((sum, w) => sum + (w.stats.triggered > 0 ? w.stats.successful / w.stats.triggered : 0), 0) / workflows.length * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map(workflow => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
        
        {workflows.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Workflows Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first automation workflow to start automating your WhatsApp operations
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                icon={<Plus size={16} />}
              >
                Create First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
