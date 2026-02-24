import { autorun, IReactionDisposer, makeObservable, observable } from 'mobx'
import * as THREE from 'three'

export class Layer {
  @observable
  public children: Layer[] = []
  #dirty: boolean = true
  #texture: THREE.Texture | null = null
  #mesh: THREE.Mesh;
  #material: THREE.MeshBasicMaterial
  public transform: TransformComponent

  public get dirty() {
    return this.#dirty
  }

  public get texture() {
    return this.#texture
  }

  public get mesh() {
    return this.#mesh
  }

  constructor() {
    makeObservable(this)
    this.#material = new THREE.MeshBasicMaterial({ color: 0x777777, map: this.#texture })
    this.#mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.#material)
    this.#mesh.userData.layer = this
    this.transform = new TransformComponent(this)
  }

  public onSelectBegin() {

  }

  public onSelected(_delta: number) {

  }

  public onSelectEnd() {

  }

  public setSelected(selected: boolean) {
    this.#material.color.setHex(selected ? 0xffd54f : 0x777777)
  }

  public addChild(layer: Layer) {
    this.children.push(layer)
  }

  public updateTexture(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): THREE.Texture {
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
      const childTex = child.updateTexture(scene, camera, renderer)

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
    const disposeTransform = (this.transform as any)[Symbol.dispose]

    if (disposeTransform) {
      disposeTransform.call(this.transform)
    }

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
  readonly layer: Layer;

  constructor(layer: Layer) {
    this.layer = layer;
  }
}

class ComponentField<T> {
  public value: T;
  public name: string;
  public type: FieldType;

  constructor(
    name: string,
    value: T,
    type: FieldType,
  ) {
    makeObservable(this)
    this.name = name;
    this.value = value;
    this.type = type;
  }
}

export class TransformComponent extends Component {
  @observable position: [number, number] = [0, 0];
  @observable scale: [number, number] = [1, 1];

  #dispose: IReactionDisposer;

  constructor(layer: Layer) {
    super(layer);
    makeObservable(this)

    this.#dispose = autorun(() => {
      const [x, y] = this.position;
      const [width, height] = this.scale;

      this.layer.mesh.position.set(x, y, 0);
      this.layer.mesh.scale.set(width, height, 1);
    })
  }

  public setPosition(x: number, y: number) {
    this.position = [x, y]
  }

  public setScale(width: number, height: number) {
    this.scale = [width, height]
  }

  public setTransform(x: number, y: number, width: number, height: number) {
    this.position = [x, y]
    this.scale = [width, height]
  }

  [Symbol.dispose]() {
    this.#dispose()
  }
}
