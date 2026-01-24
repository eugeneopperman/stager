import { memo } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

interface HistoryItemThumbnailProps {
  imageUrl: string | null;
  alt: string;
  isFavorite: boolean;
}

export const HistoryItemThumbnail = memo(function HistoryItemThumbnail({
  imageUrl,
  alt,
  isFavorite,
}: HistoryItemThumbnailProps) {
  return (
    <div className="relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      {isFavorite && (
        <div className="absolute top-1 right-1">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>
      )}
    </div>
  );
});
