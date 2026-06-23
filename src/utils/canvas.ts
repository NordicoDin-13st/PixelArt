export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = imageDataToCanvas(imageData)
  return canvas.toDataURL('image/png')
}

export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')!
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(imageData)
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function loadImageFromURL(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image from URL'))
    }

    img.src = url
  })
}

export async function imageDataToBlob(imageData: ImageData, type: string = 'image/png', quality?: number): Promise<Blob> {
  const canvas = imageDataToCanvas(imageData)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      type,
      quality
    )
  })
}

export function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number, smooth: boolean = false): ImageData {
  const srcCanvas = imageDataToCanvas(imageData)
  const dstCanvas = document.createElement('canvas')
  dstCanvas.width = targetWidth
  dstCanvas.height = targetHeight

  const ctx = dstCanvas.getContext('2d')!
  ctx.imageSmoothingEnabled = smooth
  ctx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight)

  return ctx.getImageData(0, 0, targetWidth, targetHeight)
}

export function scaleImageData(imageData: ImageData, scale: number, smooth: boolean = false): ImageData {
  return resizeImageData(imageData, Math.round(imageData.width * scale), Math.round(imageData.height * scale), smooth)
}
