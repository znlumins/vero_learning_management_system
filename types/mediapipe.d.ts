/**
 * Type declarations for @mediapipe/camera_utils
 * These types are not included in the official package
 */
declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
  }

  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      options: CameraOptions
    );
    start(): Promise<void>;
    stop(): void;
  }
}

/**
 * Type declarations for @mediapipe/hands
 * Extending existing types if needed
 */
declare module '@mediapipe/hands' {
  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }

  export interface Results {
    multiHandLandmarks: NormalizedLandmark[][];
    multiHandWorldLandmarks: NormalizedLandmark[][];
    multiHandedness: {
      index: number;
      score: number;
      label: 'Left' | 'Right';
    }[];
    image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
  }

  export interface HandsConfig {
    locateFile?: (file: string) => string;
  }

  export interface HandsOptions {
    selfieMode?: boolean;
    maxNumHands?: number;
    modelComplexity?: 0 | 1;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class Hands {
    constructor(config?: HandsConfig);
    setOptions(options: HandsOptions): void;
    onResults(callback: (results: Results) => void): void;
    send(input: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>;
    close(): Promise<void>;
    reset(): void;
  }

  export { Results as HandsResults };
}
