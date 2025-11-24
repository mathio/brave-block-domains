// Load saved domains when popup opens
document.addEventListener("DOMContentLoaded", async () => {
  const domainsTextarea = document.getElementById("domains");
  const saveButton = document.getElementById("save");
  const statusDiv = document.getElementById("status");
  const enableToggle = document.getElementById("enableToggle");

  try {
    // Load current blocked domains and enabled state from storage
    const result = await chrome.storage.sync.get({
      blockedDomains: [],
      blockingEnabled: true,
    });
    domainsTextarea.value = result.blockedDomains.join("\n");
    enableToggle.checked = result.blockingEnabled;
  } catch (error) {
    console.error("Failed to load domains:", error);
  }

  // Handle toggle changes
  enableToggle.addEventListener("change", async () => {
    try {
      await chrome.storage.sync.set({ blockingEnabled: enableToggle.checked });
      showStatus(
        enableToggle.checked ? "Blocking enabled" : "Blocking disabled",
        "success"
      );
    } catch (error) {
      console.error("Failed to update toggle:", error);
      showStatus("Failed to update: " + error.message, "error");
    }
  });

  let savedDomainsValue = domainsTextarea.value.trim();
  domainsTextarea.addEventListener("keyup", () => {
    saveButton.disabled = domainsTextarea.value.trim() === savedDomainsValue;
  });

  // Save domains when button is clicked
  saveButton.addEventListener("click", async () => {
    const domainsText = domainsTextarea.value.trim();

    // Parse domains from textarea (one per line)
    const domains = domainsText
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    try {
      // Save to storage
      await chrome.storage.sync.set({ blockedDomains: domains });
      savedDomainsValue = domainsText;
      domainsTextarea.value = domainsText;
      saveButton.disabled = true;
      showStatus("Blocked domains saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save domains:", error);
      showStatus("Failed to save domains: " + error.message, "error");
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = "status " + type;
    setTimeout(() => {
      statusDiv.textContent = "";
      statusDiv.className = "status";
    }, 2000);
  }
});
