// Analyze all CSS classes in the HTML to find wall indicators
const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("example.html", "utf8");
const dom = new JSDOM(html);
const document = dom.window.document;

const cells = document.querySelectorAll("[data-cell-idx]");

console.log("=== ANALYZING CSS CLASSES FOR WALL DETECTION ===\n");

// Collect all unique classes
const allClasses = new Set();
const classFrequency = new Map();

cells.forEach((cell) => {
  const idx = parseInt(cell.getAttribute("data-cell-idx"));
  const childDivs = cell.querySelectorAll("div");

  childDivs.forEach((div) => {
    const classes = div.className.split(" ").filter((c) => c.trim());
    classes.forEach((cls) => {
      allClasses.add(cls);
      classFrequency.set(cls, (classFrequency.get(cls) || 0) + 1);
    });
  });
});

console.log(`Total unique classes found: ${allClasses.size}\n`);

// Look for classes that might indicate walls (appear on some but not all cells)
console.log("=== CLASSES THAT MIGHT INDICATE WALLS ===");
console.log("(Classes that appear on some cells but not all)\n");

const suspiciousClasses = [];
Array.from(classFrequency.entries())
  .filter(([cls, count]) => count < cells.length && count > 0)
  .sort((a, b) => a[1] - b[1])
  .forEach(([cls, count]) => {
    console.log(
      `${cls.padEnd(20)} - appears ${count} times (${(
        (count / cells.length) *
        100
      ).toFixed(1)}% of cells)`
    );
    if (count < cells.length * 0.5) {
      suspiciousClasses.push(cls);
    }
  });

console.log("\n=== DETAILED ANALYSIS OF SPECIFIC CELLS ===\n");

// Check a few specific cells
const cellsToCheck = [10, 30, 37, 44]; // Cells that might have walls based on the grid

cellsToCheck.forEach((idx) => {
  const cell = document.querySelector(`[data-cell-idx="${idx}"]`);
  if (cell) {
    const row = Math.floor(idx / 7);
    const col = idx % 7;

    console.log(`Cell ${idx} [${row},${col}]:`);

    const contentDiv = cell.querySelector('[data-cell-content="true"]');
    if (contentDiv) {
      console.log(`  Value: ${contentDiv.textContent.trim()}`);
    }

    const childDivs = cell.querySelectorAll("div");
    console.log(`  Child divs: ${childDivs.length}`);

    childDivs.forEach((div, i) => {
      const classes = div.className.split(" ").filter((c) => c.trim());
      if (classes.length > 0) {
        console.log(`    Div ${i}: ${classes.join(", ")}`);
      }
    });
    console.log("");
  }
});

// Check for the old wall classes
console.log("\n=== CHECKING FOR KNOWN WALL CLASSES ===");
console.log(
  `_2f62539a (bottom wall): ${classFrequency.get("_2f62539a") || 0} occurrences`
);
console.log(
  `_30c7ac6a (left wall): ${classFrequency.get("_30c7ac6a") || 0} occurrences`
);

// Look for classes with "wall" or "border" in their name
console.log("\n=== CLASSES WITH 'WALL' OR 'BORDER' KEYWORDS ===");
Array.from(allClasses)
  .filter(
    (cls) =>
      cls.toLowerCase().includes("wall") ||
      cls.toLowerCase().includes("border") ||
      cls.toLowerCase().includes("line")
  )
  .forEach((cls) => {
    console.log(`${cls} - ${classFrequency.get(cls)} occurrences`);
  });
