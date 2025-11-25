// Popup script for LinkedIn Zip Solver

document.addEventListener("DOMContentLoaded", () => {
  const solveBtn = document.getElementById("solveBtn");
  const statusDiv = document.getElementById("status");

  solveBtn.addEventListener("click", async () => {
    // Disable button during execution
    solveBtn.disabled = true;
    solveBtn.textContent = "Solving...";

    // Show status
    statusDiv.style.display = "flex";
    statusDiv.className = "status";
    statusDiv.textContent = "Analyzing puzzle...";

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if we're on LinkedIn
      if (!tab.url.includes("linkedin.com")) {
        throw new Error("Please navigate to a LinkedIn Zip puzzle page first!");
      }

      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: "solvePuzzle" }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus("error", "Error: " + chrome.runtime.lastError.message);
          resetButton();
          return;
        }

        if (response && response.success) {
          showStatus("success", "✓ Puzzle solver started! Check the page.");
          setTimeout(() => {
            resetButton();
          }, 3000);
        } else {
          showStatus(
            "error",
            "Error: " + (response?.message || "Unknown error")
          );
          resetButton();
        }
      });
    } catch (error) {
      showStatus("error", error.message);
      resetButton();
    }
  });

  function showStatus(type, message) {
    statusDiv.style.display = "flex";
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
  }

  function resetButton() {
    solveBtn.disabled = false;
    solveBtn.textContent = "Solve Puzzle";
  }
});
