// Test the updated wall detection with the new CSS classes
const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("example.html", "utf8");
const dom = new JSDOM(html);
const document = dom.window.document;

const cells = document.querySelectorAll("[data-cell-idx]");
const width = 7;
const height = 7;

const grid = [];
for (let i = 0; i < height; i++) {
  grid[i] = [];
  for (let j = 0; j < width; j++) {
    grid[i][j] = null;
  }
}

let maxNumber = 0;
const wallMap = new Map();

// Updated wall detection function
function detectCellWalls(cell) {
  const walls = { top: false, right: false, bottom: false, left: false };
  const childDivs = cell.querySelectorAll("div");

  childDivs.forEach((div) => {
    const classes = div.className;

    // Check for bottom wall (NEW CLASS)
    if (classes.includes("_2e574c8f")) {
      walls.bottom = true;
    }

    // Check for left wall (NEW CLASS)
    if (classes.includes("b813a54d")) {
      walls.left = true;
    }
  });

  return walls;
}

cells.forEach((cell) => {
  const idx = parseInt(cell.getAttribute("data-cell-idx"));
  const row = Math.floor(idx / width);
  const col = idx % width;

  const cellWalls = detectCellWalls(cell);
  if (cellWalls.top || cellWalls.right || cellWalls.bottom || cellWalls.left) {
    wallMap.set(`${row},${col}`, cellWalls);
  }

  const contentDiv = cell.querySelector('[data-cell-content="true"]');
  if (contentDiv) {
    const value = contentDiv.textContent.trim();
    if (value && !isNaN(parseInt(value))) {
      grid[row][col] = value;
      maxNumber = Math.max(maxNumber, parseInt(value));
    }
  }
});

console.log("=== WALL DETECTION TEST WITH NEW CLASSES ===\n");
console.log(`Grid size: ${height}x${width}`);
console.log(`Numbers range from 1 to ${maxNumber}`);
console.log(`Walls detected: ${wallMap.size}\n`);

if (wallMap.size > 0) {
  console.log("✅ SUCCESS! Walls detected:\n");
  wallMap.forEach((walls, key) => {
    const [row, col] = key.split(",");
    const value = grid[row][col] || ".";
    console.log(`  [${row},${col}] (value: ${value}):`, walls);
  });
} else {
  console.log("❌ FAILED! No walls detected.");
}

console.log("\nGrid:");
grid.forEach((row, idx) => {
  console.log(
    `  ${idx}: [${row
      .map((v) => (v || ".").toString().padStart(2))
      .join(", ")}]`
  );
});
