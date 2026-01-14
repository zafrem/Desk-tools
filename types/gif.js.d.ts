declare module "gif.js" {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    transparent?: number | null;
    repeat?: number;
    dither?: boolean | string;
  }

  interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      image: HTMLCanvasElement | HTMLImageElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions
    ): void;
    on(event: "finished", callback: (blob: Blob) => void): void;
    on(event: "progress", callback: (progress: number) => void): void;
    on(event: "start" | "abort", callback: () => void): void;
    render(): void;
    abort(): void;
  }

  export default GIF;
}
