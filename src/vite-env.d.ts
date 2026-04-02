/// <reference types="vite/client" />

interface Window {
  /** Electron 预加载脚本注入（浏览器环境为 undefined） */
  cyberEdictDesktop?: { platform: string };
}
