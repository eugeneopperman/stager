import { Section, Img, Text, Row, Column } from "@react-email/components";
import * as React from "react";

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
  margin: "24px 0",
  textAlign: "center" as const,
};

const image: React.CSSProperties = {
  borderRadius: "8px",
  maxWidth: "100%",
  height: "auto",
};

const captionText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "8px 0 0 0",
  fontStyle: "italic",
};

const comparisonContainer: React.CSSProperties = {
  margin: "24px 0",
};

const comparisonColumn: React.CSSProperties = {
  padding: "0 8px",
  width: "50%",
  textAlign: "center" as const,
};

const comparisonLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const comparisonImage: React.CSSProperties = {
  borderRadius: "8px",
  maxWidth: "100%",
  height: "auto",
  border: "1px solid #e4e4e7",
};

export default ImagePreview;
