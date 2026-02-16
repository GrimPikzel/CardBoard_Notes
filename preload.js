ipcRenderer.on('toggle-glass', (event, isGlass) => {
  window.electronAPI.toggleGlass = isGlass;
});
