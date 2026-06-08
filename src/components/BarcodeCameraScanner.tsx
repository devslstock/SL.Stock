import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Zap, ZapOff, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BarcodeCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeCameraScanner({ isOpen, onClose, onScan }: BarcodeCameraScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = "camera-scanner-preview-area";
  
  // Keep track of the last scanned code and timestamp to prevent rapid duplicate scans
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Play a brief feedback sound
  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
      }
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (e) {
      console.warn("Feedback de áudio/vibração falhou:", e);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      return;
    }

    // Initialize scanner
    const startScannerSequence = async () => {
      try {
        // Request permissions and get camera devices
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          setHasPermission(true);
          setPermissionError('');

          // Select back camera by default if available
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('traseira') ||
            device.label.toLowerCase().includes('environment')
          );
          
          const defaultId = backCamera ? backCamera.id : devices[0].id;
          setActiveCameraId(defaultId);
          startScanning(defaultId);
        } else {
          setHasPermission(false);
          setPermissionError('Nenhuma câmera encontrada no dispositivo.');
        }
      } catch (err: any) {
        setHasPermission(false);
        setPermissionError(
          'A permissão para o uso da câmera foi negada ou não pôde ser obtida. Por favor, habilite o acesso à câmera nas configurações do seu navegador ou celular para poder utilizar o leitor.'
        );
      }
    };

    // Small delay to ensure the DOM element is mounted before starting html5-qrcode
    const timeout = setTimeout(() => {
      startScannerSequence();
    }, 300);

    return () => {
      clearTimeout(timeout);
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async (cameraId: string) => {
    if (html5QrCodeRef.current) {
      await stopScanning();
    }

    try {
      const html5QrCode = new Html5Qrcode(elementId);
      html5QrCodeRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          // Let ZXING handle barcodes and QR codes
          aspectRatio: 1.0,
          // Scanning box settings
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          }
        },
        (decodedText) => {
          handleSuccessScan(decodedText);
        },
        () => {
          // ignore scan failure callbacks as they are fired constantly when no code is in view
        }
      );

      // Check if torch/flash is supported by querying stream track constraints
      try {
        const track = (html5QrCode as any).getRunningTrack();
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          setIsTorchSupported(true);
          // Apply initial torch state if it was already on
          if (isTorchOn) {
            await track.applyConstraints({
              advanced: [{ torch: true } as any]
            });
          }
        } else {
          setIsTorchSupported(false);
        }
      } catch (e) {
        setIsTorchSupported(false);
      }

    } catch (err: any) {
      console.error("Falha ao iniciar o scanner de câmera:", err);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Falha ao parar o leitor de câmera:", err);
      }
    }
    html5QrCodeRef.current = null;
    setIsScanning(false);
    setIsTorchSupported(false);
    setIsTorchOn(false);
  };

  const handleSuccessScan = (code: string) => {
    if (!code) return;
    
    const now = Date.now();
    const lastScanned = lastScannedRef.current;
    
    // Safety check: Avoid reading same code too quickly (1.5 seconds safety window)
    if (code === lastScanned.code && (now - lastScanned.time) < 1500) {
      return;
    }
    
    lastScannedRef.current = { code, time: now };
    
    playBeep('success');
    onScan(code);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const track = (html5QrCodeRef.current as any).getRunningTrack();
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any]
        });
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.error("Erro ao aplicar configurações do Flash:", err);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setActiveCameraId(nextCameraId);
    startScanning(nextCameraId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-white rounded-2xl flex flex-col h-[85vh] sm:h-[70vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-bold text-sm tracking-wide">Leitor de Câmera Ativo</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Viewfinder/Video Stream Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {isOpen && hasPermission && (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center z-0">
              {/* This is the container that HTML5QRCode binds to */}
              <div id={elementId} className="w-full h-full object-cover"></div>
            </div>
          )}

          {/* Scanner frame overlay with target brackets */}
          {hasPermission && isScanning && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              {/* Grid overlay mask (simulates WMS focus frame) */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-white/20 rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                
                {/* Laser scan line animates vertically */}
                <div className="absolute left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-bounce-slow" 
                     style={{
                       animation: 'scanLaser 2.5s infinite ease-in-out'
                     }}
                />

                {/* Corners / target brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
              </div>
            </div>
          )}

          {/* Permission Denial Error UI */}
          {hasPermission === false && (
            <div className="p-6 text-center z-20 space-y-4 max-w-sm">
              <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-red-400">Acesso à Câmera Negado</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {permissionError}
              </p>
              <Button onClick={() => window.location.reload()} size="sm" className="bg-red-600 hover:bg-red-700 text-white w-full">
                Recarregar Página
              </Button>
            </div>
          )}

          {/* Initializing state */}
          {hasPermission === null && (
            <div className="text-center z-20 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-xs text-zinc-400">Solicitando acesso à câmera...</p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {hasPermission && isScanning && (
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0 flex items-center justify-around">
            {/* Flash Toggle */}
            <Button
              variant="outline"
              disabled={!isTorchSupported}
              onClick={toggleTorch}
              className={`flex items-center gap-2 h-11 px-4 border-zinc-800 rounded-xl ${
                isTorchOn 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {isTorchOn ? (
                <>
                  <ZapOff className="h-4 w-4" />
                  <span>Flash Off</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Flash On</span>
                </>
              )}
            </Button>

            {/* Switch Camera */}
            {cameras.length > 1 && (
              <Button
                variant="outline"
                onClick={switchCamera}
                className="flex items-center gap-2 h-11 px-4 bg-zinc-800 border-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Mudar Câmera</span>
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      {/* Embedded CSS animations for scanning */}
      <style>{`
        @keyframes scanLaser {
          0%, 100% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
        }
        /* Customize Html5Qrcode internal layout to hide default buttons */
        #camera-scanner-preview-area video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #camera-scanner-preview-area {
          border: none !important;
        }
      `}</style>
    </Dialog>
  );
}
