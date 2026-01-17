// Test script to parse the actual HTML and extract the puzzle with walls
// This will help us debug why the solver isn't working

const fs = require("fs");
const { JSDOM } = require("jsdom");

// Read the HTML file
const html = fs.readFileSync("example.html", "utf8");
const dom = new JSDOM(html);
const document = dom.window.document;

const cells = document.querySelectorAll("[data-cell-idx]");

console.log(`Found ${cells.length} cells`);

const cellMap = new Map();
let maxIdx = 0;

cells.forEach((cell) => {
  const idx = parseInt(cell.getAttribute("data-cell-idx"));
  cellMap.set(idx, cell);
  maxIdx = Math.max(maxIdx, idx);
});

const totalCells = maxIdx + 1;
let width = Math.sqrt(totalCells);
let height = width;

if (!Number.isInteger(width)) {
  const possibleSizes = [5, 6, 7, 8, 9, 10, 11, 12];
  for (const size of possibleSizes) {
    if (totalCells % size === 0) {
      width = size;
      height = totalCells / size;
      break;
    }
  }
}

width = Math.round(width);
height = Math.round(height);

console.log(`Detected grid: ${height}x${width} (${totalCells} cells)`);

const grid = [];
for (let i = 0; i < height; i++) {
  grid[i] = [];
  for (let j = 0; j < width; j++) {
    grid[i][j] = null;
  }
}

let maxNumber = 0;
const wallMap = new Map();

// Helper function to detect walls on each side of a cell
function detectCellWalls(cell) {
  const walls = { top: false, right: false, bottom: false, left: false };
  const childDivs = cell.querySelectorAll("div");

  childDivs.forEach((div) => {
    const classes = div.className;

    // Check for bottom wall
    if (classes.includes("_2f62539a")) {
      walls.bottom = true;
    }

    // Check for left wall
    if (classes.includes("_30c7ac6a")) {
      walls.left = true;
    }
  });

  return walls;
}

cells.forEach((cell) => {
  const idx = parseInt(cell.getAttribute("data-cell-idx"));
  const row = Math.floor(idx / width);
  const col = idx % width;

  // Detect walls on each side of the cell
  const cellWalls = detectCellWalls(cell);
  if (cellWalls.top || cellWalls.right || cellWalls.bottom || cellWalls.left) {
    wallMap.set(`${row},${col}`, cellWalls);
    console.log(`Walls at [${row}, ${col}]:`, cellWalls);
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

console.log("\n=== EXTRACTED GRID ===");
console.log("Grid:");
grid.forEach((row, idx) => {
  console.log(
    `  ${idx}: [${row
      .map((v) => (v || ".").toString().padStart(2))
      .join(", ")}]`
  );
});

console.log(`\nNumbers range from 1 to ${maxNumber}`);
console.log(`Walls detected: ${wallMap.size}`);

// Output as JSON for easy copy-paste
console.log("\n=== JSON FORMAT ===");
console.log("const testGrid = " + JSON.stringify(grid, null, 2) + ";");
console.log("\nconst wallMapData = new Map([");
wallMap.forEach((walls, key) => {
  console.log(`  ["${key}", ${JSON.stringify(walls)}],`);
});
console.log("]);");
