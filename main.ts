// The World Today — 26 November 2026.
// Draws a newspaper front page summing up the day's world news and writes
// it to /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png when testing).
// Node 22, standard library only, no network, fully deterministic.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- PNG out
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (1 + w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ font
// 5x7 bitmap font. Each glyph is 7 rows of 5 characters, '#' = ink.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "|": ["..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};
function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}
function wrapText(text: string, scale: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const cand = line ? line + " " + w : w;
    if (textWidth(cand, scale) <= maxWidth || !line) line = cand;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 227];
const PANEL: RGB = [255, 253, 245];
const INK: RGB = [17, 17, 17];
const RED: RGB = [166, 30, 30];
const GREY: RGB = [90, 86, 76];
const BLUE: RGB = [28, 68, 120];

class Canvas {
  px = new Uint8Array(W * H * 3);
  constructor() {
    for (let i = 0; i < W * H; i++) {
      this.px[i * 3] = PAPER[0];
      this.px[i * 3 + 1] = PAPER[1];
      this.px[i * 3 + 2] = PAPER[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  hline(x: number, y: number, w: number, t: number, c: RGB): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, t: number, c: RGB): void {
    this.rect(x, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      this.set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minX = Math.min(x0, x1, x2);
    const maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
        const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
        const cc = 1 - a - b;
        if (a >= 0 && b >= 0 && cc >= 0) this.set(x, y, c);
      }
    }
  }
  glyph(ch: string, x: number, y: number, s: number, c: RGB): void {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") this.rect(x + col * s, y + r * s, s, s, c);
      }
    }
  }
  text(t: string, x: number, y: number, s: number, c: RGB): void {
    let cx = x;
    for (const ch of t.toUpperCase()) {
      this.glyph(ch, cx, y, s, c);
      cx += 6 * s;
    }
  }
  textCentered(t: string, y: number, s: number, c: RGB): void {
    this.text(t, Math.round((W - textWidth(t, s)) / 2), y, s, c);
  }
  para(t: string, x: number, y: number, s: number, maxW: number, c: RGB, lh?: number): number {
    const lines = wrapText(t, s, maxW);
    const step = lh ?? 7 * s + 3 * s;
    lines.forEach((ln, i) => this.text(ln, x, y + i * step, s, c));
    return y + lines.length * step;
  }
}

// ------------------------------------------------------------- small icons
// Each icon is drawn in a 40x40 box at (x, y).
function icon(cv: Canvas, kind: string, x: number, y: number): void {
  const c = RED;
  if (kind === "flame") {
    cv.tri(x + 20, y + 2, x + 6, y + 30, x + 34, y + 30, c);
    cv.tri(x + 20, y + 14, x + 12, y + 38, x + 28, y + 38, INK);
  } else if (kind === "missile") {
    cv.tri(x + 34, y + 18, x + 8, y + 6, x + 8, y + 30, c);
    cv.rect(x + 2, y + 15, 8, 6, INK);
  } else if (kind === "chart") {
    cv.line(x + 4, y + 8, x + 16, y + 18, INK);
    cv.line(x + 16, y + 18, x + 24, y + 14, INK);
    cv.line(x + 24, y + 14, x + 36, y + 32, RED);
    cv.tri(x + 36, y + 32, x + 28, y + 30, x + 34, y + 38, RED);
  } else if (kind === "jet") {
    cv.tri(x + 38, y + 20, x + 6, y + 8, x + 12, y + 20, INK);
    cv.tri(x + 38, y + 20, x + 6, y + 32, x + 12, y + 20, INK);
    cv.rect(x + 2, y + 18, 8, 4, RED);
  } else if (kind === "rocket") {
    cv.tri(x + 20, y + 2, x + 10, y + 22, x + 30, y + 22, BLUE);
    cv.rect(x + 14, y + 22, 12, 8, INK);
    cv.tri(x + 20, y + 38, x + 14, y + 30, x + 26, y + 30, RED);
  } else if (kind === "flag") {
    cv.vline(x + 8, y + 4, 34, 3, INK);
    cv.rect(x + 11, y + 4, 24, 16, BLUE);
    cv.disc(x + 23, y + 12, 2, [255, 220, 60]);
  } else if (kind === "star") {
    cv.disc(x + 20, y + 20, 13, RED);
    cv.disc(x + 20, y + 20, 7, PAPER);
    cv.disc(x + 20, y + 20, 3, RED);
  } else if (kind === "helmet") {
    cv.rect(x + 6, y + 14, 28, 12, INK);
    cv.rect(x + 16, y + 4, 8, 10, RED);
    cv.rect(x + 4, y + 26, 32, 4, INK);
    cv.disc(x + 20, y + 8, 3, [255, 220, 60]);
  }
}

// ------------------------------------------------------------------ layout
const M = 28; // margin
const CW = W - 2 * M; // 968

function drawLeadGlobe(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PANEL);
  cv.rect(x, y, w, 2, INK);
  cv.rect(x, y + h - 2, w, 2, INK);
  cv.rect(x, y, 2, h, INK);
  cv.rect(x + w - 2, y, 2, h, INK);
  const cx = x + Math.round(w / 2);
  const cy = y + 78;
  cv.circle(cx, cy, 58, BLUE);
  cv.circle(cx, cy, 57, BLUE);
  cv.hline(cx - 58, cy, 116, 2, BLUE);
  cv.line(cx - 50, cy - 30, cx + 50, cy - 30, BLUE);
  cv.line(cx - 50, cy + 30, cx + 50, cy + 30, BLUE);
  for (let k = -2; k <= 2; k++) {
    const off = k * 18;
    cv.line(cx + off, cy - 56, cx + off, cy + 56, BLUE);
  }
  cv.text("14 PARTNERS", x + Math.round((w - textWidth("14 PARTNERS", 2)) / 2), y + h - 34, 2, RED);
  cv.text("NAMED IN THE MOVE", x + Math.round((w - textWidth("NAMED IN THE MOVE", 2)) / 2), y + h - 18, 2, GREY);
}

interface Story {
  kicker: string;
  head: string;
  detail: string;
  icon: string;
}

const STORIES: Story[] = [
  { kicker: "EGYPT", head: "Tanker fire kills at least 31 in Cairo", detail: "About 21 people hurt in the blaze.", icon: "flame" },
  { kicker: "GULF", head: "Houthis strike Saudi ports and refinery", detail: "Missiles over Riyadh shot down.", icon: "missile" },
  { kicker: "MARKETS", head: "AI sell-off drags Nasdaq near bear market", detail: "Nvidia falls 3.9%.", icon: "chart" },
  { kicker: "UKRAINE", head: "Ukraine strikes Russian airbase, five jets hit", detail: "Five jets damaged: 3 MiG-31, 2 Su-34.", icon: "jet" },
  { kicker: "SPACE", head: "First Pakistani astronaut reaches Tiangong", detail: "Ali flies aboard Shenzhou-24.", icon: "rocket" },
  { kicker: "EUROPE", head: "EU split over EUR 45bn Ukraine loan", detail: "Leaders meet in Brussels, divided.", icon: "flag" },
  { kicker: "NORTH KOREA", head: "Kim urges wider nuclear deployment", detail: "Call to widen tactical nuclear arms.", icon: "star" },
  { kicker: "INDONESIA", head: "Race to save 13 miners in flooded Bogor mine", detail: "Illegal gold mine floods.", icon: "helmet" },
];

function main(): void {
  const cv = new Canvas();

  // Masthead
  cv.textCentered("THE WORLD TODAY", 26, 8, INK);
  cv.hline(M, 96, CW, 3, INK);
  cv.textCentered("THURSDAY 26 NOVEMBER 2026", 108, 4, RED);
  cv.hline(M, 144, CW, 2, INK);
  cv.hline(M, 149, CW, 5, RED);

  // Lead story
  const leadY = 168;
  const leadH = 196;
  cv.text("LEAD STORY  |  TRADE", M, leadY, 2, RED);
  const headY = leadY + 22;
  cv.para("US PROPOSES NEW TARIFFS ON 14 TRADING PARTNERS", M, headY, 5, 600, INK, 42);
  cv.para(
    "China, the EU, Japan and India are named in the move.",
    M,
    headY + 130,
    3,
    600,
    GREY,
    24,
  );
  drawLeadGlobe(cv, 660, leadY, 336, leadH);

  // Story grid: 2 columns x 4 rows
  const gridY = 384;
  const colW = 478;
  const rowH = 120;
  const gapX = 12;
  const gapY = 8;
  STORIES.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + gapX);
    const y = gridY + row * (rowH + gapY);
    cv.rect(x, y, colW, rowH, PANEL);
    cv.rect(x, y, colW, 2, INK);
    cv.rect(x, y + rowH - 2, colW, 2, INK);
    cv.rect(x, y, 2, rowH, INK);
    cv.rect(x + colW - 2, y, 2, rowH, INK);
    icon(cv, s.icon, x + colW - 48, y + 2);
    cv.text(s.kicker, x + 12, y + 12, 2, RED);
    cv.para(s.head, x + 12, y + 44, 3, colW - 24, INK, 26);
    cv.para(s.detail, x + 12, y + 98, 2, colW - 24, GREY, 16);
  });

  // Also today strip
  const stripY = gridY + 4 * rowH + 3 * gapY + 8;
  cv.hline(M, stripY, CW, 2, INK);
  cv.text("ALSO TODAY", M, stripY + 10, 2, RED);
  cv.text("SPORT: Liverpool beat Club Brugge 3-0; Lille beat Bayern Munich 2-1.", M, stripY + 30, 2, INK);
  cv.text("MISS UNIVERSE: Jennifer Barreto wins the 2026 crown.", M, stripY + 48, 2, INK);
  cv.text("THANKSGIVING: Macy's parade postponed as severe weather hits.", M, stripY + 66, 2, INK);
  cv.hline(M, stripY + 84, CW, 2, INK);
  cv.textCentered("CONTEXT: COP31 talks in Antalya ended earlier this week without agreement.", stripY + 94, 2, GREY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = encodePng(W, H, cv.px);
  writeFileSync(`${outDir}/entry.png`, png);
  console.log(`wrote ${outDir}/entry.png (${png.length} bytes, ${W}x${H})`);
}

main();
