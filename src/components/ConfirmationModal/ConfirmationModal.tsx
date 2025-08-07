import React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import type { AppConfig } from '../../types'
import './ConfirmationModal.css'

export interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
  app?: AppConfig // Optional app info for deletion context
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  app
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'danger':
      case 'warning':
        return <AlertTriangle size={24} />
      default:
        return null
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay, not the modal content
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const handleConfirmClick = () => {
    onConfirm()
  }

  const handleCancelClick = () => {
    onCancel()
  }

  return (
    <div className="confirmation-modal-overlay" onClick={handleOverlayClick}>
      <div className={`confirmation-modal confirmation-modal--${variant}`}>
        <div className="confirmation-modal__header">
          <div className="confirmation-modal__title">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <button
            className="confirmation-modal__close"
            onClick={handleCancelClick}
            aria-label="Close confirmation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="confirmation-modal__body">
          <p className="confirmation-modal__message">{message}</p>
          
          {app && variant === 'danger' && (
            <div className="confirmation-modal__app-info">
              <div className="confirmation-modal__app-item">
                <strong>App Name:</strong> {app.name}
              </div>
              <div className="confirmation-modal__app-item">
                <strong>Command:</strong> {app.command}
              </div>
              <div className="confirmation-modal__app-item">
                <strong>Directory:</strong> {app.workingDirectory}
              </div>
            </div>
          )}
        </div>

        <div className="confirmation-modal__footer">
          <button
            className="confirmation-modal__button confirmation-modal__button--cancel"
            onClick={handleCancelClick}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-modal__button confirmation-modal__button--confirm confirmation-modal__button--${variant}`}
            onClick={handleConfirmClick}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
