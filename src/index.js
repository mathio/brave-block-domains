// Background service worker to block multiple domains

const ALL_RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "other",
];

// Function to update blocking rules
async function updateBlockingRules() {
  try {
    // Get blocked domains and enabled state from storage
    const result = await chrome.storage.sync.get({
      blockedDomains: [],
      blockingEnabled: true,
    });
    const blockedDomains = result.blockedDomains.flatMap((d) => [d, `*.${d}`]);
    const blockingEnabled = result.blockingEnabled;

    // Get all existing rule IDs to remove (up to 1000 rules)
    const ruleIdsToRemove = Array.from({ length: 1000 }, (_, i) => i + 1);

    // If blocking is disabled, just remove all rules
    if (!blockingEnabled) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: [],
      });
      console.log("Domain blocking disabled");
      return;
    }

    // Generate blocking rules from the domains list
    const blockingRules = blockedDomains.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `*://${domain}/*`,
        resourceTypes: ALL_RESOURCE_TYPES,
      },
    }));

    // Update session rules
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: blockingRules,
    });

    console.log(`Domain blocking updated for: ${blockedDomains.join(", ")}`);
  } catch (error) {
    console.error("Failed to update blocking rules:", error);
  }
}

// Initialize blocking on extension startup
updateBlockingRules();

// Listen for storage changes to update rules when user modifies the list or toggle
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName === "sync" &&
    (changes.blockedDomains || changes.blockingEnabled)
  ) {
    console.log("Settings updated, reloading rules...");
    updateBlockingRules();
  }
});
