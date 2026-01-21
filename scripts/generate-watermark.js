// Script to generate the watermark PNG
// Run with: node scripts/generate-watermark.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// Watermark dimensions (will be scaled at runtime)
const WIDTH = 300;
const HEIGHT = 40;

// Create canvas
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Clear with transparency
ctx.clearRect(0, 0, WIDTH, HEIGHT);

// Draw rounded rectangle background (40% opacity)
const cornerRadius = HEIGHT / 2;
ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
ctx.beginPath();
ctx.moveTo(cornerRadius, 0);
ctx.lineTo(WIDTH - cornerRadius, 0);
ctx.quadraticCurveTo(WIDTH, 0, WIDTH, cornerRadius);
ctx.lineTo(WIDTH, HEIGHT - cornerRadius);
ctx.quadraticCurveTo(WIDTH, HEIGHT, WIDTH - cornerRadius, HEIGHT);
ctx.lineTo(cornerRadius, HEIGHT);
ctx.quadraticCurveTo(0, HEIGHT, 0, HEIGHT - cornerRadius);
ctx.lineTo(0, cornerRadius);
ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
ctx.closePath();
ctx.fill();

// Draw home icon
const iconX = 12;
const iconY = HEIGHT / 2;
const iconScale = 0.75;

ctx.strokeStyle = "white";
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.lineJoin = "round";

// House roof
ctx.beginPath();
ctx.moveTo(iconX + 3 * iconScale, iconY + 1 * iconScale);
ctx.lineTo(iconX + 12 * iconScale, iconY - 7 * iconScale);
ctx.lineTo(iconX + 21 * iconScale, iconY + 1 * iconScale);
ctx.stroke();

// House body
ctx.beginPath();
ctx.moveTo(iconX + 5 * iconScale, iconY - 1 * iconScale);
ctx.lineTo(iconX + 5 * iconScale, iconY + 8 * iconScale);
ctx.lineTo(iconX + 19 * iconScale, iconY + 8 * iconScale);
ctx.lineTo(iconX + 19 * iconScale, iconY - 1 * iconScale);
ctx.stroke();

// Door
ctx.beginPath();
ctx.moveTo(iconX + 9 * iconScale, iconY + 8 * iconScale);
ctx.lineTo(iconX + 9 * iconScale, iconY + 3 * iconScale);
ctx.lineTo(iconX + 15 * iconScale, iconY + 3 * iconScale);
ctx.lineTo(iconX + 15 * iconScale, iconY + 8 * iconScale);
ctx.stroke();

// Draw text
ctx.fillStyle = "white";
ctx.font = "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
ctx.textBaseline = "middle";
ctx.fillText("Virtually staged with AI", 35, HEIGHT / 2 + 1);

// Save to file
const outputPath = path.join(__dirname, "..", "public", "watermark.png");
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outputPath, buffer);

console.log(`Watermark saved to: ${outputPath}`);
console.log(`Size: ${buffer.length} bytes`);
