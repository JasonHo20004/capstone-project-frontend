import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface AvatarCropModalProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function AvatarCropModal({ imageSrc, open, onClose, onConfirm }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">Chỉnh sửa ảnh đại diện</DialogTitle>
        </DialogHeader>

        {/* Crop area */}
        <div className="relative w-full bg-slate-900" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <p className="text-xs text-slate-400 text-center">
            Kéo để di chuyển • Cuộn chuột hoặc dùng thanh trượt để phóng to/thu nhỏ
          </p>
        </div>

        <DialogFooter className="px-6 pb-5 flex gap-2 flex-row justify-end">
          <Button variant="ghost" size="sm" onClick={handleReset} type="button">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Đặt lại
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Hủy
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={loading} type="button">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
