// Test the complete solver with the actual puzzle including walls
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

function detectCellWalls(cell) {
  const walls = { top: false, right: false, bottom: false, left: false };
  const childDivs = cell.querySelectorAll("div");

  childDivs.forEach((div) => {
    const classes = div.className;
    if (classes.includes("_2e574c8f")) {
      walls.bottom = true;
    }
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

console.log("🧩 Testing Optimized Solver with Walls");
console.log("=======================================\n");
console.log(`Grid size: ${height}x${width}`);
console.log(`Numbers: 1 to ${maxNumber}`);
console.log(`Walls detected: ${wallMap.size}\n`);

// Now run the solver (copy from debug_optimized.js)
function solveZipPuzzleOptimized(grid, maxNumber, wallMap) {
  const height = grid.length;
  const width = grid[0].length;

  let validCells = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== "WALL") {
        validCells++;
      }
    }
  }

  const numGrid = grid.map((row) =>
    row.map((cell) => {
      if (cell === "WALL") return "WALL";
      return cell ? parseInt(cell) : null;
    })
  );

  const numberedCells = new Map();
  let startPos = null;
  let endPos = null;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const val = numGrid[r][c];
      if (val !== null && val !== "WALL") {
        numberedCells.set(val, [r, c]);
        if (val === 1) startPos = [r, c];
        if (val === maxNumber) endPos = [r, c];
      }
    }
  }

  if (!startPos || !endPos) {
    return { success: false, error: "No start or end position" };
  }

  const paths = [];
  let attempts = 0;
  let pruned = 0;

  function canMoveBetweenCells(fromPos, toPos, rowDelta, colDelta) {
    const [fromRow, fromCol] = fromPos;
    const [toRow, toCol] = toPos;
    const fromKey = `${fromRow},${fromCol}`;
    const toKey = `${toRow},${toCol}`;

    const fromWalls = wallMap.get(fromKey) || {
      top: false,
      right: false,
      bottom: false,
      left: false,
    };
    const toWalls = wallMap.get(toKey) || {
      top: false,
      right: false,
      bottom: false,
      left: false,
    };

    if (rowDelta === 1 && colDelta === 0) {
      if (fromWalls.bottom) return false;
    } else if (rowDelta === -1 && colDelta === 0) {
      if (toWalls.bottom) return false;
    } else if (rowDelta === 0 && colDelta === -1) {
      if (fromWalls.left) return false;
    } else if (rowDelta === 0 && colDelta === 1) {
      if (toWalls.left) return false;
    }

    return true;
  }

  function isValidMove(pos, visited) {
    const [r, c] = pos;
    if (r < 0 || r >= height || c < 0 || c >= width) return false;
    if (numGrid[r][c] === "WALL") return false;
    return !visited.has(`${r},${c}`);
  }

  function canReachAllNumberedCells(currPos, visited, currNum) {
    const requiredNumbers = [];
    for (let num = currNum + 1; num <= maxNumber; num++) {
      requiredNumbers.push(num);
    }

    if (requiredNumbers.length === 0) return true;

    const queue = [currPos];
    const reachable = new Set([`${currPos[0]},${currPos[1]}`]);
    const visitedCopy = new Set(visited);
    const directions = [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ];

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      for (const [dr, dc] of directions) {
        const newPos = [r + dr, c + dc];
        const key = `${newPos[0]},${newPos[1]}`;

        if (reachable.has(key) || visitedCopy.has(key)) continue;
        if (!isValidMove(newPos, visitedCopy)) continue;
        if (!canMoveBetweenCells([r, c], newPos, dr, dc)) continue;

        reachable.add(key);
        queue.push(newPos);
      }
    }

    for (const num of requiredNumbers) {
      const [r, c] = numberedCells.get(num);
      if (!reachable.has(`${r},${c}`)) {
        return false;
      }
    }

    return true;
  }

  function hasEnoughReachableCells(currPos, visited, pathLength) {
    const cellsNeeded = validCells - pathLength;
    if (cellsNeeded <= 0) return true;

    const queue = [currPos];
    const reachable = new Set([`${currPos[0]},${currPos[1]}`]);
    const visitedCopy = new Set(visited);
    const directions = [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ];

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      for (const [dr, dc] of directions) {
        const newPos = [r + dr, c + dc];
        const key = `${newPos[0]},${newPos[1]}`;

        if (reachable.has(key) || visitedCopy.has(key)) continue;
        if (!isValidMove(newPos, visitedCopy)) continue;
        if (!canMoveBetweenCells([r, c], newPos, dr, dc)) continue;

        reachable.add(key);
        queue.push(newPos);

        if (reachable.size >= cellsNeeded) return true;
      }
    }

    return reachable.size >= cellsNeeded;
  }

  function getSmartDirections(currPos, currNum) {
    const directions = [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ];

    if (currNum < maxNumber && numberedCells.has(currNum + 1)) {
      const [targetR, targetC] = numberedCells.get(currNum + 1);
      const [currR, currC] = currPos;

      directions.sort((a, b) => {
        const posA = [currR + a[0], currC + a[1]];
        const posB = [currR + b[0], currC + b[1]];
        const distA = Math.abs(posA[0] - targetR) + Math.abs(posA[1] - targetC);
        const distB = Math.abs(posB[0] - targetR) + Math.abs(posB[1] - targetC);
        return distA - distB;
      });
    }

    return directions;
  }

  function dfsBackTrack(currNum, currPos, currPath, visited) {
    attempts++;

    if (attempts > 2000000) {
      return;
    }

    if (currPos[0] === endPos[0] && currPos[1] === endPos[1]) {
      if (currPath.length === validCells) {
        paths.push([...currPath]);
        return;
      }
    }

    if (!canReachAllNumberedCells(currPos, visited, currNum)) {
      pruned++;
      return;
    }

    if (!hasEnoughReachableCells(currPos, visited, currPath.length)) {
      pruned++;
      return;
    }

    const directions = getSmartDirections(currPos, currNum);

    for (const [diffH, diffW] of directions) {
      const newPos = [currPos[0] + diffH, currPos[1] + diffW];
      const posKey = `${newPos[0]},${newPos[1]}`;

      if (visited.has(posKey)) continue;
      if (!isValidMove(newPos, visited)) continue;
      if (!canMoveBetweenCells(currPos, newPos, diffH, diffW)) continue;

      const cellValue = numGrid[newPos[0]][newPos[1]];
      if (cellValue === "WALL") continue;

      if (cellValue !== null) {
        if (cellValue === currNum + 1) {
          visited.add(posKey);
          dfsBackTrack(currNum + 1, newPos, [...currPath, newPos], visited);
          visited.delete(posKey);
          if (paths.length > 0) return;
        }
      } else {
        visited.add(posKey);
        dfsBackTrack(currNum, newPos, [...currPath, newPos], visited);
        visited.delete(posKey);
        if (paths.length > 0) return;
      }
    }
  }

  const visited = new Set([`${startPos[0]},${startPos[1]}`]);
  dfsBackTrack(1, startPos, [startPos], visited);

  return {
    success: paths.length > 0,
    path: paths.length > 0 ? paths[0] : null,
    attempts,
    pruned,
    validCells,
  };
}

const startTime = Date.now();
const result = solveZipPuzzleOptimized(grid, maxNumber, wallMap);
const endTime = Date.now();

if (result.success) {
  console.log(`✅ SUCCESS! Solution found in ${endTime - startTime}ms`);
  console.log(`   Attempts: ${result.attempts.toLocaleString()}`);
  console.log(`   Pruned: ${result.pruned.toLocaleString()}`);
  console.log(
    `   Path length: ${result.path.length}/${result.validCells} cells\n`
  );

  console.log("Solution path (first 20 steps):");
  result.path.slice(0, 20).forEach(([r, c], idx) => {
    const value = grid[r][c] || "empty";
    console.log(
      `  ${(idx + 1).toString().padStart(2)}. [${r},${c}] = ${value}`
    );
  });
  if (result.path.length > 20) {
    console.log(`  ... (${result.path.length - 20} more steps)`);
  }
} else {
  console.log(`❌ FAILED! No solution found`);
  console.log(`   Attempts: ${result.attempts.toLocaleString()}`);
  console.log(`   Pruned: ${result.pruned.toLocaleString()}`);
  console.log(`   Time: ${endTime - startTime}ms`);
}
