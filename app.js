// State Management
let notes = JSON.parse(localStorage.getItem('wynote_notes')) || [];
let folders = JSON.parse(localStorage.getItem('wynote_folders')) || [];
let activeNoteId = localStorage.getItem('wynote_active_id') || null;

// Touch/Pull-to-Refresh Variables
let touchStartY = 0;
let touchCurrentY = 0;
const pullToRefreshBanner = document.getElementById('pull-to-refresh-banner');
const ptrLabel = document.getElementById('ptr-label');
const ptrSpinner = pullToRefreshBanner.querySelector('.ptr-spinner');
const pullThreshold = 150; // Touch pixels required to activate
let isPulling = false;

// DOM Elements
const appContainer = document.querySelector('.app-container');
const notesList = document.getElementById('notes-list');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const newNoteBtn = document.getElementById('new-note-btn');
const createFolderBtn = document.getElementById('create-folder-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const saveStatus = document.getElementById('save-status');

// Mobile Menu Triggers
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Export UI Dropdown
const exportTriggerBtn = document.getElementById('export-trigger-btn');
const exportDropdownMenu = document.getElementById('export-dropdown-menu');

// Ad Gate Modules
const splashAdModal = document.getElementById('splash-ad-modal');
const closeSplashAdBtn = document.getElementById('close-splash-ad-btn');
const splashTimerSpan = document.getElementById('splash-timer');
const rewardAdModal = document.getElementById('reward-ad-modal');
const rewardTimerSpan = document.getElementById('reward-timer');
const rewardAdTitle = document.getElementById('reward-ad-title');
let queuedPremiumCallback = null;

// --- INITIALIZE APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
    initSplashAd();
    renderAllElements();
    loadNoteInEditor();
    bindMainUIEvents();
    initPullToRefresh();
});

// --- PULL TO REFRESH INTERACTION CONTROLLER ---
function initPullToRefresh() {
    const scrollContainer = document.querySelector('.editor-body');

    scrollContainer.addEventListener('touchstart', (e) => {
        // Only pull down when scrolled to the absolute top
        if (scrollContainer.scrollTop === 0) {
            touchStartY = e.touches[0].screenY;
            isPulling = true;
        }
    }, { passive: true });

    scrollContainer.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        touchCurrentY = e.touches[0].screenY;
        const pullDistance = touchCurrentY - touchStartY;

        if (pullDistance > 0) {
            // Smooth dampening logic
            const resistance = 0.4;
            const yOffset = Math.min(pullDistance * resistance, pullThreshold);
            
            pullToRefreshBanner.style.transform = `translateY(${yOffset}px)`;
            
            if (yOffset >= 60) {
                ptrLabel.innerText = "Release to sync application";
            } else {
                ptrLabel.innerText = "Pull down to refresh";
            }
        }
    }, { passive: true });

    scrollContainer.addEventListener('touchend', () => {
        if (!isPulling) return;
        isPulling = false;
        
        const finalPullDistance = touchCurrentY - touchStartY;
        
        if (finalPullDistance * 0.4 >= 60) {
            // Trigger Sync Routine
            pullToRefreshBanner.style.transform = `translateY(60px)`;
            ptrLabel.innerText = "Syncing with cloud...";
            ptrSpinner.style.display = "block";

            setTimeout(() => {
                // Mimic sync by resetting view and state safely
                pullToRefreshBanner.style.transform = `translateY(0)`;
                ptrSpinner.style.display = "none";
                location.reload(); // Hard refresh to ensure everything is initialized perfectly
            }, 1200);
        } else {
            // Rollback banner position
            pullToRefreshBanner.style.transform = `translateY(0)`;
        }
    });
}

// --- GATEWAY ADS ---
function initSplashAd() {
    splashAdModal.classList.add('active');
    let countdownVal = 5;
    closeSplashAdBtn.disabled = true;
    closeSplashAdBtn.classList.add('disabled');
    closeSplashAdBtn.innerText = `Skip Ad in ${countdownVal}s`;

    const timer = setInterval(() => {
        countdownVal--;
        if (countdownVal <= 0) {
            clearInterval(timer);
            closeSplashAdBtn.disabled = false;
            closeSplashAdBtn.classList.remove('disabled');
            closeSplashAdBtn.innerText = "Continue to WyNote";
        } else {
            splashTimerSpan.innerText = countdownVal;
            closeSplashAdBtn.innerText = `Skip Ad in ${countdownVal}s`;
        }
    }, 1000);
}

closeSplashAdBtn.addEventListener('click', () => {
    splashAdModal.classList.remove('active');
});

function handlePremiumActionAd(title, callback) {
    rewardAdTitle.innerText = title;
    rewardAdModal.classList.add('active');
    queuedPremiumCallback = callback;

    let timeLeft = 4;
    rewardTimerSpan.innerText = timeLeft;

    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(interval);
            rewardAdModal.classList.remove('active');
            if (queuedPremiumCallback) {
                queuedPremiumCallback();
                queuedPremiumCallback = null;
            }
        } else {
            rewardTimerSpan.innerText = timeLeft;
        }
    }, 1000);
}

// --- MOBILE SIDEBAR DRAWER CONTROL ---
function bindMainUIEvents() {
    mobileMenuBtn.addEventListener('click', () => {
        appContainer.classList.add('sidebar-open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        appContainer.classList.remove('sidebar-open');
    });

    sidebarOverlay.addEventListener('click', () => {
        appContainer.classList.remove('sidebar-open');
    });

    // File Dropdown Drawer toggle logic
    exportTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdownMenu.classList.toggle('active');
    });

    // Close Dropdown upon outside click
    document.addEventListener('click', () => {
        exportDropdownMenu.classList.remove('active');
    });

    // Rich Text Command Handlers
    document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.execCommand(btn.getAttribute('data-cmd'), false, null);
            noteContentInput.focus();
            updateActiveNote();
        });
    });

    document.getElementById('highlight-btn').addEventListener('click', () => {
        document.execCommand('hiliteColor', false, '#f59e0b');
        noteContentInput.focus();
        updateActiveNote();
    });

    document.getElementById('todo-btn').addEventListener('click', () => {
        const todoHTML = `<div class="todo-item" contenteditable="false"><input type="checkbox" class="todo-checkbox"><span contenteditable="true" style="outline:none; width:100%;">New Task</span></div>`;
        document.execCommand('insertHTML', false, todoHTML);
        noteContentInput.focus();
        updateActiveNote();
    });

    // Checkbox Listeners
    noteContentInput.addEventListener('change', (e) => {
        if (e.target.classList.contains('todo-checkbox')) {
            if (e.target.checked) {
                e.target.setAttribute('checked', 'true');
                e.target.nextElementSibling.style.textDecoration = "line-through";
                e.target.nextElementSibling.style.color = "var(--text-muted)";
            } else {
                e.target.removeAttribute('checked');
                e.target.nextElementSibling.style.textDecoration = "none";
                e.target.nextElementSibling.style.color = "var(--text-main)";
            }
            updateActiveNote();
        }
    });

    // --- RE-BUILT FILE EXPORTER TRIGGER ---
    document.querySelectorAll('.export-opt').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdownMenu.classList.remove('active');
            
            const activeNote = notes.find(n => n.id === activeNoteId);
            if (!activeNote) {
                alert("Please select or create a note first.");
                return;
            }

            const ext = item.getAttribute('data-ext');
            handlePremiumActionAd(`Unlocking ${ext.toUpperCase()} Export`, () => {
                const filename = (activeNote.title.trim() === '' ? 'Untitled_Note' : activeNote.title.replace(/\s+/g, '_')) + '.' + ext;
                let payload = '';

                if (ext === 'html') {
                    payload = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.title || 'Untitled'}</title></head><body style="padding:20px; font-family:sans-serif;">${noteContentInput.innerHTML}</body></html>`;
                } else if (ext === 'md') {
                    let temp = noteContentInput.innerHTML;
                    temp = temp.replace(/<b>(.*?)<\/b>/gi, '**$1**');
                    temp = temp.replace(/<u>(.*?)<\/u>/gi, '_$1_');
                    temp = temp.replace(/<div.*?>(.*?)<\/div>/gi, '\n$1').replace(/<br>/gi, '\n');
                    payload = temp.replace(/<[^>]*>/g, '');
                } else {
                    payload = noteContentInput.innerText;
                }
                
                triggerDeviceDownload(filename, payload);
            });
        });
    });
}

// --- DEVICE-COMPLIANT DOWNLOAD SYSTEM ---
function triggerDeviceDownload(filename, content) {
    const blobType = filename.endsWith('.html') ? 'text/html' : 'text/plain';
    const cleanBlob = new Blob([content], { type: `${blobType};charset=utf-8;` });
    
    // File download mechanism
    const link = document.createElement('a');
    link.href = URL.createObjectURL(cleanBlob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Memory cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }, 100);
}

// --- DIRECTORY & STATE ACTIONS ---
createFolderBtn.addEventListener('click', () => {
    handlePremiumActionAd("Creating Folder", () => {
        const name = prompt("Folder name:") || "New Folder";
        folders.push({
            id: Date.now().toString(),
            name: name,
            noteIds: []
        });
        saveAllData();
        renderAllElements();
    });
});

function createNote(folderId = null) {
    const newNote = {
        id: Date.now().toString(),
        title: '',
        content: '',
        folderId: folderId,
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(newNote);
    if (folderId) {
        const f = folders.find(x => x.id === folderId);
        if (f) f.noteIds.push(newNote.id);
    }

    activeNoteId = newNote.id;
    saveAllData();
    renderAllElements();
    loadNoteInEditor();
    appContainer.classList.remove('sidebar-open');
}

function renderAllElements() {
    notesList.innerHTML = '';

    folders.forEach(folder => {
        const wrapper = document.createElement('div');
        wrapper.className = 'folder-container';
        
        const header = document.createElement('div');
        header.className = 'folder-header';
        header.innerHTML = `
            <span>📁 ${escapeHTML(folder.name)}</span>
            <div class="folder-actions-wrapper">
                <button class="folder-action-btn edit-folder-btn">✏️</button>
                <button class="folder-action-btn download-folder-btn" title="Download Folder">📥</button>
                <button class="add-note-to-folder" style="color: var(--accent); background:none; border:none; padding:4px; font-weight:bold;">+ Add</button>
            </div>
        `;

        header.querySelector('.add-note-to-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            createNote(folder.id);
        });

        header.querySelector('.edit-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const originalName = folder.name;
            const newName = prompt("Rename folder to:", originalName);
            if (newName && newName.trim() !== '') {
                folder.name = newName.trim();
                saveAllData();
                renderAllElements();
            }
        });

        header.querySelector('.download-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const childNotes = notes.filter(n => n.folderId === folder.id);
            if (childNotes.length === 0) {
                alert("Folder is empty. Add notes to it first.");
                return;
            }

            handlePremiumActionAd(`Compiling Folder: "${folder.name}"`, () => {
                const format = (prompt("Type download format (txt, md, html):", "txt") || "txt").toLowerCase().trim();
                if (!['txt', 'md', 'html'].includes(format)) return alert("Format unsupported.");

                let fileContent = "";
                if (format === "html") {
                    fileContent = `<!DOCTYPE html><html><head><title>${folder.name}</title></head><body>`;
                    childNotes.forEach(n => fileContent += `<h2>${n.title || 'Untitled'}</h2><div>${n.content}</div><hr>`);
                    fileContent += "</body></html>";
                } else {
                    childNotes.forEach(n => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = n.content;
                        fileContent += `=== ${n.title || 'Untitled'} ===\n\n${tempDiv.innerText}\n\n`;
                    });
                }
                
                triggerDeviceDownload(`${folder.name.replace(/\s+/g, '_')}_bundle.${format}`, fileContent);
            });
        });

        wrapper.appendChild(header);

        const innerList = document.createElement('div');
        innerList.className = 'folder-notes';
        const childNotes = notes.filter(n => n.folderId === folder.id);
        childNotes.forEach(n => {
            innerList.appendChild(createNoteDOM(n));
        });

        if (childNotes.length > 0) {
            wrapper.appendChild(innerList);
        }
        notesList.appendChild(wrapper);
    });

    const rootNotes = notes.filter(n => !n.folderId);
    rootNotes.forEach(n => {
        notesList.appendChild(createNoteDOM(n));
    });
}
function exportProject() {
  // 1. Get all notes from localStorage
  const notes = localStorage.getItem('wynote-content');
  // If you have multiple notes, use: JSON.stringify(allNotesArray)

  if (!notes) {
    alert("No notes to export!");
    return;
  }

  // 2. Create a file blob
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(notes);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "wynote-backup-" + new Date().toISOString().split('T')[0] + ".json");

  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  alert("Exported successfully!");
}

function createNoteDOM(note) {
    const card = document.createElement('div');
    card.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
    
    const titleText = note.title.trim() === '' ? 'Untitled Note' : note.title;
    const temp = document.createElement('div');
    temp.innerHTML = note.content;
    const previewText = temp.innerText.trim() === '' ? 'Empty body...' : temp.innerText;

    card.innerHTML = `
        <div class="note-item-title">${escapeHTML(titleText)}</div>
        <div class="note-item-preview">${escapeHTML(previewText)}</div>
    `;

    card.addEventListener('click', () => {
        activeNoteId = note.id;
        saveAllData();
        renderAllElements();
        loadNoteInEditor();
        appContainer.classList.remove('sidebar-open');
    });

    return card;
}

function loadNoteInEditor() {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
        noteTitleInput.value = note.title;
        noteContentInput.innerHTML = note.content;
        toggleEditorInteractive(true);
    } else {
        noteTitleInput.value = '';
        noteContentInput.innerHTML = '';
        toggleEditorInteractive(false);
    }
}

function toggleEditorInteractive(active) {
    noteTitleInput.disabled = !active;
    noteContentInput.setAttribute('contenteditable', active ? 'true' : 'false');
    noteContentInput.setAttribute('placeholder', active ? 'Start writing...' : 'Select or make a new note to start.');
}

function updateActiveNote() {
    if (!activeNoteId) return;
    saveStatus.innerText = 'Saving...';
    
    const target = notes.find(n => n.id === activeNoteId);
    if (target) {
        target.title = noteTitleInput.value;
        target.content = noteContentInput.innerHTML;
        target.updatedAt = new Date().toISOString();
    }
    
    saveAllData();
    setTimeout(() => {
        saveStatus.innerText = 'Saved';
        renderAllElements();
    }, 300);
}

function saveAllData() {
    localStorage.setItem('wynote_notes', JSON.stringify(notes));
    localStorage.setItem('wynote_folders', JSON.stringify(folders));
    localStorage.setItem('wynote_active_id', activeNoteId);
}

newNoteBtn.addEventListener('click', () => createNote());
deleteNoteBtn.addEventListener('click', () => {
    if (!activeNoteId) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = notes.length > 0 ? notes[0].id : null;
    saveAllData();
    renderAllElements();
    loadNoteInEditor();
});

noteTitleInput.addEventListener('input', updateActiveNote);
noteContentInput.addEventListener('input', updateActiveNote);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c));
            }
