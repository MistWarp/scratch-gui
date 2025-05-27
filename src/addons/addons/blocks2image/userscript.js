export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  function makeStyle() {
    let style = document.createElement("style");
    style.textContent = `
    .blocklyText {
        fill: ${Blockly.Colours.text};
        font-family: "Helvetica Neue", Helvetica, sans-serif;
        font-size: 12pt;
        font-weight: 500;
    }
    .blocklyNonEditableText>text, .blocklyEditableText>text {
        fill: ${Blockly.Colours.textFieldText};
    }
    .blocklyDropdownText {
        fill: ${Blockly.Colours.text} !important;
    }
    `;
    for (let userstyle of document.querySelectorAll(".scratch-addons-style[data-addons*='editor-theme3']")) {
      if (userstyle.disabled) continue;
      style.textContent += userstyle.textContent;
    }
    return style;
  }

  function setCSSVars(element) {
    for (let property of document.documentElement.style) {
      if (property.startsWith("--editorTheme3-"))
        element.style.setProperty(property, document.documentElement.style.getPropertyValue(property));
    }
  }

  let exSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  exSVG.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");
  exSVG.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  exSVG.setAttribute("version", "1.1");

  addon.tab.createBlockContextMenu(
    (items) => {
      if (addon.self.disabled) return items;
      let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");

      const pasteItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex =
        pasteItemIndex !== -1
          ? // If "paste" button exists, add own items before it
            pasteItemIndex
          : // If there's no such button, insert at end
            items.length;

      items.splice(
        insertBeforeIndex,
        0,
        {
          enabled: !!svgchild?.childNodes?.length,
          text: msg("export_all_to_SVG"),
          callback: () => {
            exportBlock(false);
          },
          separator: true,
        },
        {
          enabled: !!svgchild?.childNodes?.length,
          text: msg("export_all_to_PNG"),
          callback: () => {
            exportBlock(true);
          },
          separator: false,
        }
      );

      return items;
    },
    { workspace: true }
  );
  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
      const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex =
        makeSpaceItemIndex !== -1
          ? // If "make space" button exists, add own items before it
            makeSpaceItemIndex
          : // If there's no such button, insert at end
            items.length;

      items.splice(
        insertBeforeIndex,
        0,
        {
          enabled: true,
          text: msg("export_selected_to_SVG"),
          callback: () => {
            exportBlock(false, block);
          },
          separator: true,
        },
        {
          enabled: true,
          text: msg("export_selected_to_PNG"),
          callback: () => {
            exportBlock(true, block);
          },
          separator: false,
        }
      );

      return items;
    },
    { blocks: true }
  );

  async function exportBlock(isExportPNG, block) {
    let svg;
    if (block) {
      svg = selectedBlocks(isExportPNG, block);
    } else {
      svg = allBlocks(isExportPNG);
    }
    // resolve nbsp whitespace
    svg.querySelectorAll("text").forEach((text) => {
      text.innerHTML = text.innerHTML.replace(/&nbsp;/g, " ");
    });

    // replace external images with data URIs
    await Promise.all(
      Array.from(svg.querySelectorAll("image")).map(async (item) => {
        const iconUrl = item.getAttribute("xlink:href");
        if (iconUrl.startsWith("data:")) return;
        const blob = await (await fetch(iconUrl)).blob();
        const reader = new FileReader();
        const dataUri = await new Promise((resolve) => {
          reader.addEventListener("load", () => resolve(reader.result));
          reader.readAsDataURL(blob);
        });
        item.setAttribute("xlink:href", dataUri);
      })
    );
    if (!isExportPNG) {
      exportData(new XMLSerializer().serializeToString(svg));
    } else {
      exportPNG(svg);
    }
  }

  function selectedBlocks(isExportPNG, block) {
    let svg = exSVG.cloneNode();

    let svgchild = block.svgGroup_;
    svgchild = svgchild.cloneNode(true);
    let dataShapes = svgchild.getAttribute("data-shapes");
    let translateY = 0; // blocks no hat
    const scale = isExportPNG ? 2 : 1;
    if (dataShapes === "c-block c-1 hat") {
      translateY = 20; // for My block
    }
    if (dataShapes === "hat") {
      translateY = 16; // for Events
      if (block.CAT_BLOCKS) {
        translateY += 16; // for cat ears
      }
    }
    svgchild.setAttribute("transform", `translate(0,${scale * translateY}) scale(${scale})`);
    setCSSVars(svg);
    svg.append(makeStyle());
    svg.append(svgchild);
    return svg;
  }

  function allBlocks(isExportPNG) {
    let svg = exSVG.cloneNode();

    let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");
    svgchild = svgchild.cloneNode(true);

    let xArr = [];
    let yArr = [];

    svgchild.childNodes.forEach((g) => {
      let x = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[1] || 0;
      let y = g.getAttribute("transform").match(/translate\((.*?),(.*?)\)/)[2] || 0;
      xArr.push(x * (isExportPNG ? 2 : 1));
      yArr.push(y * (isExportPNG ? 2 : 1));
      g.style.display = ""; // because of TW scratch-blocks changes
    });

    svgchild.setAttribute(
      "transform",
      `translate(${-Math.min(...xArr)},${-Math.min(...yArr) + 18 * (isExportPNG ? 2 : 1)}) ${
        isExportPNG ? "scale(2)" : ""
      }`
    );
    setCSSVars(svg);
    svg.append(makeStyle());
    svg.append(svgchild);
    return svg;
  }

  function exportData(text) {
    const saveLink = document.createElement("a");
    document.body.appendChild(saveLink);

    const data = new Blob([text], { type: "text" });
    const url = window.URL.createObjectURL(data);
    saveLink.href = url;

    // File name: project-DATE-TIME
    const date = new Date();
    const timestamp = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;
    saveLink.download = `block_${timestamp}.svg`;
    saveLink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(saveLink);
  }

  function exportPNG(svg) {
    const serializer = new XMLSerializer();

    // First, ensure the SVG has explicit dimensions
    const svgString = serializer.serializeToString(svg);
    
    // Create a temporary div to accurately measure SVG dimensions
    const measureDiv = document.createElement("div");
    measureDiv.style.position = "absolute";
    measureDiv.style.visibility = "hidden";
    measureDiv.style.pointerEvents = "none";
    measureDiv.innerHTML = svgString;
    document.body.appendChild(measureDiv);
    
    // Get real dimensions from the rendered SVG
    const svgElement = measureDiv.querySelector("svg");
    const svgBounds = measureDiv.querySelector("svg g").getBoundingClientRect();
    
    // Set explicit dimensions on original SVG
    svg.setAttribute("width", `${svgBounds.width}px`);
    svg.setAttribute("height", `${svgBounds.height}px`);
    svg.setAttribute("viewBox", `0 0 ${svgBounds.width} ${svgBounds.height}`);
    
    // Update the serialized string with proper dimensions
    const updatedSvgString = serializer.serializeToString(svg);
    
    // Clean up measurement div
    document.body.removeChild(measureDiv);
    
    // Now create the iframe for further processing
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.append(iframe);
    iframe.contentDocument.write(updatedSvgString);
    
    try {
      // Double-check dimensions from the iframe as a backup
      const iframeSvg = iframe.contentDocument.body.querySelector("svg");
      if (!iframeSvg) {
        throw new Error("SVG not found in iframe");
      }
      
      // Create the canvas with explicit dimensions from our SVG
      const width = parseFloat(svg.getAttribute("width"));
      const height = parseFloat(svg.getAttribute("height"));
      
      if (isNaN(width) || isNaN(height) || width === 0 || height === 0) {
        throw new Error("Invalid SVG dimensions: " + width + "x" + height);
      }
      
      // Check if dimensions are too large for canvas
      const MAX_CANVAS_DIMENSION = 16384; // Most browsers limit canvas to 16384 pixels
      let scaleFactor = 2; // Default scale factor for high quality
      
      // Calculate appropriate scale to fit within maximum dimensions
      if (width * scaleFactor > MAX_CANVAS_DIMENSION || height * scaleFactor > MAX_CANVAS_DIMENSION) {
        const widthRatio = MAX_CANVAS_DIMENSION / width;
        const heightRatio = MAX_CANVAS_DIMENSION / height;
        scaleFactor = Math.min(widthRatio, heightRatio, 1); // Never scale up, only down
        console.log("Scaling image down to fit canvas limits. Scale factor:", scaleFactor);
      }
      
      const canvas = document.createElement("canvas");
      // Set canvas dimensions with appropriate scaling
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;
      const ctx = canvas.getContext("2d");
      
      // If using a scale factor other than 1, we need to scale the context
      if (scaleFactor !== 1) {
        ctx.scale(scaleFactor, scaleFactor);
      }

      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      
      // Create a proper SVG string with XML declaration
      const processedSVG = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${updatedSvgString}`;
      
      // Create blob with proper MIME type
      const blob = new Blob([processedSVG], { type: 'image/svg+xml' });
      const blobURL = URL.createObjectURL(blob);
      
      console.log("SVG dimensions for export:", width, "x", height);
      console.log("Canvas dimensions for export:", canvas.width, "x", canvas.height);
      
      // Handle errors during image loading
      img.onerror = function(e) {
        console.error("Error loading image:", e);
        iframe.remove();
        URL.revokeObjectURL(blobURL);
        
        // Provide helpful message for very large images
        if (width > 10000 || height > 10000) {
          alert("The block stack is too large to export as a PNG image. Try exporting a smaller portion of your blocks or use SVG format instead.");
        } else {
          alert("Failed to export block stack. The image failed to load.");
        }
      };

      // Set the source after setting up handlers
      img.onload = function () {
        try {
          // Draw at original scale (the context is already scaled)
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to PNG with explicit quality
          let dataURL;
          try {
            dataURL = canvas.toDataURL("image/png", 1.0);
          } catch (canvasError) {
            console.error("Canvas toDataURL error:", canvasError);
            throw new Error("The image is too large to process. Browser cannot create PNG from canvas.");
          }
          
          // Verify data isn't empty
          if (dataURL === 'data:,' || dataURL === 'data:image/png;base64,') {
            throw new Error('Generated image is empty. This typically happens with very large images.');
          }
          
          // Download the image
          const link = document.createElement("a");
          const date = new Date();
          const timestamp = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;
          link.download = `block_${timestamp}.png`;
          link.href = dataURL;
          link.click();
          
          console.log("Export successful!");
        } catch (err) {
          console.error("Error generating PNG:", err);
          console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
          console.log("Image dimensions:", img.width, "x", img.height);
          console.log("SVG dimensions:", svg.getAttribute("width"), "x", svg.getAttribute("height"));
          
          // Provide more helpful error message
          if (err.message.includes("too large") || canvas.width > 16384 || canvas.height > 16384) {
            alert("Your block stack is too large to export as a PNG. Try exporting a smaller portion of blocks, or use SVG format instead.");
          } else {
            alert("Failed to export image. Error: " + err.message);
          }
        } finally {
          iframe.remove();
          URL.revokeObjectURL(blobURL);
        }
      };
      
      // Start loading the image
      img.src = blobURL;
    } catch (err) {
      console.error("Error preparing SVG for export:", err);
      if (iframe) iframe.remove();
      if (measureDiv && measureDiv.parentNode) document.body.removeChild(measureDiv);
      alert("Failed to prepare the SVG for export: " + err.message);
    }
  }
}
