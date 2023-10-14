import RAPIER from '@dimforge/rapier3d'
import { three } from './core/Three'
import * as THREE from 'three'

type RigidBodyType = 'dynamic' | 'kinematic' | 'fixed'

class Rapier {
  public dynamicMeshes: THREE.Mesh[] = []

  private world: RAPIER.World
  private rigidBodyMap = new WeakMap<THREE.Mesh, RAPIER.RigidBody>()

  private vec3 = new THREE.Vector3()
  private center = new THREE.Vector3(0, 0, 0)

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: 0, z: 0 })
  }

  private rigidBody(mesh: THREE.Mesh, shape: RAPIER.ColliderDesc, type: RigidBodyType) {
    const p = mesh.position
    const q = mesh.quaternion

    let rigidBodyDesc
    if (type === 'dynamic') rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    else if (type === 'kinematic') rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    else if (type === 'fixed') rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
    else rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()

    rigidBodyDesc.setTranslation(p.x, p.y, p.z)
    rigidBodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })

    const body = this.world.createRigidBody(rigidBodyDesc)
    body.setLinearDamping(0.3) // 線形（移動）減衰
    // body.setAngularDamping(0.5) // 回転減衰

    this.world.createCollider(shape, body)
    return body
  }

  box(mesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material>, type: RigidBodyType) {
    const { width, height, depth } = mesh.geometry.parameters
    const shape = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
    shape.setMass(10)
    // shape.setRestitution(0.9) // 反発
    // shape.setFriction(0.1) // 摩擦

    this.rigidBodyMap.set(mesh, this.rigidBody(mesh, shape, type))
    if (type === 'dynamic') {
      this.dynamicMeshes.push(mesh)
    }
  }

  sphere(mesh: THREE.Mesh<THREE.SphereGeometry | THREE.IcosahedronGeometry, THREE.Material>, type: RigidBodyType) {
    const radius = mesh.geometry.parameters.radius
    const shape = RAPIER.ColliderDesc.ball(radius)
    shape.setMass(1)
    // shape.setRestitution(0) // 反発

    this.rigidBodyMap.set(mesh, this.rigidBody(mesh, shape, type))
    if (type === 'dynamic') {
      this.dynamicMeshes.push(mesh)
    }
  }

  convexHull(mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>, type: RigidBodyType) {
    const positions = mesh.geometry.getAttribute('position') as THREE.Float32BufferAttribute
    const shape = RAPIER.ColliderDesc.convexHull(positions.array as Float32Array)

    if (shape) {
      shape.setMass(1)

      this.rigidBodyMap.set(mesh, this.rigidBody(mesh, shape, type))
      if (type === 'dynamic') {
        this.dynamicMeshes.push(mesh)
      }
    }
  }

  syncToBody(mesh: THREE.Mesh) {
    const body = this.rigidBodyMap.get(mesh)
    if (body) {
      body.setTranslation({ ...mesh.position }, true)
      body.setRotation({ ...mesh.quaternion }, true)
    }
  }

  update() {
    this.world.timestep = three.time.delta
    this.world.step()

    for (const mesh of this.dynamicMeshes) {
      const body = this.rigidBodyMap.get(mesh)
      if (!body) continue

      const p = body.translation()
      const q = body.rotation()
      this.vec3.set(this.center.x - p.x, this.center.y - p.y, this.center.z - p.z).multiplyScalar(5)
      body.applyImpulse({ ...this.vec3 }, true)

      mesh.position.set(p.x, p.y, p.z)
      mesh.quaternion.set(q.x, q.y, q.z, q.w)
    }
  }
}

export const raiper = new Rapier()
