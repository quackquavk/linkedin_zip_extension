# LinkedIn Zip Solver Chrome Extension

A Chrome extension that automatically solves LinkedIn Zip puzzles using an intelligent DFS backtracking algorithm.

## Features

- 🧩 **Automatic Puzzle Detection** - Detects grid size and extracts puzzle state
- ⚡ **Fast Solver** - Uses depth-first search with backtracking to find solutions
- 🎯 **Reliable Clicking** - Multiple event types ensure compatibility
- 🎨 **Modern UI** - Clean, LinkedIn-inspired popup interface
- 📊 **Debug Logging** - Console output for troubleshooting

## Installation

### From Source (Developer Mode)

1. **Download or Clone** this repository to your local machine

2. **Open Chrome Extensions Page**

   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**

   - Click "Load unpacked"
   - Select the `linkedin_zip_extension` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "LinkedIn Zip Solver" and click the pin icon

## Usage

1. **Navigate to LinkedIn Zip**

   - Go to [LinkedIn Games](https://www.linkedin.com/games/)
   - Click on the "Zip" puzzle

2. **Open the Extension**

   - Click the LinkedIn Zip Solver icon in your Chrome toolbar
   - Or use the keyboard shortcut (if configured)

3. **Solve the Puzzle**
   - Click the "Solve Puzzle" button in the popup
   - Watch as the extension automatically solves the puzzle!
   - Check the browser console (F12) for detailed logs

## How It Works

### Grid Detection

The extension scans the page for cells with `data-cell-idx` attributes and extracts:

- Grid dimensions (height × width)
- Cell values (numbers 1 through N)
- Empty cells

### Puzzle Solving Algorithm

Uses a **depth-first search (DFS) with backtracking** to find a valid path:

1. Start at cell containing "1"
2. Move to adjacent cells (up, down, left, right)
3. Visit numbered cells in sequential order (1 → 2 → 3 → ...)
4. Fill all empty cells while maintaining the number sequence
5. End at the highest numbered cell

### Automated Clicking

Simulates multiple event types for maximum compatibility:

- `MouseEvent` (mousedown, mouseup, click)
- `PointerEvent` (pointerdown, pointerup)
- `TouchEvent` (touchstart, touchend)

Each cell is clicked with a 50ms delay for reliability.

## Troubleshooting

### Extension Not Working?

**Check the Console**

- Press `F12` to open DevTools
- Look for error messages or logs from the extension

**Verify You're on the Right Page**

- The extension only works on `linkedin.com` pages
- Make sure you're on an active Zip puzzle

**Reload the Extension**

- Go to `chrome://extensions/`
- Click the refresh icon on the LinkedIn Zip Solver card

**Reload the Page**

- Refresh the LinkedIn Zip puzzle page
- Try clicking "Solve Puzzle" again

### No Solution Found?

Some puzzles may be unsolvable or have complex constraints. Check the console for:

- "No solution found!" - The puzzle may be impossible
- Grid detection errors - The page structure may have changed

## Development

### File Structure

```
linkedin_zip_extension/
├── manifest.json       # Extension configuration
├── content.js          # Puzzle solver logic
├── popup.html          # Extension popup UI
├── popup.js            # Popup interaction handler
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Permissions

- `activeTab` - Access the current tab to inject the solver
- `scripting` - Execute the content script on LinkedIn pages

### Modifying the Solver

Edit `content.js` to adjust:

- **Click delay**: Change `clickDelay` (default: 50ms)
- **Grid sizes**: Modify `possibleSizes` array
- **Algorithm**: Update `solveZipPuzzle()` function

## License

MIT License - Feel free to use and modify!

## Contributing

Found a bug or have a feature request? Please open an issue or submit a pull request!

---

**Note**: This extension is not affiliated with or endorsed by LinkedIn. Use responsibly and for educational purposes.
