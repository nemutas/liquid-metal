import { Canvas } from './webgl/Canvas'

const canvas = new Canvas(document.querySelector<HTMLCanvasElement>('.webgl-canvas')!)

window.addEventListener('beforeunload', () => {
  canvas.dispose()
})
