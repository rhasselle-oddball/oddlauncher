import React from 'react';
import './CustomTitleBar.css';
import { Minimize, Maximize2, X } from 'lucide-react';

interface CustomTitleBarProps {
  title?: string;
}

export const CustomTitleBar: React.FC<CustomTitleBarProps> = ({ title }) => {
  // Tauri window controls
  const handleMinimize = () => {
    // @ts-ignore
    window.__TAURI__?.window.appWindow.minimize();
  };
  const handleMaximize = () => {
    // @ts-ignore
    window.__TAURI__?.window.appWindow.toggleMaximize();
  };
  const handleClose = () => {
    // @ts-ignore
    window.__TAURI__?.window.appWindow.close();
  };

  return (
    <div className="custom-title-bar" data-tauri-drag-region>
      <div className="custom-title" data-tauri-drag-region>{title || 'OddLauncher'}</div>
      <div className="custom-title-bar-controls">
        <button className="title-bar-btn" onClick={handleMinimize} title="Minimize">
          <Minimize size={16} />
        </button>
        <button className="title-bar-btn" onClick={handleMaximize} title="Maximize/Restore">
          <Maximize2 size={16} />
        </button>
        <button className="title-bar-btn close" onClick={handleClose} title="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
