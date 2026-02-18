import * as THREE from "three";
import { Handle } from "./Handle";

const ANIMATION_DURATION = 300; // ms
const WIREFRAME_COLOR = 0x00ff00;

export class FrameHandle extends Handle {
  #wireframe?: THREE.LineSegments;
  #material?: THREE.LineBasicMaterial;
  #alpha = 0;
  #targetAlpha = 0;
  #animationStart = 0;
  #animationStartAlpha = 0;

  protected override onDraw(): void {
    const { scene, renderer, camera } = this.layer;

    if (!scene || !renderer || !camera) {
      return;
    }

    const layerWidth = this.layer.size.x;
    const layerHeight = this.layer.size.y;

    // Create or update geometry
    if (!this.#wireframe) {
      const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
      this.#material = new THREE.LineBasicMaterial({ 
        color: WIREFRAME_COLOR,
        transparent: true,
        opacity: this.#alpha
      });
      this.#wireframe = new THREE.LineSegments(geometry, this.#material);
      scene.add(this.#wireframe);
    }

    // Scale wireframe to layer size
    this.#wireframe.scale.set(layerWidth, layerHeight, 1);

    // Update opacity
    if (this.#material) {
      this.#material.opacity = this.#alpha;
    }
  }

  protected override async onBoundsEntered(signal: AbortSignal): Promise<void> {
    this.#targetAlpha = 1.0;
    this.#animationStart = performance.now();
    this.#animationStartAlpha = this.#alpha;
    await this.animateAlpha(signal);
  }

  protected override async onBoundsExited(signal: AbortSignal): Promise<void> {
    this.#targetAlpha = 0.0;
    this.#animationStart = performance.now();
    this.#animationStartAlpha = this.#alpha;
    try {
      await this.animateAlpha(signal);
    } finally {
      this.#alpha = 0;
    }
  }

  private async animateAlpha(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - this.#animationStart;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        // Ease-in-out function
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        this.#alpha = this.#animationStartAlpha + (this.#targetAlpha - this.#animationStartAlpha) * easeProgress;
        this.draw();

        if (progress < 1 && !signal.aborted) {
          this.layer.requestAnimationFrame(signal, animate);
        } else {
          this.#alpha = this.#targetAlpha;
          this.draw();
          resolve();
        }
      };

      animate();
    });
  }
}
