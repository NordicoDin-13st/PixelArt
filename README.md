<div align="center">

# Pixel Art Tool

> 把图片拖进浏览器，得到可预览、可对比、可批量导出的像素画。

[![Vue](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**一个本地优先的像素画生成工作台。**

上传 PNG、JPG 或 WebP 后，应用会在浏览器里完成降采样、调色板量化、固定调色板映射、抖动、随机变体生成、原图/处理后对比、预设保存，以及 PNG/GIF/WebP/SVG/ZIP 导出。图像处理走 Canvas、ImageData 和 Web Worker，不依赖后端服务，也不会把原图上传到远端 API。

[快速开始](#快速开始) · [能做什么](#能做什么) · [核心机制](#核心机制) · [仓库结构](#仓库结构) · [开源边界](#开源边界)

</div>

---

## 快速开始

```bash
npm install
npm run dev
```

Vite 会在终端输出本地访问地址。当前开发配置通常使用：

```text
http://localhost:9997
```

生产构建：

```bash
npm run build
```

带类型检查的构建：

```bash
npm run build:check
```

预览构建结果：

```bash
npm run preview
```

---

## 能做什么

| 能力 | 交付物 | 适合场景 |
|------|--------|----------|
| 图片像素化 | PNG / WebP / SVG | 头像、贴纸、游戏素材草图 |
| 自动量化 | 2 到 256 色调色板 | 从真实图片里抽取有限色阶 |
| 固定调色板 | GameBoy、NES、PICO-8、CGA 等预设 | 复古游戏风格 |
| 抖动算法 | Floyd-Steinberg、Atkinson、Bayer、无抖动 | 控制色带、纹理和复古颗粒感 |
| 原图对比 | 并排对比 / 滑块对比 | 判断参数调整是否过度 |
| 批量处理 | 多图统一参数处理 | 同一批素材保持统一风格 |
| ZIP 批量导出 | 多张 PNG 打包下载 | 快速整理生成结果 |
| GIF 导出 | 多图合成动画 | 快速生成帧动画预览 |
| 随机变体 | 随机调色板、噪声、对称、对比度滤镜组合 | 快速探索多个视觉方向 |
| 参数预设 | 本地保存 / 读取 / 删除 | 复用常用风格配置 |
| 中英双语 | 中文 / English | 本地工具和公开演示 |
| Web Worker | 后台处理管线 | 降低大图处理时的 UI 阻塞 |

---

## 使用流程

1. 上传图片，支持点击选择或拖拽导入。
2. 调整像素大小、调色板模式、颜色数量、抖动算法和效果滤镜。
3. 使用预览、并排对比或滑块对比检查结果。
4. 单张导出 PNG、WebP、SVG，或多图打包 ZIP。
5. 需要动画时，将多张结果合成为 GIF。
6. 需要探索风格时，生成随机变体并把好用参数保存为预设。

---

## 核心机制

### Filter Pipeline

所有图像处理都收敛到统一的 `Filter` 接口。UI 负责参数输入和结果展示，真正的图像逻辑在 `src/core/filters/` 中保持可复用。

```ts
interface Filter {
  id: string
  name: string
  description?: string
  params: Record<string, ParamDef>
  apply(input: ImageData, params: Record<string, any>): ImageData
}
```

默认处理路径：

```text
原图 ImageData
  -> downsample
  -> quantize 或 palette
  -> dither
  -> effect filters
  -> processed ImageData
```

新增滤镜时，不需要重写上传、预览、导出或批量处理逻辑，只需要实现接口并注册到 filter registry。

### 本地优先

应用运行在浏览器内：

- 原图通过 `FileReader` 进入内存。
- 像素处理使用 Canvas 2D、`ImageData` 和 Web Worker。
- 单图导出使用 `Blob` 下载。
- 批量导出使用 JSZip 在浏览器内生成 ZIP。
- GIF 使用 `gif.js` 在本地合成。
- 预设保存在 `localStorage`。

这意味着项目当前不需要账号系统、数据库、对象存储或图片处理 API。对一个轻量像素画工具来说，这是最短路径。

### 变体生成

随机变体复用同一条 pipeline，把随机参数包装为 effect filters：

- `paletteRandom`：生成新的调色板方向。
- `noise`：增加颗粒和纹理。
- `symmetry`：生成镜像或对称效果。
- `contrast`：控制视觉冲击力。

---

## 仓库结构

```text
pixel-art-tool/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── App.vue                 # 主工作台
│   ├── components/             # 上传、图库、参数、预览、对比、导出、预设、变体生成
│   ├── composables/            # 全局参数、图片状态、处理管线、深浅色、i18n
│   ├── core/
│   │   ├── types.ts            # Filter / Pipeline / ImageMeta 类型
│   │   ├── pipeline.ts         # 图像处理管线编排
│   │   └── filters/            # 降采样、量化、抖动、调色板、噪声、对称、对比度等滤镜
│   ├── i18n/                   # 中文与英文文案
│   ├── styles/                 # 设计 token 与全局样式
│   ├── utils/                  # Canvas 与导出工具
│   └── workers/                # Web Worker 图像处理入口
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── uno.config.ts
```

---

## 开发说明

### 添加新滤镜

1. 在 `src/core/filters/` 下创建新文件。
2. 实现 `Filter` 接口。
3. 在 `src/core/filters/index.ts` 中注册。
4. 如果需要用户控制参数，在 `ParamPanel.vue` 或 `VariantGenerator.vue` 中补充 UI。

### 推荐验证

```bash
npm run build:check
npm audit --audit-level=high
```

---

## 开源边界

当前仓库按“前端本地工具”来设计，默认不包含：

- 账号、登录、权限、支付等用户系统。
- 服务端图片上传、存储或分析。
- 第三方图片处理 API key。
- 真实用户数据、示例私图或私有配置。

`.gitignore` 已排除常见本地目录、构建产物、环境变量、证书、密钥和日志文件。开源前仍建议确认远端只保留干净 orphan 分支，因为 Git 历史中的作者邮箱、旧注释或历史密钥不会被普通新提交抹掉。

---

## Limitations

- Web Worker 不可用时会回退到主线程，大图处理仍可能短暂停顿。
- GIF 导出适合快速预览，不是专业动画编码器。
- SVG 导出会为每个像素生成一个矩形，超大图可能体积较大。
- 随机变体偏探索，不保证每个结果都可直接交付。

---

## License

MIT
