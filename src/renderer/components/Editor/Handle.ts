import type { Layer } from "./Layer";

export abstract class Handle {
  public layer: Layer;
  public state: "entering" | "default" | "exiting" = "default";

  constructor(layer: Layer) {
    this.layer = layer
  }

  public async triggerBoundsEntered(signal: AbortSignal): Promise<void> {
    this.state = "entering";
    this.draw();
    return this.onBoundsEntered(signal);
  }

  public async triggerBoundsExited(signal: AbortSignal): Promise<void> {
    this.state = "exiting";
    this.draw();
    return this.onBoundsExited(signal);
  }

  public draw(): void {
    this.onDraw();
  }

  protected onBoundsEntered(_signal: AbortSignal): Promise<void> { return Promise.resolve(); }
  protected onBoundsExited(_signal: AbortSignal): Promise<void> { return Promise.resolve(); }
  protected onDraw(): void {}
}
