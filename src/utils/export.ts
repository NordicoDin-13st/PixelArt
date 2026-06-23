/**
 * Export utilities
 * Handles downloading images as PNG / GIF / ZIP files
 */

import { imageDataToCanvas } from './canvas'

/**
 * Download ImageData as PNG
 */
export async function downloadImage(imageData: ImageData, filename: string): Promise<void> {
  const canvas = imageDataToCanvas(imageData)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create blob'))
      }
    }, 'image/png')
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate timestamp filename
 */
export function generateFilename(baseName: string, extension = 'png'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${baseName}_pixelart_${timestamp}.${extension}`
}

/**
 * Download multiple images as individual files
 */
export async function downloadImages(images: { name: string; data: ImageData }[]): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const { name, data } = images[i]
    const filename = generateFilename(name.replace(/\.[^/.]+$/, ''))
    await downloadImage(data, filename)

    // Small delay between downloads to prevent browser issues
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * Batch export images as ZIP using JSZip
 */
export async function downloadImagesAsZip(images: { name: string; data: ImageData }[], zipName = 'pixel-art-export.zip'): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  for (const { name, data } of images) {
    const canvas = imageDataToCanvas(data)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, 'image/png')
    })

    const filename = generateFilename(name.replace(/\.[^/.]+$/, ''))
    zip.file(filename, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = zipName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadImageAsWebP(imageData: ImageData, filename: string, quality = 0.8): Promise<void> {
  const canvas = imageDataToCanvas(imageData)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create WebP blob'))
    }, 'image/webp', quality)
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadImageAsSvg(imageData: ImageData, filename: string): Promise<void> {
  const { width, height, data } = imageData
  const pixelSize = 1
  const rects: string[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a === 0) continue
      const fill = a < 255
        ? `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`
        : `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      rects.push(`<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${fill}"/>`)
    }
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width * pixelSize}" height="${height * pixelSize}" shape-rendering="crispEdges">
${rects.join('\n')}
</svg>`

  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadImagesAsGif(
  images: { name: string; data: ImageData }[],
  options: {
    delay?: number
    repeat?: number
    quality?: number
  } = {}
): Promise<void> {
  const GIF = (await import('gif.js')).default

  const { delay = 200, repeat = 0, quality = 10 } = options

  if (images.length === 0) {
    throw new Error('No images to export')
  }

  const firstImage = images[0].data
  const width = firstImage.width
  const height = firstImage.height

  const gif = new GIF({
    workers: 2,
    quality,
    width,
    height,
    repeat,
    workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).href
  })

  for (const { data } of images) {
    const canvas = imageDataToCanvas(data)
    gif.addFrame(canvas, { delay, copy: true })
  }

  return new Promise((resolve, reject) => {
    const gifWithError = gif as typeof gif & {
      on(event: 'error', listener: (err: Error) => void): typeof gif
    }

    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = generateFilename('animation', 'gif')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    })

    gifWithError.on('error', (err: Error) => {
      reject(err)
    })

    gif.render()
  })
}
