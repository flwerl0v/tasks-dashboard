import html2canvas from 'html2canvas'
import type { RefObject } from 'react'

export interface CapturedChart {
  title: string
  dataUrl: string
  width: number
  height: number
}

interface ChartCaptureTarget {
  title: string
  ref: RefObject<HTMLElement | null>
}

/** Rasterizes a chart's DOM node to a PNG data URL for embedding in the Excel export. */
async function captureElement(el: HTMLElement, title: string): Promise<CapturedChart> {
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
  return { title, dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height }
}

export async function captureCharts(targets: ChartCaptureTarget[]): Promise<CapturedChart[]> {
  const results: CapturedChart[] = []
  for (const { title, ref } of targets) {
    if (!ref.current) {
      console.warn(`[chartCapture] skipped "${title}" — ref not attached to a rendered element`)
      continue
    }
    try {
      results.push(await captureElement(ref.current, title))
    } catch (err) {
      console.warn(`[chartCapture] failed to capture "${title}"`, err)
    }
  }
  return results
}
