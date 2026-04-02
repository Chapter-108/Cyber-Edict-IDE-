const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cyberEdictDesktop', {
  platform: process.platform,
});
