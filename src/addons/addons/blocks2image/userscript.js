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
    // Early memory check for PNG exports
    if (isExportPNG) {
      try {
        // Test if we can create a small canvas to check browser memory state
        const testCanvas = document.createElement("canvas");
        testCanvas.width = 100;
        testCanvas.height = 100;
        const testCtx = testCanvas.getContext("2d");
        testCanvas.width = 0; // Clean up immediately
      } catch (error) {
        alert("Browser is low on memory. Try closing other tabs or refreshing the page before exporting to PNG.");
        return;
      }
    }
    
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

    // replace external images with data URIs (with intelligent caching)
    const imageElements = Array.from(svg.querySelectorAll("image"));
    console.log(`Processing ${imageElements.length} images for export...`);
    
    // Create a cache for already processed images
    const imageCache = new Map();
    let cacheHits = 0;
    let uniqueImages = 0;
    
    // Group images by URL to see what we're dealing with
    const urlCounts = new Map();
    imageElements.forEach(item => {
      const url = item.getAttribute("xlink:href");
      if (!url.startsWith("data:")) {
        urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
      }
    });
    
    console.log(`Found ${urlCounts.size} unique image URLs among ${imageElements.length} total images`);
    if (urlCounts.size < imageElements.length / 2) {
      console.log("Many duplicate images detected - caching will significantly speed up processing");
    }
    
    // Process images with caching
    for (let i = 0; i < imageElements.length; i++) {
      const item = imageElements[i];
      const iconUrl = item.getAttribute("xlink:href");
      
      if (iconUrl.startsWith("data:")) continue;
      
      // Check cache first
      if (imageCache.has(iconUrl)) {
        item.setAttribute("xlink:href", imageCache.get(iconUrl));
        cacheHits++;
        
        // Log progress less frequently for cache hits
        if (i % 100 === 0) {
          console.log(`Processing image ${i + 1}/${imageElements.length}: ${iconUrl} (cached)`);
        }
        continue;
      }
      
      try {
        console.log(`Processing image ${i + 1}/${imageElements.length}: ${iconUrl} (fetching...)`);
        uniqueImages++;
        
        // Add timeout and error handling for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(iconUrl, { 
          signal: controller.signal,
          cache: 'force-cache' // Use cached version if available
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Check blob size to prevent memory issues
        if (blob.size > 1024 * 1024) { // 1MB limit per image
          console.warn(`Skipping large image (${(blob.size / 1024 / 1024).toFixed(1)}MB): ${iconUrl}`);
          continue;
        }
        
        const reader = new FileReader();
        const dataUri = await new Promise((resolve, reject) => {
          reader.addEventListener("load", () => resolve(reader.result));
          reader.addEventListener("error", reject);
          reader.readAsDataURL(blob);
        });
        
        // Cache the result for future use
        imageCache.set(iconUrl, dataUri);
        item.setAttribute("xlink:href", dataUri);
        
        // Small delay to allow garbage collection, but only for actual fetches
        if (uniqueImages % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
      } catch (error) {
        console.warn(`Failed to process image ${iconUrl}:`, error.message);
        
        // If it's a resource error, we might be running out of memory
        if (error.message.includes("INSUFFICIENT_RESOURCES") || error.name === "AbortError") {
          console.warn("Stopping image processing due to resource constraints");
          break;
        }
        
        // For other errors, just skip this image and continue
        continue;
      }
    }
    
    console.log(`Image processing complete! Fetched ${uniqueImages} unique images, used cache for ${cacheHits} duplicates`);
    console.log(`Cache efficiency: ${cacheHits > 0 ? ((cacheHits / (uniqueImages + cacheHits)) * 100).toFixed(1) : 0}% cache hit rate`);
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
      
      // Early check for potentially problematic dimensions
      if (width > 8000 || height > 8000) {
        const userConfirm = confirm(
          `This block stack is very large (${Math.round(width)}×${Math.round(height)} pixels). ` +
          "Exporting as PNG may use a lot of memory and could crash your browser. " +
          "Consider exporting as SVG instead, or click OK to continue with PNG export."
        );
        if (!userConfirm) {
          iframe.remove();
          return;
        }
      }
      
      // Check if dimensions are too large for canvas and memory
      const MAX_CANVAS_DIMENSION = 8192; // Reduced from 16384 for better memory usage
      const MAX_CANVAS_AREA = 16777216; // 16 megapixels max (4096x4096)
      
      // Start with a more conservative scale factor for large images
      let scaleFactor = 1; // Start with 1:1 scale instead of 2x
      
      // Only scale up for small images
      if (width < 1000 && height < 1000) {
        scaleFactor = 2; // High quality for small images
      } else if (width < 2000 && height < 2000) {
        scaleFactor = 1.5; // Medium quality for medium images
      }
      
      // Calculate the area with the proposed scale factor
      const proposedArea = (width * scaleFactor) * (height * scaleFactor);
      
      // If the area would be too large, reduce scale factor
      if (proposedArea > MAX_CANVAS_AREA) {
        scaleFactor = Math.sqrt(MAX_CANVAS_AREA / (width * height));
        console.log("Reducing scale factor due to memory constraints. New scale factor:", scaleFactor.toFixed(2));
      }
      
      // Ensure we don't exceed dimension limits
      if (width * scaleFactor > MAX_CANVAS_DIMENSION || height * scaleFactor > MAX_CANVAS_DIMENSION) {
        const widthRatio = MAX_CANVAS_DIMENSION / width;
        const heightRatio = MAX_CANVAS_DIMENSION / height;
        scaleFactor = Math.min(widthRatio, heightRatio, scaleFactor);
        console.log("Scaling image down to fit canvas dimension limits. Scale factor:", scaleFactor.toFixed(2));
      }
      
      // Warn user if we had to scale down significantly
      if (scaleFactor < 0.5) {
        console.warn("Large image detected - scaling down significantly to prevent memory issues");
      }
      
      // Function to estimate memory usage and create canvas with progressive scaling
      function createCanvasWithMemoryCheck(targetWidth, targetHeight, initialScale) {
        let currentScale = initialScale;
        let canvas, ctx;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          try {
            const canvasWidth = Math.floor(targetWidth * currentScale);
            const canvasHeight = Math.floor(targetHeight * currentScale);
            
            // Estimate memory usage (4 bytes per pixel for RGBA)
            const estimatedMemoryMB = (canvasWidth * canvasHeight * 4) / (1024 * 1024);
            console.log(`Attempt ${attempts + 1}: Canvas ${canvasWidth}×${canvasHeight}, estimated memory: ${estimatedMemoryMB.toFixed(1)}MB, scale: ${currentScale.toFixed(2)}`);
            
            // Try to create the canvas
            canvas = document.createElement("canvas");
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // Test if we can get a context (this might fail for very large canvases)
            ctx = canvas.getContext("2d");
            if (!ctx) {
              throw new Error("Failed to get 2D context");
            }
            
            // Test if we can actually use the canvas by trying to create image data
            const testData = ctx.createImageData(Math.min(100, canvasWidth), Math.min(100, canvasHeight));
            if (!testData) {
              throw new Error("Failed to create image data");
            }
            
            console.log(`Successfully created canvas with scale factor: ${currentScale.toFixed(2)}`);
            break;
            
          } catch (error) {
            console.warn(`Canvas creation failed at scale ${currentScale.toFixed(2)}:`, error.message);
            
            // Clean up failed canvas
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
              ctx = null;
            }
            
            // Reduce scale factor by 25% for next attempt
            currentScale *= 0.75;
            attempts++;
            
            // If scale gets too small, give up
            if (currentScale < 0.1) {
              throw new Error("Image too large to export even at minimum scale");
            }
          }
        }
        
        if (!canvas || !ctx) {
          throw new Error("Failed to create canvas after multiple attempts");
        }
        
        return { canvas, ctx, finalScale: currentScale };
      }
      
      // Create canvas with progressive scaling
      const canvasResult = createCanvasWithMemoryCheck(width, height, scaleFactor);
      const canvas = canvasResult.canvas;
      const ctx = canvasResult.ctx;
      const finalScale = canvasResult.finalScale;
      
      // If using a scale factor other than 1, we need to scale the context
      if (finalScale !== 1) {
        ctx.scale(finalScale, finalScale);
      }
      
      // Inform user if we had to scale down significantly
      if (finalScale < scaleFactor * 0.8) {
        console.log(`Automatically reduced scale to ${finalScale.toFixed(2)} to prevent memory issues`);
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
        if (width > 5000 || height > 5000) {
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
          
          // Convert to PNG with explicit quality, with memory error handling
          let dataURL;
          try {
            dataURL = canvas.toDataURL("image/png", 1.0);
          } catch (canvasError) {
            console.error("Canvas toDataURL error:", canvasError);
            
            // Try again with lower quality if memory is the issue
            if (canvasError.message.includes("memory") || canvasError.message.includes("too large")) {
              console.log("Trying lower quality PNG export...");
              try {
                dataURL = canvas.toDataURL("image/png", 0.8);
              } catch (secondError) {
                console.log("Trying JPEG fallback...");
                dataURL = canvas.toDataURL("image/jpeg", 0.9);
              }
            } else {
              throw new Error("The image is too large to process. Browser cannot create PNG from canvas.");
            }
          }
          
          // Verify data isn't empty
          if (dataURL === 'data:,' || dataURL === 'data:image/png;base64,') {
            throw new Error('Generated image is empty. This typically happens with very large images.');
          }
          
          // Download the image
          const link = document.createElement("a");
          const date = new Date();
          const timestamp = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;
          
          // Adjust filename based on format used
          const isJPEG = dataURL.startsWith("data:image/jpeg");
          const fileExtension = isJPEG ? "jpg" : "png";
          link.download = `block_${timestamp}.${fileExtension}`;
          link.href = dataURL;
          link.click();
          
          // Log success with details
          if (finalScale < scaleFactor * 0.9) {
            console.log(`Export successful! Image was automatically scaled to ${(finalScale / scaleFactor * 100).toFixed(0)}% to prevent memory issues.`);
          } else {
            console.log("Export successful!");
          }
        } catch (err) {
          console.error("Error generating PNG:", err);
          console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
          console.log("Image dimensions:", img.width, "x", img.height);
          console.log("SVG dimensions:", svg.getAttribute("width"), "x", svg.getAttribute("height"));
          
          // Provide more helpful error message
          if (err.message.includes("too large") || canvas.width > 8192 || canvas.height > 8192) {
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
