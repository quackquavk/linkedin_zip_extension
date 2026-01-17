// LinkedIn Zip Puzzle Solver - Content Script

function playZipPuzzle() {
  const cells = document.querySelectorAll("[data-cell-idx]");

  if (cells.length === 0) {
    console.error("No cells found! Make sure you are on the Zip game page.");
    return;
  }

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
  const wallMap = new Map(); // Track walls by cell: {row,col} -> {top, right, bottom, left}

  cells.forEach((cell) => {
    const idx = parseInt(cell.getAttribute("data-cell-idx"));
    const row = Math.floor(idx / width);
    const col = idx % width;

    // Detect walls on each side of the cell
    const cellWalls = detectCellWalls(cell);
    if (
      cellWalls.top ||
      cellWalls.right ||
      cellWalls.bottom ||
      cellWalls.left
    ) {
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

  // Helper function to detect walls on each side of a cell
  function detectCellWalls(cell) {
    const walls = { top: false, right: false, bottom: false, left: false };

    // Look for child divs with specific wall classes
    // LinkedIn uses:
    // - _2e574c8f for bottom walls (border-bottom-width: 12px)
    // - b813a54d for left walls (border-left-width: 12px)
    // We only need bottom and left since walls are shared between adjacent cells

    const childDivs = cell.querySelectorAll("div");

    childDivs.forEach((div) => {
      const classes = div.className;

      // Check for bottom wall
      if (classes.includes("_2e574c8f")) {
        walls.bottom = true;
      }

      // Check for left wall
      if (classes.includes("b813a54d")) {
        walls.left = true;
      }
    });

    return walls;
  }

  console.log("Grid extracted:", grid);
  console.log(`Numbers range from 1 to ${maxNumber}`);
  console.log(`Walls detected: ${wallMap.size}`);

  const path = solveZipPuzzle(grid, maxNumber, wallMap);

  if (!path) {
    console.error("No solution found!");
    return;
  }

  console.log("Solution found! Playing...");
  console.log("Path:", path);

  // Try to trigger the game's interaction system
  function clickCell(cellElement) {
    // Method 1: Direct click
    cellElement.click();

    // Method 2: MouseEvent with all details
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: cellElement.getBoundingClientRect().left + 10,
        clientY: cellElement.getBoundingClientRect().top + 10,
      });
      cellElement.dispatchEvent(event);
    });

    // Method 3: PointerEvent (modern alternative)
    ["pointerdown", "pointerup"].forEach((eventType) => {
      const event = new PointerEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: cellElement.getBoundingClientRect().left + 10,
        clientY: cellElement.getBoundingClientRect().top + 10,
      });
      cellElement.dispatchEvent(event);
    });

    // Method 4: Touch events (if mobile)
    ["touchstart", "touchend"].forEach((eventType) => {
      const event = new TouchEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        touches: [],
      });
      cellElement.dispatchEvent(event);
    });
  }

  let delay = 0;
  const clickDelay = 50; // Increased to 50ms for better reliability

  path.forEach(([row, col], index) => {
    setTimeout(() => {
      const cellIdx = row * width + col;
      const cellElement = cellMap.get(cellIdx);

      if (cellElement) {
        console.log(
          `Step ${index + 1}/${
            path.length
          }: Clicking cell [${row}, ${col}] (idx: ${cellIdx})`
        );
        clickCell(cellElement);
      } else {
        console.error(`Cell not found for [${row}, ${col}]`);
      }
    }, delay);

    delay += clickDelay;
  });

  console.log(`Playing solution with ${path.length} steps...`);
}

function solveZipPuzzle(grid, maxNumber, wallMap) {
  const height = grid.length;
  const width = grid[0].length;

  // Count only non-wall cells
  let validCells = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== "WALL") {
        validCells++;
      }
    }
  }

  console.log(`Valid cells (excluding walls): ${validCells}`);

  const numGrid = grid.map((row) =>
    row.map((cell) => {
      if (cell === "WALL") return "WALL";
      return cell ? parseInt(cell) : null;
    })
  );

  // Build a map of numbered cells for quick lookup
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
    console.error("Could not find start or end position");
    return null;
  }

  console.log(`Start: [${startPos}], End: [${endPos}]`);

  const paths = [];
  let attempts = 0;
  let pruned = 0;

  // Helper function to check if movement between cells is blocked by a wall
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

    // Check based on direction of movement
    if (rowDelta === 1 && colDelta === 0) {
      // Moving down: check if current cell has bottom wall
      if (fromWalls.bottom) return false;
    } else if (rowDelta === -1 && colDelta === 0) {
      // Moving up: FROM [r,c] TO [r-1,c]
      // The wall between them is the bottom wall of [r-1,c]
      if (toWalls.bottom) return false;
    } else if (rowDelta === 0 && colDelta === -1) {
      // Moving left: FROM [r,c] TO [r,c-1]
      // The wall between them is the left wall of [r,c]
      if (fromWalls.left) return false;
    } else if (rowDelta === 0 && colDelta === 1) {
      // Moving right: FROM [r,c] TO [r,c+1]
      // The wall between them is the left wall of [r,c+1]
      if (toWalls.left) return false;
    }

    return true;
  }

  // Helper: Check if a position is valid and not visited
  function isValidMove(pos, visited) {
    const [r, c] = pos;
    if (r < 0 || r >= height || c < 0 || c >= width) return false;
    if (numGrid[r][c] === "WALL") return false;
    return !visited.has(`${r},${c}`);
  }

  // Helper: BFS to check if all required numbered cells are reachable
  function canReachAllNumberedCells(currPos, visited, currNum) {
    // Find all numbered cells we still need to visit
    const requiredNumbers = [];
    for (let num = currNum + 1; num <= maxNumber; num++) {
      requiredNumbers.push(num);
    }

    if (requiredNumbers.length === 0) return true;

    // BFS to find reachable cells
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

        // Check walls
        if (!canMoveBetweenCells([r, c], newPos, dr, dc)) continue;

        reachable.add(key);
        queue.push(newPos);
      }
    }

    // Check if all required numbered cells are reachable
    for (const num of requiredNumbers) {
      const [r, c] = numberedCells.get(num);
      if (!reachable.has(`${r},${c}`)) {
        return false;
      }
    }

    return true;
  }

  // Helper: Check if we can still reach enough cells to complete the path
  function hasEnoughReachableCells(currPos, visited, pathLength) {
    const cellsNeeded = validCells - pathLength;
    if (cellsNeeded <= 0) return true;

    // BFS to count reachable unvisited cells
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

        // Check walls
        if (!canMoveBetweenCells([r, c], newPos, dr, dc)) continue;

        reachable.add(key);
        queue.push(newPos);

        // Early exit if we have enough
        if (reachable.size >= cellsNeeded) return true;
      }
    }

    return reachable.size >= cellsNeeded;
  }

  // Helper: Get smart direction ordering based on next target
  function getSmartDirections(currPos, currNum) {
    const directions = [
      [0, -1], // left
      [0, 1], // right
      [1, 0], // down
      [-1, 0], // up
    ];

    // If we have a next number to find, prioritize directions toward it
    if (currNum < maxNumber && numberedCells.has(currNum + 1)) {
      const [targetR, targetC] = numberedCells.get(currNum + 1);
      const [currR, currC] = currPos;

      // Sort directions by Manhattan distance to target
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

    if (attempts % 100000 === 0) {
      console.log(
        `Searching... ${attempts} attempts, pruned: ${pruned}, path: ${currPath.length}/${validCells}`
      );
    }

    // Hard limit to prevent infinite loops
    if (attempts > 2000000) {
      console.error(
        "Exceeded maximum attempts (2M). Puzzle may be too complex or unsolvable."
      );
      return;
    }

    if (currPos[0] === endPos[0] && currPos[1] === endPos[1]) {
      if (currPath.length === validCells) {
        paths.push([...currPath]);
        console.log(
          `Solution found after ${attempts} attempts! (Pruned: ${pruned})`
        );
        return;
      }
    }

    // OPTIMIZATION 1: Check if we can reach all required numbered cells
    if (!canReachAllNumberedCells(currPos, visited, currNum)) {
      pruned++;
      return;
    }

    // OPTIMIZATION 2: Check if we have enough reachable cells
    if (!hasEnoughReachableCells(currPos, visited, currPath.length)) {
      pruned++;
      return;
    }

    // OPTIMIZATION 3: Use smart direction ordering
    const directions = getSmartDirections(currPos, currNum);

    for (const [diffH, diffW] of directions) {
      const newPos = [currPos[0] + diffH, currPos[1] + diffW];
      const posKey = `${newPos[0]},${newPos[1]}`;

      if (visited.has(posKey)) continue;
      if (!isValidMove(newPos, visited)) continue;

      // Check walls
      if (!canMoveBetweenCells(currPos, newPos, diffH, diffW)) {
        continue;
      }

      const cellValue = numGrid[newPos[0]][newPos[1]];

      // Skip walls (blocked cells)
      if (cellValue === "WALL") continue;

      // If cell has a number, we can only visit it if it's the next number
      if (cellValue !== null) {
        if (cellValue === currNum + 1) {
          visited.add(posKey);
          dfsBackTrack(currNum + 1, newPos, [...currPath, newPos], visited);
          visited.delete(posKey);
          if (paths.length > 0) return;
        }
      } else {
        // Empty cell - we can visit it
        visited.add(posKey);
        dfsBackTrack(currNum, newPos, [...currPath, newPos], visited);
        visited.delete(posKey);
        if (paths.length > 0) return;
      }
    }
  }

  // Create initial visited set with start position
  const visited = new Set([`${startPos[0]},${startPos[1]}`]);
  dfsBackTrack(1, startPos, [startPos], visited);

  return paths.length > 0 ? paths[0] : null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solvePuzzle") {
    try {
      playZipPuzzle();
      sendResponse({ success: true, message: "Puzzle solver started!" });
    } catch (error) {
      console.error("Error solving puzzle:", error);
      sendResponse({ success: false, message: error.message });
    }
  }
  return true;
});

console.log("LinkedIn Zip Solver extension loaded!");
