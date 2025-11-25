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

  cells.forEach((cell) => {
    const idx = parseInt(cell.getAttribute("data-cell-idx"));
    const row = Math.floor(idx / width);
    const col = idx % width;

    const contentDiv = cell.querySelector('[data-cell-content="true"]');
    if (contentDiv) {
      const value = contentDiv.textContent.trim();
      grid[row][col] = value;
      maxNumber = Math.max(maxNumber, parseInt(value));
    }
  });

  console.log("Grid extracted:", grid);
  console.log(`Numbers range from 1 to ${maxNumber}`);

  const path = solveZipPuzzle(grid, maxNumber);

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

function solveZipPuzzle(grid, maxNumber) {
  const height = grid.length;
  const width = grid[0].length;
  const numCells = height * width;

  const numGrid = grid.map((row) =>
    row.map((cell) => (cell ? parseInt(cell) : null))
  );

  let startPos = null;
  let endPos = null;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (numGrid[r][c] === 1) startPos = [r, c];
      if (numGrid[r][c] === maxNumber) endPos = [r, c];
    }
  }

  if (!startPos || !endPos) {
    console.error("Could not find start or end position");
    return null;
  }

  console.log(`Start: [${startPos}], End: [${endPos}]`);

  const paths = [];
  let attempts = 0;

  function dfsBackTrack(currNum, currPos, currPath) {
    attempts++;

    if (attempts % 100000 === 0) {
      console.log(`Searching... ${attempts} attempts`);
    }

    if (currPos[0] === endPos[0] && currPos[1] === endPos[1]) {
      if (currPath.length === numCells) {
        paths.push([...currPath]);
        console.log(`Solution found after ${attempts} attempts!`);
        return;
      }
    }

    const directions = [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ];

    for (const [diffH, diffW] of directions) {
      const newPos = [currPos[0] + diffH, currPos[1] + diffW];

      const inPath = currPath.some(
        ([r, c]) => r === newPos[0] && c === newPos[1]
      );
      if (inPath) continue;

      if (
        newPos[0] >= 0 &&
        newPos[0] < height &&
        newPos[1] >= 0 &&
        newPos[1] < width
      ) {
        const cellValue = numGrid[newPos[0]][newPos[1]];

        if (cellValue !== null) {
          if (cellValue === currNum + 1) {
            dfsBackTrack(currNum + 1, newPos, [...currPath, newPos]);
            if (paths.length > 0) return;
          }
        } else {
          dfsBackTrack(currNum, newPos, [...currPath, newPos]);
          if (paths.length > 0) return;
        }
      }
    }
  }

  dfsBackTrack(1, startPos, [startPos]);

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
