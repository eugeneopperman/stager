"use client";

interface CropPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragType = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null;

interface DisplaySize {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface CropPreviewProps {
  cropPercent: CropPercent;
  displaySize: DisplaySize;
  isDragging: boolean;
  dragType: DragType;
  onMouseDown: (e: React.MouseEvent, type: DragType) => void;
}

export function CropPreview({
  cropPercent,
  displaySize,
  isDragging,
  dragType,
  onMouseDown,
}: CropPreviewProps) {
  if (displaySize.width <= 0) return null;

  const cropStyle = {
    left: displaySize.offsetX + (displaySize.width * cropPercent.x) / 100,
    top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
    width: (displaySize.width * cropPercent.width) / 100,
    height: (displaySize.height * cropPercent.height) / 100,
  };

  return (
    <>
      {/* Dark overlay outside crop area */}
      {/* Top */}
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: displaySize.offsetX,
          top: displaySize.offsetY,
          width: displaySize.width,
          height: (displaySize.height * cropPercent.y) / 100,
        }}
      />
      {/* Bottom */}
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: displaySize.offsetX,
          top: displaySize.offsetY + (displaySize.height * (cropPercent.y + cropPercent.height)) / 100,
          width: displaySize.width,
          height: (displaySize.height * (100 - cropPercent.y - cropPercent.height)) / 100,
        }}
      />
      {/* Left */}
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: displaySize.offsetX,
          top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
          width: (displaySize.width * cropPercent.x) / 100,
          height: (displaySize.height * cropPercent.height) / 100,
        }}
      />
      {/* Right */}
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: displaySize.offsetX + (displaySize.width * (cropPercent.x + cropPercent.width)) / 100,
          top: displaySize.offsetY + (displaySize.height * cropPercent.y) / 100,
          width: (displaySize.width * (100 - cropPercent.x - cropPercent.width)) / 100,
          height: (displaySize.height * cropPercent.height) / 100,
        }}
      />

      {/* Crop box */}
      <div
        className="absolute border-2 border-white shadow-lg"
        style={{
          ...cropStyle,
          cursor: isDragging && dragType === "move" ? "grabbing" : "grab",
        }}
        onMouseDown={(e) => onMouseDown(e, "move")}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Corner handles */}
        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
          <div
            key={corner}
            className="absolute w-4 h-4 bg-white border border-gray-400 rounded-sm shadow"
            style={{
              top: corner.includes("n") ? -8 : "auto",
              bottom: corner.includes("s") ? -8 : "auto",
              left: corner.includes("w") ? -8 : "auto",
              right: corner.includes("e") ? -8 : "auto",
              cursor: `${corner}-resize`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, corner);
            }}
          />
        ))}

        {/* Edge handles */}
        {(["n", "s", "e", "w"] as const).map((edge) => (
          <div
            key={edge}
            className="absolute bg-white/80"
            style={{
              ...(edge === "n" || edge === "s"
                ? { left: "50%", transform: "translateX(-50%)", width: 32, height: 4 }
                : { top: "50%", transform: "translateY(-50%)", width: 4, height: 32 }),
              ...(edge === "n" && { top: -2 }),
              ...(edge === "s" && { bottom: -2 }),
              ...(edge === "w" && { left: -2 }),
              ...(edge === "e" && { right: -2 }),
              cursor: edge === "n" || edge === "s" ? "ns-resize" : "ew-resize",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, edge);
            }}
          />
        ))}
      </div>
    </>
  );
}
