export default async function ({ addon }) {
  // Function to update icon spacing and scale based on the settings
  function updateIconProperties() {
    const spacingPercent = addon.settings.get("iconSpacing"); // 10-200%
    const scalePercent = addon.settings.get("iconScale"); // 50-300%
    
    // Convert percentages to actual values
    // Base spacing (0.5rem = 100%, so 50% = 0.25rem)
    const spacing = (spacingPercent / 100) * 0.5; // rem
    // Base scale (2.5rem = 100%, so 250% = 6.25rem)
    const scale = (scalePercent / 100) * 2.5; // rem
    
    // Remove any existing custom style
    const existingStyle = document.getElementById("no-category-text-dynamic");
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create a new style element with the custom properties
    const style = document.createElement("style");
    style.id = "no-category-text-dynamic";
    style.textContent = `
      .scratchCategoryMenuItem {
        padding: ${spacing}rem 0 !important;
        min-height: ${scale + spacing * 2}rem;
      }
      
      .scratchCategoryMenuHorizontal .scratchCategoryMenuItem {
        padding: ${spacing}rem !important;
        min-width: ${scale + spacing * 2}rem;
      }
      
      .scratchCategoryItemBubble,
      .scratchCategoryItemIcon {
        width: ${scale}rem !important;
        height: ${scale}rem !important;
        margin: ${spacing}rem auto !important;
      }
      
      .scratchCategoryMenuHorizontal .scratchCategoryItemBubble,
      .scratchCategoryMenuHorizontal .scratchCategoryItemIcon {
        width: ${scale * 0.8}rem !important;
        height: ${scale * 0.8}rem !important;
        margin: 0 auto !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Apply properties on initial load
  updateIconProperties();
  
  // Listen for setting changes
  addon.settings.addEventListener("change", updateIconProperties);
  
  // Clean up when addon is disabled
  addon.self.addEventListener("disabled", () => {
    const existingStyle = document.getElementById("no-category-text-dynamic");
    if (existingStyle) {
      existingStyle.remove();
    }
  });
  
  // Reapply when addon is re-enabled
  addon.self.addEventListener("reenabled", updateIconProperties);
}
