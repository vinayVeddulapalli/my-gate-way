'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, ShieldAlert, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onPhotoCaptured: (photoUrl: string) => void;
  onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onPhotoCaptured,
  onClose
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preset demo visitor photos for instant testing without webcam
  const samplePhotos = [
    { label: 'Delivery Rider', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
    { label: 'Guest', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
    { label: 'Service Tech', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Cab Driver', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
  ];

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment. You can use the photo upload or sample avatars below.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access was blocked or is unavailable. Please grant browser camera permissions, or select a photo / sample below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    if (!hasConsent) {
      alert('Visitor consent must be obtained before storing photograph.');
      return;
    }
    onPhotoCaptured(capturedImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Capture Visitor Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Viewfinder / Captured Preview */}
          <div className="relative aspect-square max-h-72 mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 flex items-center justify-center shadow-inner">
            {capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captured Visitor"
                className="w-full h-full object-cover"
              />
            ) : isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Camera className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-xs">{cameraError || 'Camera inactive.'}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Hidden canvas for snapshot rasterization */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Privacy Badge overlay */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              <span>Encrypted Private Storage</span>
            </div>
          </div>

          {/* Action buttons under viewfinder */}
          <div className="flex items-center justify-center gap-3">
            {isCameraActive && !capturedImage && (
              <button
                type="button"
                onClick={handleCapture}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all text-sm"
              >
                <Camera className="w-5 h-5" />
                <span>SNAP PHOTOGRAPH</span>
              </button>
            )}

            {capturedImage && (
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
            )}
          </div>

          {/* Fallback Option 1: File Upload */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Or upload from device / gallery:</span>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Image</span>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Fallback Option 2: Quick Demo Sample Avatars */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Demo Sample Photos</span>
            <div className="grid grid-cols-4 gap-2">
              {samplePhotos.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCapturedImage(sample.url);
                    stopCamera();
                  }}
                  className="flex flex-col items-center p-1 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors group text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <span className="text-[10px] text-slate-600 font-medium mt-1 truncate w-full text-center">
                    {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* DPDP Legal Consent Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                <strong>Visitor Consent Verified:</strong> The visitor has been verbally informed that their photograph & phone number are captured strictly for gated community security records under the DPDP Act and will be stored securely with access restricted to authorized residents.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!capturedImage || !hasConsent}
            onClick={handleConfirm}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
              capturedImage && hasConsent
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>CONFIRM PHOTO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
