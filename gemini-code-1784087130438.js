/**
 * WyNote PDF Tools - Application Controller & State Orchestrator
 */
class AppManager {
  constructor() {
    this.currentView = "dashboard";
    this.activeTool = null;
    this.currentFolderId = "root";
    this.adQuotaTimer = 0;
    this.initEventListeners();
    this.renderDashboardTools();
    this.renderVFS();
  }

  initEventListeners() {
    // Top-bar buttons
    document.getElementById("menu-toggle-btn").onclick = () => {
      document.getElementById("app-drawer").classList.toggle("open");
    };
    
    document.getElementById("btn-create-folder").onclick = () => this.handleCreateFolder();

    // Routing navigation triggers (Sidebar & Bottom Navigation)
    const navs = document.querySelectorAll(".nav-item, .bottom-nav-item");
    navs.forEach(btn => {
      btn.onclick = () => {
        navs.forEach(b => b.classList.remove("active"));
        const target = btn.getAttribute("data-target");
        
        // Match active classes on both sidebar elements and bottom bars
        document.querySelectorAll(`[data-target="${target}"]`).forEach(b => b.classList.add("active"));
        this.switchView(target);
      };
    });

    // Tool navigation actions
    document.getElementById("tool-back-btn").onclick = () => {
      this.switchView("dashboard");
    };

    // Global Search index handler
    document.getElementById("global-search").oninput = (e) => {
      this.performGlobalSearch(e.target.value.toLowerCase());
    };

    // Global Floating Action Button Quick Upload configuration
    document.getElementById("global-fab").onclick = () => {
      this.toast("Drop or select a file to execute a secure action.", "info");
      document.getElementById("global-hidden-file-input").click();
    };
  }

  switchView(viewId) {
    this.currentView = viewId;
    const views = document.querySelectorAll(".workspace-view");
    views.forEach(v => v.classList.add("hidden"));
    
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.remove("hidden");

    if (viewId === "files") {
      this.renderVFS();
    } else if (viewId === "favorites") {
      this.renderFavorites();
    } else if (viewId === "recent") {
      this.renderRecentActivities();
    }
  }

  renderDashboardTools() {
    const grid = document.getElementById("tools-grid");
    grid.innerHTML = "";

    const tools = [
      { id: "merge", title: "Merge PDF", cat: "edit", desc: "Combine multiple PDF documents into a single file.", color: "#1a73e8" },
      { id: "split", title: "Split PDF", cat: "edit", desc: "Divide complex files into separated pages.", color: "#8e24aa" },
      { id: "compress", title: "Compress PDF", cat: "edit", desc: "Reduce document storage footprint locally.", color: "#d93025" },
      { id: "rotate", title: "Rotate PDF", cat: "edit", desc: "Turn or adjust page orientations.", color: "#ff8f00" },
      { id: "watermark", title: "Add Watermark", cat: "edit", desc: "Overlay text or graphics for identity validation.", color: "#1e8e3e" },
      { id: "image2pdf", title: "Image to PDF", cat: "convert", desc: "Construct a document from photos.", color: "#00acc1" },
      { id: "pdf2image", title: "PDF to Image", cat: "convert", desc: "Deconstruct pages into independent JPGs.", color: "#f4511e" },
      { id: "encrypt", title: "Encrypt PDF", cat: "security", desc: "Lock files with security credentials.", color: "#e53935" },
      { id: "sign", title: "Sign PDF", cat: "signing", desc: "Write or draw authentic user signatures.", color: "#43a047" }
    ];

    tools.forEach(tool => {
      const card = document.createElement("div");
      card.className = "tool-card";
      card.onclick = () => this.launchTool(tool);

      const isStarred = (db.get("favorites") || []).includes(tool.id);

      card.innerHTML = `
        <button class="icon-btn tool-star-btn ${isStarred ? "active" : ""}" data-id="${tool.id}">
          <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </button>
        <div class="tool-icon-box" style="background-color: ${tool.color}22; color: ${tool.color};">
          📄
        </div>
        <div class="tool-title">${tool.title}</div>
        <div class="tool-description">${tool.desc}</div>
      `;

      card.querySelector(".tool-star-btn").onclick = (e) => {
        e.stopPropagation();
        const state = db.toggleFavorite(tool.id);
        e.currentTarget.classList.toggle("active", state);
        this.toast(`${tool.title} ${state ? "starred" : "removed from favorites"}.`, "success");
      };

      grid.appendChild(card);
    });
  }

  launchTool(tool) {
    this.activeTool = tool;
    this.switchView("tool-workspace");
    document.getElementById("workspace-tool-title").innerText = tool.title;
    
    const viewport = document.getElementById("tool-run-viewport");
    viewport.innerHTML = "";

    // Build functional UI context based on tool selection
    const zone = ComponentBuilder.createDropZone((files) => {
      this.handleSelectedFilesForTool(files, tool);
    });
    viewport.appendChild(zone);
  }

  handleSelectedFilesForTool(files, tool) {
    const viewport = document.getElementById("tool-run-viewport");
    viewport.innerHTML = "";

    this.toast(`Processing ${files.length} file(s) locally...`, "info");

    if (tool.id === "sign") {
      const viewer = ComponentBuilder.createPdfViewer(files[0].name, 2);
      viewport.appendChild(viewer);
      
      const sigPad = ComponentBuilder.createSignaturePad((dataUrl) => {
        this.executeOperationSimulation(tool.title, files, dataUrl);
      });
      viewport.appendChild(sigPad);
    } else if (tool.id === "merge") {
      let activeFileList = [...files];
      const reRenderSorter = () => {
        viewport.innerHTML = "<h4>Rearrange items for compilation</h4>";
        const sorter = ComponentBuilder.createPageSorter(activeFileList, (from, to) => {
          const item = activeFileList.splice(from, 1)[0];
          activeFileList.splice(to, 0, item);
          reRenderSorter();
        });
        viewport.appendChild(sorter);

        const execBtn = document.createElement("button");
        execBtn.className = "btn btn-primary";
        execBtn.style.marginTop = "24px";
        execBtn.innerText = "Compile and Merge Files";
        execBtn.onclick = () => this.executeOperationSimulation(tool.title, activeFileList);
        viewport.appendChild(execBtn);
      };
      reRenderSorter();
    } else {
      // General dynamic simulator configuration
      const viewer = ComponentBuilder.createPdfViewer(files[0].name, 4);
      viewport.appendChild(viewer);

      const runBtn = document.createElement("button");
      runBtn.className = "btn btn-primary";
      runBtn.style.marginTop = "16px";
      runBtn.innerText = `Run ${tool.title}`;
      runBtn.onclick = () => this.executeOperationSimulation(tool.title, files);
      viewport.appendChild(runBtn);
    }
  }

  executeOperationSimulation(title, files, metadata = null) {
    this.toast("Assembling document structures and executing client scripts...", "info");
    
    // Simulate real local asynchronous execution
    setTimeout(() => {
      const generatedName = `WyNote_${title.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
      db.addFile({
        name: generatedName,
        size: Math.floor(Math.random() * 800000) + 150000,
        pageCount: files.length || 3,
        content: metadata || "base64_simulated_pdf_binary_stream"
      });

      this.toast(`Success! "${generatedName}" has been built.`, "success");
      this.triggerAdAndCallback(() => {
        this.switchView("files");
      });
    }, 1500);
  }

  triggerAdAndCallback(onComplete) {
    // Show interstitial simulated post-processing ad
    const adModal = document.getElementById("processing-ad-modal");
    adModal.classList.remove("hidden");
    
    let time = 3;
    const counter = document.getElementById("ad-countdown-sec");
    counter.innerText = time;

    const interval = setInterval(() => {
      time--;
      counter.innerText = time;
      if (time <= 0) {
        clearInterval(interval);
        adModal.classList.add("hidden");
        onComplete();
      }
    }, 1000);
  }

  renderVFS() {
    const grid = document.getElementById("file-grid");
    const emptyState = document.getElementById("file-manager-empty");
    grid.innerHTML = "";

    const vfs = db.getVFS();
    const currentFolders = vfs.folders.filter(f => f.parentId === this.currentFolderId);
    const currentFiles = vfs.files.filter(f => f.parentId === this.currentFolderId);

    // Calculate dynamic storage metrics
    let totalSize = vfs.files.reduce((acc, f) => acc + f.size, 0);
    document.getElementById("storage-usage-text").innerText = `${(totalSize / 1024).toFixed(2)} KB`;

    if (currentFolders.length === 0 && currentFiles.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    // Render Folders
    currentFolders.forEach(folder => {
      const el = document.createElement("div");
      el.className = "file-card";
      el.innerHTML = `
        <div class="file-card-icon">📁</div>
        <div class="file-card-title">${folder.name}</div>
        <div class="file-card-meta">Folder</div>
      `;
      el.onclick = () => {
        this.currentFolderId = folder.id;
        this.updateBreadcrumbs();
        this.renderVFS();
      };
      grid.appendChild(el);
    });

    // Render Files
    currentFiles.forEach(file => {
      const el = document.createElement("div");
      el.className = "file-card";
      el.innerHTML = `
        <div class="file-card-icon">📄</div>
        <div class="file-card-title">${file.name}</div>
        <div class="file-card-meta">${(file.size / 1024).toFixed(1)} KB | ${file.pageCount} p</div>
        <button class="btn btn-text btn-sm text-danger file-delete-btn" style="position:absolute; bottom:4px;">Delete</button>
      `;
      el.querySelector(".file-delete-btn").onclick = (e) => {
        e.stopPropagation();
        db.deleteFile(file.id);
        this.toast("File removed from local workspace.", "success");
        this.renderVFS();
      };
      grid.appendChild(el);
    });
  }

  updateBreadcrumbs() {
    const container = document.getElementById("file-breadcrumbs");
    container.innerHTML = "";
    
    const rootItem = document.createElement("span");
    rootItem.className = "breadcrumb-item";
    rootItem.innerText = "Root";
    rootItem.onclick = () => {
      this.currentFolderId = "root";
      this.updateBreadcrumbs();
      this.renderVFS();
    };
    container.appendChild(rootItem);

    if (this.currentFolderId !== "root") {
      const vfs = db.getVFS();
      const folder = vfs.folders.find(f => f.id === this.currentFolderId);
      if (folder) {
        const next = document.createElement("span");
        next.className = "breadcrumb-item";
        next.innerText = ` > ${folder.name}`;
        container.appendChild(next);
      }
    }
  }

  handleCreateFolder() {
    const name = prompt("Enter folder name:");
    if (name && name.trim()) {
      db.addFolder(name.trim(), this.currentFolderId);
      this.toast("New folder constructed successfully.", "success");
      this.renderVFS();
    }
  }

  renderFavorites() {
    const toolsGrid = document.getElementById("favorites-tools-grid");
    const emptyState = document.getElementById("favorites-empty");
    toolsGrid.innerHTML = "";

    const favorites = db.get("favorites") || [];
    if (favorites.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    // Display only tools or elements flagged in preferences array
    this.renderDashboardTools();
  }

  renderRecentActivities() {
    const list = document.getElementById("recent-list");
    const empty = document.getElementById("recents-empty");
    list.innerHTML = "";

    const history = db.get("history") || [];
    if (history.length === 0) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    history.forEach(item => {
      const el = document.createElement("div");
      el.className = "workspace-item";
      el.innerHTML = `
        <div>
          <strong>${item.action}</strong>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${new Date(item.timestamp).toLocaleString()}</div>
        </div>
      `;
      list.appendChild(el);
    });
  }

  performGlobalSearch(query) {
    if (!query) {
      this.renderDashboardTools();
      return;
    }
    const cards = document.querySelectorAll("#tools-grid .tool-card");
    cards.forEach(card => {
      const text = card.querySelector(".tool-title").innerText.toLowerCase();
      card.style.display = text.includes(query) ? "flex" : "none";
    });
  }

  toast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerText = message;
    container.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 3000);
  }
}

const manager = new AppManager();