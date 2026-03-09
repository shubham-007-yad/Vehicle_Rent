"use client";

import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { Label } from "@/components/ui/label";
import { KYCCamera } from "./kyc-camera";

interface VehicleInspectionProps {
  onPhotosChange: (urls: string[]) => void;
  initialPhotos?: string[];
  title?: string;
  vehicleType?: "Bike" | "Scooter" | "Car";
  readonly?: boolean;
}

const EMPTY_ARRAY: string[] = [];

export function VehicleInspection({
  onPhotosChange,
  initialPhotos = EMPTY_ARRAY,
  title = "Vehicle Condition Report",
  readonly = false,
}: VehicleInspectionProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
    }
  }, [initialPhotos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Camera className="h-4 w-4" /> {title}
        </h3>
        <p className="text-[10px] text-muted-foreground italic">
          Take photos of the vehicle from all 4 sides to document its current condition.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-xs font-bold uppercase">Condition Photos</Label>
        {readonly ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((url, index) => (
              <div key={index} className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                <img 
                  src={url} 
                  alt={`Condition ${index + 1}`} 
                  className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, "_blank")}
                />
              </div>
            ))}
            {photos.length === 0 && (
              <p className="text-sm text-muted-foreground italic col-span-full">No photos available</p>
            )}
          </div>
        ) : (
          <KYCCamera 
            initialImages={photos}
            onImagesChange={(urls) => {
              setPhotos(urls);
              onPhotosChange(urls);
            }} 
          />
        )}
      </div>
    </div>
  );
}
