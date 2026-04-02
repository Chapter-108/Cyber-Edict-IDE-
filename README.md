# Cyber-Edict IDE

工作流可视化小工具，界面按「三省六部」搭了一套节点：中书省、门下省、尚书省和六部。设计模式可改画布，运行模式下旨、过门下省审议。模型侧走的是 OpenAI 兼容的 `chat/completions`，配置和 Key 写在本地，走浏览器 `fetch`（桌面壳里也一样）。

版本 0.2.0，MIT，见 `LICENSE`。Windows x64 可打 Electron 包。

## 关于

| 项目 | 说明 |
|------|------|
| 仓库 | [github.com/Chapter-108/Cyber-Edict-IDE-](https://github.com/Chapter-108/Cyber-Edict-IDE-) |
| 定位 | 三省六部主题工作流画布 + OpenAI 兼容 API 配置与调用；可选 Electron 桌面壳 |
| 协议 | MIT |

在 GitHub 仓库页右侧 **About** 里，可把 **Description** 填成一句（例如下面英文，方便搜索），**Website** 留空或填仓库地址；**Topics** 可加：`electron`、`react`、`typescript`、`vite`、`workflow`、`openai`。

> **Suggested description (English, for GitHub About):**  
> *Visual workflow IDE with a “Three Departments & Six Ministries” themed canvas, OpenAI-compatible LLM settings, and optional Windows Electron build.*

## 技术

React 18、TypeScript、Vite 6、Tailwind、Zustand（LLM 设置会 `persist` 到 `localStorage`）、`@xyflow/react`。桌面端 Electron 34 + electron-builder。单测 Vitest。

Node 建议 20+。

## 开发

```bash
npm install
npm run dev
```

默认 `http://localhost:5173`。生产：

```bash
npm run build
npm run preview
```

## 桌面

联调（Vite + Electron）：

```bash
npm run electron:dev
```

只启动 Electron，加载已有 `dist`：

```bash
npm run build
npm run electron:start
```

仓库里还有 `启动桌面端.bat`、`桌面端开发.bat`（内容为英文，避免 cmd 在 GBK 下把 UTF-8 批处理读乱）。GPU 闪退时主进程里默认关了硬件加速；要试开 GPU 可设环境变量 `CYBER_EDICT_USE_GPU=1`。第二次双击没窗口、进程秒退，多半是上次 Electron 没杀干净占单实例锁，任务管理器里结束相关进程再开；排查时可设 `CYBER_EDICT_ALLOW_MULTI=1`。项目路径如果加载异常，换到纯英文短路径再 `build` 往往省事。

## API 与跨域

直连第三方接口经常被 CORS 挡。换带 CORS 的网关，或在 Vite 里配 `server.proxy` 把本地路径转到真实 API。

