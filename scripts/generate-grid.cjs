// Renders the Ram Shalaka Prashnavali board: a 15x15 grid of squares 1-225.
// This reproduces the FORM of the traditional chart (ornate devotional border,
// Devanagari header/footer, 9-lane structure shading) and the product mechanic
// (pick a number 1-225). It intentionally does NOT print the canonical sacred
// aksharas, which are not present in the dataset and must not be fabricated.
const fs = require("node:fs");
const path = require("node:path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const FONT_DIR = path.join(
  __dirname,
  "..",
  "node_modules",
  "@fontsource",
  "noto-sans-devanagari",
  "files",
);
GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "noto-sans-devanagari-devanagari-400-normal.woff2"),
  "Deva",
);
GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "noto-sans-devanagari-devanagari-700-normal.woff2"),
  "DevaBold",
);

const COLS = 15;
const ROWS = 15;
const CELL = 84;
const GRID_W = COLS * CELL;
const SIDE = 150;
const HEADER = 300;
const FOOTER = 250;
const W = GRID_W + SIDE * 2;
const H = HEADER + ROWS * CELL + FOOTER;

const CREAM = "#FBF3DD";
const SAFFRON = "#E8852B";
const DEEP_SAFFRON = "#C1440E";
const MAROON = "#7A1E0C";
const INK = "#4A2410";

const toDevanagari = (n) =>
  String(n).replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)]);

// Soft per-lane tint so the 9-fold trace structure is visible.
const laneColor = (lane) => {
  const hue = ((lane - 1) / 9) * 360;
  return `hsl(${hue}, 55%, 90%)`;
};

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Parchment background.
ctx.fillStyle = CREAM;
ctx.fillRect(0, 0, W, H);

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Decorative outer frame.
ctx.lineWidth = 26;
ctx.strokeStyle = SAFFRON;
roundRect(40, 40, W - 80, H - 80, 36);
ctx.stroke();
ctx.lineWidth = 6;
ctx.strokeStyle = DEEP_SAFFRON;
roundRect(64, 64, W - 128, H - 128, 24);
ctx.stroke();
ctx.lineWidth = 2;
ctx.strokeStyle = MAROON;
roundRect(76, 76, W - 152, H - 152, 20);
ctx.stroke();

// Header.
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillStyle = MAROON;
ctx.font = "64px DevaBold";
ctx.fillText("॥ श्री रामशलाका प्रश्नावली ॥", W / 2, 150);
ctx.fillStyle = DEEP_SAFFRON;
ctx.font = "30px sans-serif";
ctx.fillText("Shri Ram Shalaka Prashnavali", W / 2, 210);
ctx.fillStyle = INK;
ctx.font = "26px Deva";
ctx.fillText(
  "मन में प्रश्न रखें · १ से २२५ तक कोई एक संख्या चुनें",
  W / 2,
  256,
);

// Grid.
const gridX = SIDE;
const gridY = HEADER;
for (let n = 1; n <= 225; n++) {
  const row = Math.floor((n - 1) / COLS);
  const col = (n - 1) % COLS;
  const x = gridX + col * CELL;
  const y = gridY + row * CELL;
  const lane = ((n - 1) % 9) + 1;

  ctx.fillStyle = laneColor(lane);
  ctx.fillRect(x, y, CELL, CELL);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#D8B98A";
  ctx.strokeRect(x, y, CELL, CELL);

  ctx.fillStyle = INK;
  ctx.font = "36px DevaBold";
  ctx.fillText(toDevanagari(n), x + CELL / 2, y + CELL / 2 - 8);
  ctx.fillStyle = "#9A7B52";
  ctx.font = "18px sans-serif";
  ctx.fillText(String(n), x + CELL / 2, y + CELL / 2 + 22);
}

// Outer grid border.
ctx.lineWidth = 4;
ctx.strokeStyle = MAROON;
ctx.strokeRect(gridX, gridY, GRID_W, ROWS * CELL);

// Footer.
ctx.fillStyle = MAROON;
ctx.font = "56px DevaBold";
ctx.fillText("॥ जय श्री राम ॥", W / 2, H - 150);
ctx.fillStyle = INK;
ctx.font = "24px Deva";
ctx.fillText(
  "जो संख्या मन में आए, वही चुनें — श्रीराम आपका मार्गदर्शन करेंगे",
  W / 2,
  H - 95,
);

const outPath = path.join(__dirname, "..", "assets", "grid.png");
fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("wrote", outPath, `(${W}x${H})`);
