import { Vector2 } from "three";
import type { Scene, WebGLRenderer, OrthographicCamera } from "three";
import type { Handle } from "./Handle";

export class Layer {
  public handles: Handle[] = [];
  public size: Vector2 = new Vector2(100, 100);
  public scene?: Scene;
  public renderer?: WebGLRenderer;
  public camera?: OrthographicCamera;

  private animationFrameIds = new Map<number, number>();
  private nextHandle = 0;

  public requestAnimationFrame(signal: AbortSignal, callback: () => void): number {
    const handle = this.nextHandle++;
    const animationId = requestAnimationFrame(callback);
    this.animationFrameIds.set(handle, animationId);

    // Abort this animation frame if signal is aborted
    if (signal.aborted) {
      cancelAnimationFrame(animationId);
      this.animationFrameIds.delete(handle);
    } else {
      signal.addEventListener('abort', () => {
        cancelAnimationFrame(animationId);
        this.animationFrameIds.delete(handle);
      }, { once: true });
    }

    return handle;
  }

  public drawHandle(handle: Handle, state: Handle["state"]): void {
    handle.state = state;
    handle.draw();
  }

  public setScene(scene: Scene): void {
    this.scene = scene;
  }

  public setRenderer(renderer: WebGLRenderer): void {
    this.renderer = renderer;
  }

  public setCamera(camera: OrthographicCamera): void {
    this.camera = camera;
  }
}
