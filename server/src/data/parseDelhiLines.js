import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function mapPdfStatus(raw) {
  const s = (raw || "").toLowerCase();
  if (s === "optimal") return "optimal";
  if (s === "low") return "low";
  if (s === "medium") return "low";
  if (s === "critical") return "critical";
  if (s === "out") return "out";
  return "optimal";
}

export function guessCategory(name) {
  const n = name.toLowerCase();
  if (n.includes("lego") || n.includes("blocks") || n.includes("jenga")) return "Building Sets";
  if (n.includes("doll") || n.includes("barbie") || n.includes("princess")) return "Dolls";
  if (n.includes("car") || n.includes("truck") || n.includes("wheels") || n.includes("matchbox"))
    return "Vehicles";
  if (n.includes("rc ") || n.includes("drone") || n.includes("monster truck")) return "RC Vehicles";
  if (n.includes("board") || n.includes("monopoly") || n.includes("uno")) return "Board Games";
  if (n.includes("puzzle") || n.includes("rubik") || n.includes("wooden puzzle")) return "Puzzles";
  if (n.includes("stem") || n.includes("robot") || n.includes("learning laptop")) return "Educational";
  if (n.includes("nerf") || n.includes("blaster") || n.includes("foam sword")) return "Outdoor Play";
  if (n.includes("piano") || n.includes("musical")) return "Musical Toys";
  if (n.includes("doctor") || n.includes("kitchen play") || n.includes("play-doh")) return "Role Play";
  return "Toys";
}

export function priceFromSku(sku) {
  const n = parseInt(sku.replace("TOY-", ""), 10) || 1;
  return 149 + (n % 180) * 7 + (n % 17) * 3;
}

/**
 * @returns {{ name: string, sku: string, quantity: number, reserved: number, available: number, statusRaw: string }[]}
 */
export function parseDelhiLines() {
  const raw = fs.readFileSync(path.join(__dirname, "delhi-inventory-source.txt"), "utf8");
  const rows = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(.+?)\s+(TOY-\d{3})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\w+)$/);
    if (!m) continue;
    rows.push({
      name: m[1].trim(),
      sku: m[2],
      quantity: parseInt(m[3], 10),
      reserved: parseInt(m[4], 10),
      available: parseInt(m[5], 10),
      statusRaw: m[6],
    });
  }
  return rows;
}
