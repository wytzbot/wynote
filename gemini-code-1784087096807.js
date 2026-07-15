/**
 * WyNote PDF Tools - Core Workspace Data Engine
 */
const DB_VERSION = 2;
const STORAGE_PREFIX = "wynote_pdf_";

const DefaultPreferences = {
  theme: "light",
  accent: "blue",
  fontSize: "medium",
  autosaveInterval: 30,
  notificationsEnabled: true,
  offlineSync: true
};

class DataEngine {
  constructor() {
    this.localStorageAvailable = this._checkStorage();
    this.memoryState = {};
    this.init();
  }

  _checkStorage() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  init() {
    if (!this.get("preferences")) {
      this.set("preferences", DefaultPreferences);
    }
    if (!this.get("favorites")) {
      this.set("favorites", []);
    }
    if (!this.get("history")) {
      this.set("history", []);
    }
    if (!this.get("vfs")) {
      // Setup virtual file system with pre-populated root structure
      const initialVFS = {
        folders: [
          { id: "f-work", parentId: "root", name: "Work Projects", created: Date.now() },
          { id: "f-signatures", parentId: "root", name: "My Signatures", created: Date.now() }
        ],
        files: [
          { id: "doc-1", parentId: "root", name: "Annual_Report_Draft.pdf", size: 458920, pageCount: 18, folderId: "f-work", created: Date.now() - 3600000, content: "base64..." },
          { id: "doc-2", parentId: "root", name: "Signed_Contract.pdf", size: 120530, pageCount: 3, folderId: "root", created: Date.now(), content: "base64..." }
        ]
      };
      this.set("vfs", initialVFS);
    }
  }

  get(key) {
    if (this.localStorageAvailable) {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return data;
      }
    }
    return this.memoryState[key] || null;
  }

  set(key, val) {
    if (this.localStorageAvailable) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } else {
      this.memoryState[key] = val;
    }
    // Fire local system updates
    window.dispatchEvent(new CustomEvent("wynote-data-changed", { detail: { key, val } }));
  }

  // Virtual File System manipulation APIs
  getVFS() {
    return this.get("vfs");
  }

  saveVFS(vfs) {
    this.set("vfs", vfs);
  }

  addFolder(name, parentId = "root") {
    const vfs = this.getVFS();
    const folderId = "f-" + Math.random().toString(36).substr(2, 9);
    vfs.folders.push({
      id: folderId,
      parentId,
      name,
      created: Date.now()
    });
    this.saveVFS(vfs);
    return folderId;
  }

  addFile(fileData) {
    const vfs = this.getVFS();
    vfs.files.push({
      id: "doc-" + Math.random().toString(36).substr(2, 9),
      parentId: fileData.folderId || "root",
      name: fileData.name,
      size: fileData.size,
      pageCount: fileData.pageCount || 1,
      created: Date.now(),
      content: fileData.content || ""
    });
    this.saveVFS(vfs);
    this.logActivity(`Generated File: ${fileData.name}`);
  }

  deleteFile(id) {
    const vfs = this.getVFS();
    vfs.files = vfs.files.filter(f => f.id !== id);
    this.saveVFS(vfs);
  }

  logActivity(action) {
    const hist = this.get("history") || [];
    hist.unshift({
      id: "h-" + Math.random().toString(36).substr(2, 9),
      action,
      timestamp: Date.now()
    });
    if (hist.length > 50) hist.pop(); // Limit trace list footprint
    this.set("history", hist);
  }

  toggleFavorite(id) {
    const favs = this.get("favorites") || [];
    const index = favs.indexOf(id);
    if (index === -1) {
      favs.push(id);
    } else {
      favs.splice(index, 1);
    }
    this.set("favorites", favs);
    return favs.indexOf(id) !== -1;
  }
}

const db = new DataEngine();