class Mouse2D {
  private abortController: AbortController
  public position = { x: 0, y: 0 }
  private current = { ...this.position }

  constructor() {
    this.abortController = new AbortController()
    this.addEvents(this.abortController.signal)
  }

  private addEvents(signal: AbortSignal) {
    const addEnvet = <K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any) => {
      window.addEventListener(type, listener, { signal })
    }

    addEnvet('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (1 - e.clientY / window.innerHeight) * 2 - 1
      this.position = { x, y }
    })

    addEnvet('mousedown', () => {})
    addEnvet('mouseleave', () => {})
    addEnvet('mouseup', () => {})
  }

  get posArray(): [number, number] {
    return [this.position.x, this.position.y]
  }

  private lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t
  }

  velocity(t = 0.1): [number, number] {
    this.current.x = this.lerp(this.position.x, this.current.x, t)
    this.current.y = this.lerp(this.position.y, this.current.y, t)
    return [this.position.x - this.current.x, this.position.y - this.current.y]
  }

  dispose() {
    this.abortController.abort()
  }
}

export const mouse2d = new Mouse2D()
