import React, { useState, useEffect, useCallback } from 'react'
import { X, Folder, Image, Plus, AlertCircle } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { useConfigManager } from '../../hooks/useConfig'
import { generateAppId } from '../../utils/app-data'
import {
  appConfigToFormData,
  formDataToAppConfig,
  createEmptyFormData,
  validateFormData,
} from './utils'
import type { AppConfigModalProps, AppConfigFormData, AppConfigFormErrors } from './types'
import './AppConfigModal.css'

export function AppConfigModal({
  isOpen,
  mode,
  appToEdit,
  onClose,
  onSubmit,
}: AppConfigModalProps) {
  const configManager = useConfigManager()
  const [formData, setFormData] = useState<AppConfigFormData>(createEmptyFormData())
  const [errors, setErrors] = useState<AppConfigFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  // Initialize form data when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && appToEdit) {
        setFormData(appConfigToFormData(appToEdit))
      } else {
        setFormData(createEmptyFormData())
      }
      setErrors({})
      setIsSubmitting(false)
      setIsClosing(false)
      setNewTagInput('')
    }
  }, [isOpen, mode, appToEdit])

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof AppConfigFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Handle directory picker
  const handlePickDirectory = useCallback(async () => {
    try {
      const result = await invoke<string | null>('pick_directory')
      if (result) {
        handleInputChange('workingDirectory', result)
      }
    } catch (error) {
      console.error('Failed to pick directory:', error)
    }
  }, [handleInputChange])

  // Handle image picker
  const handlePickImage = useCallback(async () => {
    try {
      const result = await invoke<string | null>('pick_image_file')
      if (result) {
        handleInputChange('thumbnailPath', result)
      }
    } catch (error) {
      console.error('Failed to pick image:', error)
    }
  }, [handleInputChange])

  // Handle adding a new tag
  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = newTagInput.trim()
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
        setNewTagInput('')
      }
    }
  }, [newTagInput, formData.tags])

  // Handle removing a tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Handle modal close with animation
  const handleClose = useCallback(() => {
    if (isSubmitting) return
    
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }, [isSubmitting, onClose])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateFormData(
      formData,
      configManager.isAppNameTaken,
      mode === 'edit' ? appToEdit?.id : undefined
    )
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert form data to app config
      let appConfig = formDataToAppConfig(formData, appToEdit)
      
      // Generate ID for new apps
      if (mode === 'add') {
        appConfig = { ...appConfig, id: generateAppId() }
      }
      
      // Submit to parent component
      const success = await onSubmit(appConfig)
      
      if (success) {
        handleClose()
      } else {
        // Show error from config manager
        setErrors({ name: configManager.error?.message || 'Failed to save app configuration' })
      }
    } catch (error) {
      console.error('Failed to submit app config:', error)
      setErrors({ name: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, appToEdit, onSubmit, configManager.isAppNameTaken, configManager.error, handleClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isSubmitting, handleClose])

  if (!isOpen) return null

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <header className="modal-header">
          <h2 className="modal-title">
            {mode === 'add' ? (
              <>
                <Plus size={20} />
                Add New App
              </>
            ) : (
              <>
                <Image size={20} />
                Edit {appToEdit?.name}
              </>
            )}
          </h2>
          <button 
            type="button" 
            className="close-button" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* App Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  App Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Development Server"
                  maxLength={50}
                />
                {errors.name && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Command */}
              <div className="form-group">
                <label htmlFor="command" className="form-label">
                  Command <span className="required">*</span>
                </label>
                <input
                  id="command"
                  type="text"
                  className={`form-input ${errors.command ? 'error' : ''}`}
                  value={formData.command}
                  onChange={(e) => handleInputChange('command', e.target.value)}
                  placeholder="npm start"
                  maxLength={500}
                />
                {errors.command && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.command}
                  </div>
                )}
                <div className="form-help">
                  The shell command to execute when starting this app
                </div>
              </div>

              {/* Working Directory */}
              <div className="form-group">
                <label htmlFor="workingDirectory" className="form-label">
                  Working Directory
                </label>
                <div className="file-picker-group">
                  <input
                    id="workingDirectory"
                    type="text"
                    className={`form-input file-picker-input ${errors.workingDirectory ? 'error' : ''}`}
                    value={formData.workingDirectory}
                    onChange={(e) => handleInputChange('workingDirectory', e.target.value)}
                    placeholder="/path/to/project"
                  />
                  <button
                    type="button"
                    className="file-picker-button"
                    onClick={handlePickDirectory}
                    disabled={isSubmitting}
                  >
                    <Folder size={16} />
                    Browse
                  </button>
                </div>
                {errors.workingDirectory && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.workingDirectory}
                  </div>
                )}
              </div>

              {/* URL */}
              <div className="form-group">
                <label htmlFor="url" className="form-label">
                  URL
                </label>
                <input
                  id="url"
                  type="url"
                  className={`form-input ${errors.url ? 'error' : ''}`}
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="http://localhost:3000"
                />
                {errors.url && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.url}
                  </div>
                )}
                <div className="form-help">
                  URL to open in browser when app starts
                </div>
              </div>

              {/* Thumbnail */}
              <div className="form-group">
                <label htmlFor="thumbnailPath" className="form-label">
                  Thumbnail Image
                </label>
                <div className="file-picker-group">
                  <input
                    id="thumbnailPath"
                    type="text"
                    className={`form-input file-picker-input ${errors.thumbnailPath ? 'error' : ''}`}
                    value={formData.thumbnailPath}
                    onChange={(e) => handleInputChange('thumbnailPath', e.target.value)}
                    placeholder="/path/to/thumbnail.png"
                  />
                  <button
                    type="button"
                    className="file-picker-button"
                    onClick={handlePickImage}
                    disabled={isSubmitting}
                  >
                    <Image size={16} />
                    Browse
                  </button>
                </div>
                {errors.thumbnailPath && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.thumbnailPath}
                  </div>
                )}
              </div>

              {/* Browser Settings */}
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    id="autoLaunchBrowser"
                    type="checkbox"
                    className="checkbox-input"
                    checked={formData.autoLaunchBrowser}
                    onChange={(e) => handleInputChange('autoLaunchBrowser', e.target.checked)}
                  />
                  <label htmlFor="autoLaunchBrowser" className="checkbox-label">
                    Auto-launch browser when app starts
                  </label>
                </div>
              </div>

              {/* Browser Delay and Port Settings */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="browserDelay" className="form-label">
                    Browser Delay (seconds)
                  </label>
                  <input
                    id="browserDelay"
                    type="number"
                    min="0"
                    max="60"
                    className={`form-input ${errors.browserDelay ? 'error' : ''}`}
                    value={formData.browserDelay}
                    onChange={(e) => handleInputChange('browserDelay', parseInt(e.target.value) || 0)}
                  />
                  {errors.browserDelay && (
                    <div className="form-error">
                      <AlertCircle size={12} />
                      {errors.browserDelay}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="portToCheck" className="form-label">
                    Port to Check
                  </label>
                  <input
                    id="portToCheck"
                    type="number"
                    min="1"
                    max="65535"
                    className={`form-input ${errors.portToCheck ? 'error' : ''}`}
                    value={formData.portToCheck}
                    onChange={(e) => handleInputChange('portToCheck', e.target.value)}
                    placeholder="3000"
                  />
                  {errors.portToCheck && (
                    <div className="form-error">
                      <AlertCircle size={12} />
                      {errors.portToCheck}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label htmlFor="tags" className="form-label">
                  Tags
                </label>
                <div className={`tags-input-container ${errors.tags ? 'error' : ''}`}>
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="tag-item">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    className="tags-input"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={formData.tags.length === 0 ? "Add tags (press Enter or comma)" : "Add tag..."}
                    disabled={formData.tags.length >= 10}
                  />
                </div>
                {errors.tags && (
                  <div className="form-error">
                    <AlertCircle size={12} />
                    {errors.tags}
                  </div>
                )}
                <div className="form-help">
                  Add up to 10 tags for organizing your apps (press Enter or comma to add)
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner" />
                  {mode === 'add' ? 'Adding App...' : 'Saving Changes...'}
                </>
              ) : (
                <>
                  {mode === 'add' ? 'Add App' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
