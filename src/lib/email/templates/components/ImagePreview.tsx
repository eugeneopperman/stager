import { Section, Img, Text, Row, Column } from "@react-email/components";
import * as React from "react";
import { colors, radius, shadows, spacing, typography } from "./styles";

interface ImagePreviewProps {
  imageUrl: string;
  alt?: string;
  caption?: string;
  width?: number;
}

export function ImagePreview({
  imageUrl,
  alt = "Staged photo",
  caption,
  width = 520,
}: ImagePreviewProps) {
  return (
    <Section style={imageContainer}>
      <Img
        src={imageUrl}
        alt={alt}
        width={width}
        style={image}
      />
      {caption && <Text style={captionText}>{caption}</Text>}
    </Section>
  );
}

interface BeforeAfterPreviewProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterPreview({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterPreviewProps) {
  return (
    <Section style={comparisonContainer}>
      <Row>
        <Column style={comparisonColumn}>
          <Text style={comparisonLabel}>{beforeLabel}</Text>
          <Img
            src={beforeUrl}
            alt="Before staging"
            width={250}
            style={comparisonImage}
          />
        </Column>
        <Column style={comparisonColumn}>
          <Text style={comparisonLabel}>{afterLabel}</Text>
          <Img
            src={afterUrl}
            alt="After staging"
            width={250}
            style={comparisonImage}
          />
        </Column>
      </Row>
    </Section>
  );
}

const imageContainer: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
  textAlign: "center" as const,
};

const image: React.CSSProperties = {
  borderRadius: radius.lg,
  maxWidth: "100%",
  height: "auto",
  boxShadow: shadows.card,
};

const captionText: React.CSSProperties = {
  ...typography.smallText,
  fontStyle: "italic",
  margin: "12px 0 0 0",
};

const comparisonContainer: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const comparisonColumn: React.CSSProperties = {
  padding: "0 8px",
  width: "50%",
  textAlign: "center" as const,
};

const comparisonLabel: React.CSSProperties = {
  ...typography.label,
  marginBottom: spacing.sm,
};

const comparisonImage: React.CSSProperties = {
  borderRadius: radius.lg,
  maxWidth: "100%",
  height: "auto",
  border: `1px solid ${colors.border}`,
};

export default ImagePreview;
