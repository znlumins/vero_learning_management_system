'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands, type Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import {
  calculateDistances,
  prepareBisindoFeatures,
  getBestPrediction,
} from '@/lib/handLogic';
import { score as scoreBisindo } from '@/lib/models/modelbisindo';
import { score as scoreSibi } from '@/lib/models/modelsibi';

// Types
type SignLanguageMode = 'BISINDO' | 'SIBI';

interface GestureScannerProps {
  className?: string;
}

export default function GestureScanner({ className = '' }: GestureScannerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // State
  const [mode, setMode] = useState<SignLanguageMode>('SIBI');
  const [prediction, setPrediction] = useState<string>('...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

  /**
   * Process hand landmarks and run prediction
   */
  const processLandmarks = useCallback(
    (results: Results) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear and draw video frame
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Mirror the canvas
      ctx.scale(-1, 1);
      ctx.translate(-canvasRef.current.width, 0);
      
      if (videoRef.current) {
        ctx.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      // Draw hand landmarks
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          // Draw connections
          drawConnections(ctx, landmarks, canvasRef.current.width, canvasRef.current.height);
          // Draw landmarks
          drawLandmarks(ctx, landmarks, canvasRef.current.width, canvasRef.current.height);
        }

        // Run prediction based on mode
        let predictionResult: string;

        if (mode === 'BISINDO') {
          // BISINDO requires 2 hands (420 features)
          const features = prepareBisindoFeatures(results.multiHandLandmarks);
          const scores = scoreBisindo(features);
          predictionResult = getBestPrediction(scores, 'bisindo');
        } else {
          // SIBI uses single hand (210 features)
          const firstHandLandmarks = results.multiHandLandmarks[0];
          const features = calculateDistances(firstHandLandmarks);
          const scores = scoreSibi(features);
          predictionResult = getBestPrediction(scores, 'sibi');
        }

        setPrediction(predictionResult);
      } else {
        setPrediction('...');
      }

      ctx.restore();
    },
    [mode]
  );

  /**
   * Draw hand landmark connections
   */
  const drawConnections = (
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number
  ) => {
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    for (const [start, end] of connections) {
      const startX = landmarks[start].x * width;
      const startY = landmarks[start].y * height;
      const endX = landmarks[end].x * width;
      const endY = landmarks[end].y * height;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  /**
   * Draw hand landmarks
   */
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number
  ) => {
    ctx.fillStyle = '#FF0000';
    for (const landmark of landmarks) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  /**
   * Initialize MediaPipe Hands and Camera
   */
  useEffect(() => {
    let isMounted = true;

    const initializeMediaPipe = async () => {
      try {
        setLoadingMessage('Loading MediaPipe Hands...');

        // Initialize MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results) => {
          if (isMounted) {
            processLandmarks(results);
          }
        });

        handsRef.current = hands;

        setLoadingMessage('Initializing camera...');

        // Initialize Camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          cameraRef.current = camera;

          setLoadingMessage('Starting camera...');
          await camera.start();

          if (isMounted) {
            setIsCameraReady(true);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        if (isMounted) {
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              setError('Camera permission denied. Please allow camera access to use this feature.');
            } else if (err.name === 'NotFoundError') {
              setError('No camera found. Please connect a camera and try again.');
            } else {
              setError(`Failed to initialize: ${err.message}`);
            }
          } else {
            setError('An unexpected error occurred during initialization.');
          }
          setIsLoading(false);
        }
      }
    };

    initializeMediaPipe();

    // Cleanup function
    return () => {
      isMounted = false;

      // Stop and cleanup camera
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      // Close MediaPipe Hands
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }

      // Stop video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [processLandmarks]);

  /**
   * Handle mode change
   */
  const handleModeChange = (newMode: SignLanguageMode) => {
    setMode(newMode);
    setPrediction('...');
  };

  return (
    <div
      className={`gesture-scanner-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        minHeight: '600px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <h2
          style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          🤟 Sign Language Scanner
        </h2>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            margin: 0,
          }}
        >
          Deteksi Bahasa Isyarat Real-time
        </p>
      </div>

      {/* Mode Toggle */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.25rem',
          borderRadius: '0.5rem',
          backdropFilter: 'blur(10px)',
        }}
      >
        {(['SIBI', 'BISINDO'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              background: mode === m
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'transparent',
              color: mode === m ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              boxShadow: mode === m ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Video Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          aspectRatio: '4/3',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          background: '#000',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 10,
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: '#667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p
              style={{
                color: '#ffffff',
                fontSize: '0.875rem',
                margin: 0,
              }}
            >
              {loadingMessage}
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 10,
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️
            </div>
            <p
              style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Hidden Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: 'none',
          }}
        />

        {/* Canvas for Rendering */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror effect
          }}
        />

        {/* Camera Status Indicator */}
        {isCameraReady && !error && (
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '9999px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              LIVE
            </span>
          </div>
        )}

        {/* Mode Badge */}
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            padding: '0.375rem 0.75rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '9999px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {mode}
          </span>
        </div>
      </div>

      {/* Prediction Display */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Prediksi Huruf
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {prediction}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Tips:</strong> Posisikan tangan Anda di depan kamera dengan pencahayaan yang baik.
          {mode === 'BISINDO' && ' BISINDO memerlukan kedua tangan untuk beberapa huruf.'}
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
