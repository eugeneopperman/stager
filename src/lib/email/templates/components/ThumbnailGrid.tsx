import { Img, Link } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows } from "./styles";

interface ThumbnailProps {
  src: string;
  alt?: string;
  href?: string;
  size?: number;
}

export function Thumbnail({ src, alt = "", href, size = 80 }: ThumbnailProps) {
  const image = (
    <Img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        borderRadius: radius.lg,
        objectFit: "cover" as const,
        display: "block",
      }}
    />
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {image}
      </Link>
    );
  }

  return image;
}

interface ThumbnailGridProps {
  images: Array<{
    src: string;
    alt?: string;
    href?: string;
  }>;
  columns?: 2 | 3 | 4;
  size?: number;
  gap?: number;
}

export function ThumbnailGrid({
  images,
  columns = 4,
  size = 80,
  gap = 8,
}: ThumbnailGridProps) {
  // Limit to max 8 images
  const displayImages = images.slice(0, 8);

  // Pad to fill row if needed
  const rows: Array<typeof displayImages> = [];
  for (let i = 0; i < displayImages.length; i += columns) {
    rows.push(displayImages.slice(i, i + columns));
  }

  return (
    <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((image, colIndex) => (
              <td key={colIndex} style={{ padding: `${gap / 2}px` }}>
                <Thumbnail
                  src={image.src}
                  alt={image.alt}
                  href={image.href}
                  size={size}
                />
              </td>
            ))}
            {/* Fill empty cells if row is not complete */}
            {Array.from({ length: columns - row.length }).map((_, i) => (
              <td key={`empty-${i}`} style={{ padding: `${gap / 2}px`, width: size }} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ImageShowcaseProps {
  src: string;
  alt?: string;
  href?: string;
  caption?: string;
}

export function ImageShowcase({ src, alt = "", href, caption }: ImageShowcaseProps) {
  const image = (
    <Img
      src={src}
      alt={alt}
      width="100%"
      style={{
        borderRadius: radius.lg,
        display: "block",
        boxShadow: shadows.card,
      }}
    />
  );

  return (
    <div style={{ marginBottom: "16px" }}>
      {href ? (
        <Link href={href} style={{ textDecoration: "none" }}>
          {image}
        </Link>
      ) : (
        image
      )}
      {caption && (
        <p
          style={{
            color: colors.textMuted,
            fontSize: "13px",
            textAlign: "center" as const,
            margin: "8px 0 0 0",
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

export default ThumbnailGrid;
