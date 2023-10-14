import * as THREE from 'three'
import { three } from './core/Three'
import fragmentShader from './shader/fragmentShader.glsl'
import vertexShader from './shader/vertexShader.glsl'
import { raiper } from './Physics'
import { mouse3d } from './Mouse3D'
import { gui } from './Gui'

export class Canvas {
  private cursor!: THREE.Mesh
  private screen!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private debugObjects: THREE.Object3D[] = []
  private debug = false

  constructor(canvas: HTMLCanvasElement) {
    this.loadCubeTexture().then((texture) => {
      this.init(canvas)
      this.createSpheres()
      this.createCenterSphere()
      this.cursor = this.createCursor()
      this.screen = this.createScreen(texture)
      this.setGui()
      three.animation(this.anime)
    })
  }

  private async loadCubeTexture() {
    const loader = new THREE.CubeTextureLoader()
    loader.setPath(import.meta.env.BASE_URL + 'textures/')
    const texture = await loader.loadAsync(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp'])
    texture.colorSpace = THREE.LinearSRGBColorSpace
    return texture
  }

  private init(canvas: HTMLCanvasElement) {
    three.setup(canvas)
    three.scene.background = new THREE.Color('#000')
    three.camera.position.z = 3

    mouse3d.setup(three.camera)
  }

  private createSpheres() {
    const geometry = new THREE.SphereGeometry(0.1)
    const material = new THREE.MeshNormalMaterial({ wireframe: false })
    const mesh = new THREE.Mesh(geometry, material)

    const rand = (scale = 1) => (Math.random() * 2 - 1) * scale

    for (let i = 0; i < 20; i++) {
      const m = mesh.clone()
      m.position.set(rand(3), rand(3), rand(2))
      m.rotation.set(rand(Math.PI), rand(Math.PI), rand(Math.PI))
      three.scene.add(m)
      raiper.sphere(m, 'dynamic')
      this.debugObjects.push(m)
    }
  }

  private createCenterSphere() {
    const geometry = new THREE.SphereGeometry(0.7)
    const material = new THREE.MeshNormalMaterial({ wireframe: true })
    const mesh = new THREE.Mesh(geometry, material)
    three.scene.add(mesh)
    raiper.sphere(mesh, 'fixed')
    this.debugObjects.push(mesh)
  }

  private createCursor() {
    const geometry = new THREE.SphereGeometry(0.6)
    const material = new THREE.MeshNormalMaterial({ wireframe: true })
    const mesh = new THREE.Mesh(geometry, material)
    three.scene.add(mesh)
    raiper.sphere(mesh, 'kinematic')
    this.debugObjects.push(mesh)

    return mesh
  }

  private createScreen(texture: THREE.CubeTexture) {
    const model = raiper.dynamicMeshes.map((m) => {
      return {
        shape: 0,
        matrix: m.matrixWorld.clone().invert(),
      }
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      defines: {
        ModelCount: raiper.dynamicMeshes.length,
      },
      uniforms: {
        uCameraPosition: { value: three.camera.position },
        uProjectionMatrixInverse: { value: three.camera.projectionMatrixInverse },
        uViewMatrixInverse: { value: three.camera.matrixWorld },
        uNormalMatrix: { value: three.camera.matrixWorld.clone().transpose() },
        uModel: { value: model },
        tEnv: { value: texture },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    })
    const mesh = new THREE.Mesh(geometry, material)
    three.scene.add(mesh)
    return mesh
  }

  private setGui() {
    for (let m of this.debugObjects) {
      m.visible = this.debug
    }
    this.screen.visible = !this.debug

    gui.add(this, 'debug').onChange((val: boolean) => {
      for (let m of this.debugObjects) {
        m.visible = val
      }
      this.screen.visible = !val
    })
  }

  private anime = () => {
    raiper.update()

    this.cursor.position.copy(mouse3d.position)
    raiper.syncToBody(this.cursor)

    if (this.debug) {
      this.debugObjects.forEach((o) => o.updateMatrixWorld())
    }

    const unifroms = this.screen.material.uniforms
    unifroms.uProjectionMatrixInverse.value = three.camera.projectionMatrixInverse
    unifroms.uCameraPosition.value = three.camera.position
    unifroms.uViewMatrixInverse.value = three.camera.matrixWorld
    unifroms.uNormalMatrix.value = three.camera.matrixWorld.clone().transpose()
    unifroms.uModel.value.forEach((v: any, i: number) => {
      v.matrix = raiper.dynamicMeshes[i].matrixWorld.clone().invert()
    })

    three.render()
  }

  dispose() {
    three.dispose()
  }
}
