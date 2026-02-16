import { useEffect, useState } from 'react';
import { Minimize2, Maximize2, X, Maximize } from 'lucide-react';

const { ipcRenderer } = window.require('electron');

export const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for maximize/unmaximize events
    const handleResize = () => {
      ipcRenderer.invoke('window-is-fullscreen').then(setIsMaximized);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMinimize = () => {
    ipcRenderer.send('window-minimize');
  };

  const handleMaximize = () => {
    ipcRenderer.send('window-maximize');
  };

  const handleClose = () => {
    ipcRenderer.send('window-close');
  };

  const handleToggleFullscreen = () => {
    ipcRenderer.send('window-toggle-fullscreen');
  };

  return (
    <div className="flex items-center gap-2 window-controls">
      {/* Fullscreen Toggle */}
      <button
        onClick={handleToggleFullscreen}
        className="window-control-btn hover:bg-accent p-2 rounded transition-colors"
        title="Toggle Fullscreen"
      >
        <Maximize className="w-4 h-4" />
      </button>

      {/* Minimize */}
      <button
        onClick={handleMinimize}
        className="window-control-btn hover:bg-accent p-2 rounded transition-colors"
        title="Minimize"
      >
        <Minimize2 className="w-4 h-4" />
      </button>

      {/* Maximize/Restore */}
      <button
        onClick={handleMaximize}
        className="window-control-btn hover:bg-accent p-2 rounded transition-colors"
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Close */}
      <button
        onClick={handleClose}
        className="window-control-btn hover:bg-destructive p-2 rounded transition-colors"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
