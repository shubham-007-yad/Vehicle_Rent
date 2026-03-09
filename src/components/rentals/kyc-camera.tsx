"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/actions";

interface KYCCameraProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
}

const EMPTY_ARRAY: string[] = [];

export function KYCCamera({ onImagesChange, initialImages = EMPTY_ARRAY }: KYCCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsPending] = useState(false);
  const [images, setImages] = useState<string[]>(initialImages);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPending(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      try {
        // Real upload to Cloudinary
        const result = await uploadImage(base64String);
        
        if (result.error) {
          toast.error("Cloud upload failed. Please try again.");
        } else if (result.url) {
          // ONLY add to state if we have a real permanent URL
          const newImages = [...images, result.url];
          setImages(newImages);
          onImagesChange(newImages);
          toast.success("Photo secured in cloud!");
        }
      } catch (err) {
        toast.error("Network error during upload.");
      } finally {
        setIsPending(false);
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing Previews */}
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg border-2 overflow-hidden bg-muted group">
            <img src={url} alt={`KYC ${index}`} className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-[8px] text-white text-center font-bold">
              PAGE {index + 1}
            </div>
          </div>
        ))}

        {/* Add Button */}
        <button
          type="button"
          onClick={triggerCamera}
          disabled={isUploading}
          className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 hover:bg-muted hover:border-primary transition-all group"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <>
              <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors mb-2">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Photo</span>
            </>
          )}
        </button>
      </div>

      {images.length === 0 && !isUploading && (
        <div className="p-8 border-2 border-dashed rounded-xl text-center bg-muted/20">
          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
          <p className="text-xs text-muted-foreground font-medium">No ID photos captured yet.</p>
          <Button type="button" variant="outline" size="sm" onClick={triggerCamera} className="mt-3 gap-2">
            <Camera size={14} /> Take First Photo
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic bg-muted/50 p-2 rounded-lg border">
          <ImageIcon size={12} />
          <span>{images.length} photos ready for upload. You can add more (e.g. Front, Back, Owner's RC).</span>
        </div>
      )}
    </div>
  );
}
