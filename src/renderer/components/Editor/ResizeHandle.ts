import * as THREE from "three";
import { Handle } from "./Handle";

const HANDLE_SIZE = 0.15; // Size of each resize handle
const HANDLE_COLOR = 0xffffff;
const HANDLE_HOVER_COLOR = 0x00aaff;

type ResizeHandleType =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right";

const CURSOR_MAP: Record<ResizeHandleType, string> = {
  "top-left": "nwse-resize",
  "top-right": "nesw-resize",
  "bottom-left": "nesw-resize",
  "bottom-right": "nwse-resize",
  "top": "ns-resize",
  "bottom": "ns-resize",
  "left": "ew-resize",
  "right": "ew-resize",
};

export class ResizeHandle extends Handle {
  #handles: Map<ResizeHandleType, THREE.Mesh> = new Map();
  #materials: Map<ResizeHandleType, THREE.MeshBasicMaterial> = new Map();
  #hoveredHandle: ResizeHandleType | null = null;
  #isDragging = false;
  #dragStart: THREE.Vector3 = new THREE.Vector3();
  #dragStartLayerSize: THREE.Vector2 = new THREE.Vector2();
  #activeHandle: ResizeHandleType | null = null;

  public updateMousePosition(worldPos: THREE.Vector3): void {
    if (this.#isDragging) {
      return; // Don't update cursor while dragging
    }

    const newHovered = this.#getHandleAtPosition(worldPos);

    if (newHovered !== this.#hoveredHandle) {
      this.#setHoveredHandle(newHovered);
    }

    this.#updateCursor();
  }

  public startDrag(worldPos: THREE.Vector3): boolean {
    const handle = this.#getHandleAtPosition(worldPos);

    if (handle) {
      this.#isDragging = true;
      this.#activeHandle = handle;
      this.#dragStart.copy(worldPos);
      this.#dragStartLayerSize.copy(this.layer.size);
      this.#updateCursor();
      return true;
    }

    return false;
  }

  public onDrag(worldPos: THREE.Vector3): void {
    if (!this.#isDragging || !this.#activeHandle) {
      return;
    }

    const deltaX = worldPos.x - this.#dragStart.x;
    const deltaY = worldPos.y - this.#dragStart.y;

    const newSize = this.#dragStartLayerSize.clone();

    // Calculate new size based on which handle is being dragged
    switch (this.#activeHandle) {
      case "top-left":
        newSize.x -= deltaX;
        newSize.y -= deltaY;
        break;
      case "top-right":
        newSize.x += deltaX;
        newSize.y -= deltaY;
        break;
      case "bottom-left":
        newSize.x -= deltaX;
        newSize.y += deltaY;
        break;
      case "bottom-right":
        newSize.x += deltaX;
        newSize.y += deltaY;
        break;
      case "top":
        newSize.y -= deltaY;
        break;
      case "bottom":
        newSize.y += deltaY;
        break;
      case "left":
        newSize.x -= deltaX;
        break;
      case "right":
        newSize.x += deltaX;
        break;
    }

    // Minimum size constraint
    const minSize = 0.5;
    newSize.x = Math.max(newSize.x, minSize);
    newSize.y = Math.max(newSize.y, minSize);

    this.layer.size.copy(newSize);
    this.draw(); // Redraw handles at new positions
  }

  public endDrag(): void {
    this.#isDragging = false;
    this.#activeHandle = null;
    this.#updateCursor();
  }

  protected override onDraw(): void {
    const { scene, renderer, camera } = this.layer;

    if (!scene || !renderer || !camera) {
      return;
    }

    const layerWidth = this.layer.size.x;
    const layerHeight = this.layer.size.y;

    const halfWidth = layerWidth / 2;
    const halfHeight = layerHeight / 2;

    const handlePositions: Record<ResizeHandleType, THREE.Vector3> = {
      "top-left": new THREE.Vector3(-halfWidth, halfHeight, 0),
      "top-right": new THREE.Vector3(halfWidth, halfHeight, 0),
      "bottom-left": new THREE.Vector3(-halfWidth, -halfHeight, 0),
      "bottom-right": new THREE.Vector3(halfWidth, -halfHeight, 0),
      "top": new THREE.Vector3(0, halfHeight, 0),
      "bottom": new THREE.Vector3(0, -halfHeight, 0),
      "left": new THREE.Vector3(-halfWidth, 0, 0),
      "right": new THREE.Vector3(halfWidth, 0, 0),
    };

    // Create or update handles
    Object.entries(handlePositions).forEach(([type, position]) => {
      const handleType = type as ResizeHandleType;

      if (!this.#handles.has(handleType)) {
        const geometry = new THREE.BoxGeometry(HANDLE_SIZE, HANDLE_SIZE, 0.1);
        const material = new THREE.MeshBasicMaterial({
          color: HANDLE_COLOR,
          transparent: true,
          opacity: 0.8,
        });
        const handle = new THREE.Mesh(geometry, material);
        scene.add(handle);

        this.#handles.set(handleType, handle);
        this.#materials.set(handleType, material);
      }

      const handle = this.#handles.get(handleType)!;
      handle.position.copy(position);
    });
  }

  protected override async onBoundsEntered(_signal: AbortSignal): Promise<void> {
    // No animation needed for resize handles on enter
    // They're always visible when layer is selected
  }

  protected override async onBoundsExited(_signal: AbortSignal): Promise<void> {
    // No animation needed for resize handles on exit
    // They'll be hidden when layer is deselected
  }

  #getHandleAtPosition(worldPos: THREE.Vector3): ResizeHandleType | null {
    const hitThreshold = HANDLE_SIZE / 2 + 0.05; // Add some padding

    for (const [type, handle] of this.#handles) {
      const distance = worldPos.distanceTo(handle.position);
      if (distance <= hitThreshold) {
        return type as ResizeHandleType;
      }
    }

    return null;
  }

  #setHoveredHandle(handleType: ResizeHandleType | null): void {
    this.#hoveredHandle = handleType;

    // Update handle colors
    this.#materials.forEach((material, type) => {
      if (type === handleType) {
        material.color.setHex(HANDLE_HOVER_COLOR);
      } else {
        material.color.setHex(HANDLE_COLOR);
      }
    });
  }

  #updateCursor(): void {
    const { renderer } = this.layer;

    if (!renderer) {
      return;
    }

    let cursor = "default";

    if (this.#isDragging && this.#activeHandle) {
      cursor = CURSOR_MAP[this.#activeHandle];
    } else if (this.#hoveredHandle) {
      cursor = CURSOR_MAP[this.#hoveredHandle];
    }

    renderer.domElement.style.cursor = cursor;
  }

  public dispose(): void {
    const { scene } = this.layer;

    this.#handles.forEach((handle) => {
      scene?.remove(handle);
      (handle.geometry as THREE.BufferGeometry)?.dispose();
      if (Array.isArray(handle.material)) {
        handle.material.forEach((m) => m.dispose());
      } else {
        handle.material.dispose();
      }
    });

    this.#handles.clear();
    this.#materials.clear();
  }
}
