import { Filter } from '../types'

/**
 * Box-based average downsampling filter
 * Reduces image size to target pixel dimensions while averaging colors in each block
 */
export const downsampleFilter: Filter = {
  id: 'downsample',
  name: '降采样',
  description: '将图像降采样到指定的像素尺寸，使用盒式平均方法',
  params: {
    pixelSize: {
      type: 'number',
      default: 8,
      min: 1,
      max: 64,
      step: 1,
      label: '像素大小',
      description: '每个像素代表的原始像素数量'
    }
  },
  apply(input: ImageData, params: Record<string, any>): ImageData {
    const { pixelSize } = params
    const srcData = input.data
    const srcWidth = input.width
    const srcHeight = input.height

    // Calculate target dimensions
    const targetWidth = Math.max(1, Math.floor(srcWidth / pixelSize))
    const targetHeight = Math.max(1, Math.floor(srcHeight / pixelSize))

    // Create output ImageData
    const output = new ImageData(targetWidth, targetHeight)
    const dstData = output.data

    // Downsample using box averaging
    for (let dy = 0; dy < targetHeight; dy++) {
      for (let dx = 0; dx < targetWidth; dx++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0

        // Calculate source pixel range for this target pixel
        const startX = Math.floor(dx * pixelSize)
        const startY = Math.floor(dy * pixelSize)
        const endX = Math.min(startX + pixelSize, srcWidth)
        const endY = Math.min(startY + pixelSize, srcHeight)

        // Average all pixels in the block
        for (let sy = startY; sy < endY; sy++) {
          for (let sx = startX; sx < endX; sx++) {
            const srcIdx = (sy * srcWidth + sx) * 4
            r += srcData[srcIdx]
            g += srcData[srcIdx + 1]
            b += srcData[srcIdx + 2]
            a += srcData[srcIdx + 3]
            count++
          }
        }

        // Set averaged pixel value
        const dstIdx = (dy * targetWidth + dx) * 4
        dstData[dstIdx] = Math.round(r / count)
        dstData[dstIdx + 1] = Math.round(g / count)
        dstData[dstIdx + 2] = Math.round(b / count)
        dstData[dstIdx + 3] = Math.round(a / count)
      }
    }

    return output
  }
}
