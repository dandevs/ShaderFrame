import { observable } from 'mobx'
import * as THREE from 'three'

export class Layer {
  children: Layer[] = []
  #dirty: boolean = true
  #texture: THREE.Texture | null = null

  public get dirty() {
    return this.#dirty
  }

  public get texture() {
    return this.#texture
  }

  public render(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): THREE.Texture {
    // if neither this layer nor any child is dirty, return cached texture
    const childDirty = this.children.some((c) => c.dirty)
    if (!this.#dirty && !childDirty && this.#texture != null) {
      return this.#texture
    }

    // create a render target sized to the current window
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)

    // render the provided scene into the target
    renderer.setRenderTarget(renderTarget)
    renderer.clear(true, true, true)
    renderer.render(scene, camera)

    // after drawing the base scene, render each child so their textures
    // are generated.  we then blit them onto the same render target at (0,0).
    // overlapping or out-of-bounds pixels are fine, they will simply clip.
    for (const child of this.children) {
      const childTex = child.render(scene, camera, renderer)

      if (childTex) {
        renderer.copyTextureToTexture(
          childTex,               // srcTexture
          renderTarget.texture,   // dstTexture
          undefined,              // srcRegion - full texture
          new THREE.Vector2(0, 0) // dstPosition
        )
      }
    }

    // store the resulting texture for future use
    this.#texture = renderTarget.texture
    this.#dirty = false

    // reset renderer to default framebuffer
    renderer.setRenderTarget(null)

    return this.#texture
  }

  [Symbol.dispose]() {
    // release our own texture if present
    if (this.#texture) {
      this.#texture.dispose()
      this.#texture = null
    }

    // dispose children recursively
    for (const child of this.children) {
      const dispose = (child as any)[Symbol.dispose]

      if (dispose) {
        dispose()
      }
    }

    this.#dirty = true
  }
}

// inspects in the UI need to know how to render the value.
// we encode a simple "field type" tag and allow either a built‑in
// renderer to be looked up or a custom component passed in.

export type FieldType =
  | 'label'
  | 'string'
  | 'number'
  | 'boolean'
  | 'vector3'
  | 'color'
  | 'texture'


class Component {
  public fields: ComponentField<any>[] = [];
  constructor(public layer: Layer) {}
}

class ComponentField<T> {
  @observable public value: T;
  public name: string;
  public type: FieldType;

  constructor(
    name: string,
    value: T,
    type: FieldType,
  ) {
    this.name = name;
    this.value = value;
    this.type = type;
  }
}

