// Deep dive into wall classes by analyzing cell positions
const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("example.html", "utf8");
const dom = new JSDOM(html);
const document = dom.window.document;

const cells = document.querySelectorAll("[data-cell-idx]");
const width = 7;
const height = 7;

console.log("=== ANALYZING WALL CLASSES BY POSITION ===\n");

// Classes that appear on ~40% of cells (likely walls)
const wallCandidates = ["b44f7f51", "_935ffea8", "e7a78a55", "fd9fd883"];

// Additional candidates
const otherCandidates = ["_80e7a00f", "b813a54d", "_2e574c8f"];

console.log("Analyzing wall candidate classes:\n");

[...wallCandidates, ...otherCandidates].forEach((candidate) => {
  console.log(`\n=== Class: ${candidate} ===`);

  const cellsWithClass = [];

  cells.forEach((cell) => {
    const idx = parseInt(cell.getAttribute("data-cell-idx"));
    const row = Math.floor(idx / width);
    const col = idx % width;

    const childDivs = cell.querySelectorAll("div");
    let hasClass = false;

    childDivs.forEach((div) => {
      if (div.className.includes(candidate)) {
        hasClass = true;
      }
    });

    if (hasClass) {
      cellsWithClass.push({ idx, row, col });
    }
  });

  console.log(`Found in ${cellsWithClass.length} cells:`);

  // Group by row and column to find patterns
  const byRow = {};
  const byCol = {};

  cellsWithClass.forEach(({ row, col }) => {
    byRow[row] = (byRow[row] || 0) + 1;
    byCol[col] = (byCol[col] || 0) + 1;
  });

  console.log("By row:", byRow);
  console.log("By col:", byCol);

  // Show first 10 cells
  console.log(
    "First 10 cells:",
    cellsWithClass
      .slice(0, 10)
      .map((c) => `[${c.row},${c.col}]`)
      .join(", ")
  );
});

// Now let's look at specific cells with walls based on the classes
console.log("\n\n=== DETAILED WALL ANALYSIS ===\n");

// Check cells that have the wall candidate classes
const cellsToAnalyze = [10, 11, 13, 17, 30, 31, 37, 38, 44, 45, 46, 47];

cellsToAnalyze.forEach((idx) => {
  const cell = document.querySelector(`[data-cell-idx="${idx}"]`);
  if (cell) {
    const row = Math.floor(idx / width);
    const col = idx % width;

    console.log(`\nCell ${idx} [${row},${col}]:`);

    const contentDiv = cell.querySelector('[data-cell-content="true"]');
    if (contentDiv) {
      console.log(`  Value: ${contentDiv.textContent.trim()}`);
    }

    const childDivs = cell.querySelectorAll("div");

    // Find divs with wall candidate classes
    childDivs.forEach((div, i) => {
      const classes = div.className.split(" ").filter((c) => c.trim());
      const wallClasses = classes.filter(
        (c) => wallCandidates.includes(c) || otherCandidates.includes(c)
      );

      if (wallClasses.length > 0) {
        console.log(
          `  Div ${i} has wall candidates: ${wallClasses.join(", ")}`
        );
        console.log(`    All classes: ${classes.join(", ")}`);
      }
    });
  }
});
