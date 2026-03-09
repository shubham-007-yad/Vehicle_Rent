"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KYCCamera } from "./kyc-camera";
import { cn } from "@/lib/utils";

interface DamageHotspot {
  x: number;
  y: number;
  type: string;
  description?: string;
}

interface VehicleInspectionProps {
  onPhotosChange: (urls: string[]) => void;
  onHotspotsChange: (hotspots: DamageHotspot[]) => void;
  initialPhotos?: string[];
  initialHotspots?: DamageHotspot[];
  title?: string;
  vehicleType?: "Bike" | "Scooter" | "Car";
  readonly?: boolean;
}

const DAMAGE_TYPES = [
  "Scratch",
  "Dent",
  "Broken Part",
  "Missing Part",
  "Paint Damage",
  "Other",
];

export function VehicleInspection({
  onPhotosChange,
  onHotspotsChange,
  initialPhotos = [],
  initialHotspots = [],
  title = "Vehicle Condition Report",
  vehicleType = "Bike",
  readonly = false,
}: VehicleInspectionProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [hotspots, setHotspots] = useState<DamageHotspot[]>(initialHotspots);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);

  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorpt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // Get viewbox dimensions to calculate percentage
    const viewBox = svg.viewBox.baseVal;
    const x = (cursorpt.x / viewBox.width) * 100;
    const y = (cursorpt.y / viewBox.height) * 100;

    const newHotspot: DamageHotspot = {
      x,
      y,
      type: "Scratch",
      description: "",
    };

    const newHotspots = [...hotspots, newHotspot];
    setHotspots(newHotspots);
    onHotspotsChange(newHotspots);
    setSelectedHotspot(newHotspots.length - 1);
  };

  const updateHotspot = (index: number, updates: Partial<DamageHotspot>) => {
    const newHotspots = [...hotspots];
    newHotspots[index] = { ...newHotspots[index], ...updates };
    setHotspots(newHotspots);
    onHotspotsChange(newHotspots);
  };

  const removeHotspot = (index: number) => {
    const newHotspots = hotspots.filter((_, i) => i !== index);
    setHotspots(newHotspots);
    onHotspotsChange(newHotspots);
    setSelectedHotspot(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Camera className="h-4 w-4" /> {title}
        </h3>
        <p className="text-[10px] text-muted-foreground italic">
          Take photos of the vehicle from all 4 sides and mark any existing damages below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Photos */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase">Condition Photos</Label>
          <KYCCamera 
            onImagesChange={(urls) => {
              setPhotos(urls);
              onPhotosChange(urls);
            }} 
          />
        </div>

        {/* Right: Damage Map */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase flex justify-between items-center">
            Damage Hotspot Map
            {hotspots.length > 0 && (
              <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                {hotspots.length} Issues Marked
              </span>
            )}
          </Label>
          
          <div className="relative border-2 border-dashed rounded-xl bg-muted/20 overflow-hidden">
             {/* Vehicle Diagram SVG */}
             <svg 
              viewBox="0 0 400 200" 
              className={cn(
                "w-full h-auto cursor-crosshair",
                readonly && "cursor-default"
              )}
              onClick={handleDiagramClick}
            >
              {/* Simple Car/Bike Outline */}
              {vehicleType === "Car" ? (
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M50 150 L350 150 L350 100 L300 100 L250 50 L150 50 L100 100 L50 100 Z" />
                  <circle cx="100" cy="150" r="20" />
                  <circle cx="300" cy="150" r="20" />
                  <line x1="100" y1="100" x2="300" y2="100" />
                  <line x1="200" y1="50" x2="200" y2="150" />
                </g>
              ) : (
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  {/* Simple Scooter/Bike Outline */}
                  <circle cx="100" cy="160" r="25" />
                  <circle cx="300" cy="160" r="25" />
                  <path d="M100 160 L140 80 L260 80 L300 160" />
                  <path d="M140 80 L140 40 L120 40" />
                  <path d="M260 80 L240 40" />
                </g>
              )}

              {/* Hotspots */}
              {hotspots.map((h, i) => (
                <g key={i} transform={`translate(${(h.x / 100) * 400}, ${(h.y / 100) * 200})`}>
                  <circle 
                    r="8" 
                    className={cn(
                      "fill-red-500/80 stroke-white stroke-2 animate-pulse cursor-pointer transition-all",
                      selectedHotspot === i && "fill-red-600 r-10 stroke-[3px]"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHotspot(i);
                    }}
                  />
                  <text y="-12" textAnchor="middle" className="text-[10px] font-bold fill-red-600 select-none">
                    #{i + 1}
                  </text>
                </g>
              ))}
            </svg>

            {!readonly && hotspots.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                  Tap on the diagram to mark damage
                </p>
              </div>
            )}
          </div>

          {/* Hotspot Editor */}
          {selectedHotspot !== null && !readonly && (
            <div className="bg-muted/50 p-4 rounded-xl border-2 border-primary/20 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-primary">Damage #{selectedHotspot + 1}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeHotspot(selectedHotspot)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase">Type</Label>
                  <Select 
                    value={hotspots[selectedHotspot].type}
                    onValueChange={(v) => updateHotspot(selectedHotspot, { type: v })}
                  >
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPES.map(t => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase">Description</Label>
                  <Input 
                    className="h-8 text-xs"
                    placeholder="e.g. 5cm scratch"
                    value={hotspots[selectedHotspot].description}
                    onChange={(e) => updateHotspot(selectedHotspot, { description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Readonly Hotspot List */}
          {readonly && hotspots.length > 0 && (
            <div className="space-y-2">
              {hotspots.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-[11px]">
                  <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  <span className="font-bold uppercase text-red-600">{h.type}</span>
                  <span className="text-muted-foreground truncate">{h.description || "No description"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
