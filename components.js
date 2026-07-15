/**
 * WyNote PDF Tools - Client-Side Dynamic UI Component Engine
 */
const ComponentBuilder = {
  
  /**
   * Generates a fully functional drag-and-drop landing system for tools.
   */
  createDropZone(callback) {
    const zone = document.createElement("div");
    zone.className = "dropzone-container";
    zone.innerHTML = `
      <div class="dropzone-icon">📥</div>
      <h3>Drag and Drop PDF here</h3>
      <p>Supports PDFs, JPGs, and PNGs up to 100MB</p>
      <button class="btn btn-primary btn-sm">Select Local Files</button>
    `;

    const triggerInput = () => {
      const input = document.getElementById("global-hidden-file-input");
      input.value = "";
      input.onchange = (e) => {
        if (e.target.files.length > 0) callback(Array.from(e.target.files));
      };
      input.click();
    };

    zone.addEventListener("click", triggerInput);
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        callback(Array.from(e.dataTransfer.files));
      }
    });

    return zone;
  },

  /**
   * Installs the interactive PDF Viewer component with a simulation engine.
   */
  createPdfViewer(fileName, pageCount = 5) {
    const container = document.createElement("div");
    container.className = "workspace-preview-row";
    
    let pageHtml = "";
    for (let i = 1; i <= pageCount; i++) {
      pageHtml += `
        <div class="sort-card-frame">
          <div class="sort-thumb">Page ${i}</div>
          <span>Page ${i}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="workspace-item">
        <strong>${fileName}</strong>
        <span>Pages: ${pageCount}</span>
      </div>
      <div class="page-sort-container">
        ${pageHtml}
      </div>
    `;
    return container;
  },

  /**
   * Creates a canvas element for drawing signatures.
   */
  createSignaturePad(onSave) {
    const wrap = document.createElement("div");
    wrap.className = "workspace-preview-row";
    wrap.innerHTML = `
      <h4>Draw your high-fidelity signature</h4>
      <div class="sig-canvas-frame">
        <canvas id="signature-pad" class="signature-canvas"></canvas>
      </div>
      <div style="display:flex; gap:12px; margin-top:12px;">
        <button id="clear-sig" class="btn btn-outline btn-sm">Clear</button>
        <button id="save-sig" class="btn btn-primary btn-sm">Capture Signature</button>
      </div>
    `;

    setTimeout(() => {
      const canvas = wrap.querySelector("#signature-pad");
      const ctx = canvas.getContext("2d");
      
      // Handle high-density screens
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200;

      let drawing = false;
      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
      };

      const startDrawing = (e) => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "#1a73e8";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      };

      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", () => drawing = false);

      canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); });
      canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); });
      canvas.addEventListener("touchend", () => drawing = false);

      wrap.querySelector("#clear-sig").onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
      wrap.querySelector("#save-sig").onclick = () => {
        const dataUrl = canvas.toDataURL();
        onSave(dataUrl);
      };
    }, 100);

    return wrap;
  },

  /**
   * Drag & Drop visual page sorting configuration layout.
   */
  createPageSorter(fileList, onReordered) {
    const container = document.createElement("div");
    container.className = "page-sort-container";
    
    fileList.forEach((file, index) => {
      const card = document.createElement("div");
      card.className = "sort-card-frame";
      card.draggable = true;
      card.dataset.index = index;
      card.innerHTML = `
        <div class="sort-thumb">Page ${index + 1}</div>
        <span>${file.name}</span>
      `;

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index);
        card.style.opacity = "0.5";
      });

      card.addEventListener("dragend", () => {
        card.style.opacity = "1";
      });

      card.addEventListener("dragover", (e) => e.preventDefault());
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const originIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const targetIndex = index;
        if (originIndex !== targetIndex) {
          onReordered(originIndex, targetIndex);
        }
      });

      container.appendChild(card);
    });

    return container;
  }
};
