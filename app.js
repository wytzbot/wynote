// State Management
let notes = JSON.parse(localStorage.getItem('wynote_notes')) || [];
let folders = JSON.parse(localStorage.getItem('wynote_folders')) || [];
let activeNoteId = localStorage.getItem('wynote_active_id') || null;

// DOM Selectors
const appContainer = document.querySelector('.app-container');
const notesList = document.getElementById('notes-list');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const newNoteBtn = document.getElementById('new-note-btn');
const createFolderBtn = document.getElementById('create-folder-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const saveStatus = document.getElementById('save-status');

// Mobile UI Drawer Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// Create mobile background dimming element dynamically
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
appContainer.appendChild(overlay);

// Ads Elements
const splashAdModal = document.getElementById('splash-ad-modal');
const closeSplashAdBtn = document.getElementById('close-splash-ad-btn');
const splashTimerSpan = document.getElementById('splash-timer');

const rewardAdModal = document.getElementById('reward-ad-modal');
const rewardTimerSpan = document.getElementById('reward-timer');
const rewardAdTitle = document.getElementById('reward-ad-title');

let queuedPremiumCallback = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    triggerSplashAdOnEntry();
    renderNotesAndFolders();
    loadActiveNote();
    setupRichTextEditor();
    setupMobileEvents();
});

// --- FORCE SPLASH AD ON ENTRY ---
function triggerSplashAdOnEntry() {
    splashAdModal.classList.add('active');
    
    let timeLeft = 5;
    splashTimerSpan.innerText = timeLeft;
    
    closeSplashAdBtn.disabled = true;
    closeSplashAdBtn.classList.add('disabled');
    closeSplashAdBtn.innerText = `Skip Ad in ${timeLeft}s`;

    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            closeSplashAdBtn.disabled = false;
            closeSplashAdBtn.classList.remove('disabled');
            closeSplashAdBtn.innerText = "Continue to WyNote";
        } else {
            splashTimerSpan.innerText = timeLeft;
            closeSplashAdBtn.innerText = `Skip Ad in ${timeLeft}s`;
        }
    }, 1000);
}

closeSplashAdBtn.addEventListener('click', () => {
    splashAdModal.classList.remove('active');
});

// --- REWARDED AD GATEWAY ---
function triggerRewardAdGate(adReasonTitle, callback) {
    rewardAdTitle.innerText = adReasonTitle;
    rewardAdModal.classList.add('active');
    queuedPremiumCallback = callback;

    let timeLeft = 8;
    rewardTimerSpan.innerText = timeLeft;

    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdown);
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

// --- RESPONSIVE MOBILE NAVIGATION CONTROLLER ---
function setupMobileEvents() {
    mobileMenuBtn.addEventListener('click', () => {
        appContainer.classList.add('sidebar-open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        appContainer.classList.remove('sidebar-open');
    });

    overlay.addEventListener('click', () => {
        appContainer.classList.remove('sidebar-open');
    });
}

// --- FOLDER & NOTE DATA DIRECTORY ---
createFolderBtn.addEventListener('click', () => {
    triggerRewardAdGate("Watching Ad to Unlock Folder Creation", () => {
        const folderName = prompt("Enter folder name:") || "New Folder";
        folders.push({
            id: Date.now().toString(),
            name: folderName,
            noteIds: []
        });
        saveData();
        renderNotesAndFolders();
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
        const folder = folders.find(f => f.id === folderId);
        if (folder) folder.noteIds.push(newNote.id);
    }

    activeNoteId = newNote.id;
    saveData();
    renderNotesAndFolders();
    loadActiveNote();
    
    appContainer.classList.remove('sidebar-open');
}

function renderNotesAndFolders() {
    notesList.innerHTML = '';

    folders.forEach(folder => {
        const folderContainer = document.createElement('div');
        folderContainer.classList.add('folder-container');

        const folderHeader = document.createElement('div');
        folderHeader.classList.add('folder-header');
        folderHeader.innerHTML = `
            <span>📁 ${escapeHTML(folder.name)}</span>
            <div class="folder-actions-wrapper">
                <button class="folder-action-btn edit-folder-btn" title="Rename Folder">✏️</button>
                <button class="folder-action-btn download-folder-btn" title="Download Folder to Device">📥</button>
                <button class="add-note-to-folder" style="background:transparent; border:none; cursor:pointer; color:var(--accent); font-weight:600; padding:6px;">+ Add</button>
            </div>
        `;
        
        // Add note action
        folderHeader.querySelector('.add-note-to-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            createNote(folder.id);
        });

        // Rename folder action
        folderHeader.querySelector('.edit-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const originalName = folder.name;
            const newName = prompt("Rename folder to:", originalName);
            if (newName && newName.trim() !== '') {
                folder.name = newName.trim();
                saveData();
                renderNotesAndFolders();
            }
        });

        // Download entire folder contents compile action (Requires Premium Reward Ad)
        folderHeader.querySelector('.download-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            if (folderNotes.length === 0) {
                alert("This folder is empty. Create some notes inside before downloading!");
                return;
            }

            triggerRewardAdGate(`Compiling Folder: "${folder.name}"`, () => {
                const formatChoice = prompt("Export format? Type: txt, md, or html", "txt");
                if (!formatChoice) return;
                
                const ext = formatChoice.toLowerCase().trim();
                if (!['txt', 'md', 'html'].includes(ext)) {
                    alert("Invalid format entered. Please use txt, md, or html.");
                    return;
                }

                let outputContent = "";
                const dateHeader = new Date().toLocaleDateString();

                if (ext === 'html') {
                    outputContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHTML(folder.name)}</title><style>body{font-family:sans-serif;padding:30px;background:#121212;color:#eee;} h1{border-bottom:2px solid #6366f1;padding-bottom:10px;} .note{margin-bottom:40px;background:#1a1a1e;padding:20px;border-radius:8px;}</style></head><body><h1>Folder: ${escapeHTML(folder.name)}</h1><p>Export Date: ${dateHeader}</p>`;
                    folderNotes.forEach(note => {
                        outputContent += `<div class="note"><h2>${note.title || 'Untitled Note'}</h2><div>${note.content}</div></div>`;
                    });
                    outputContent += `</body></html>`;
                } else if (ext === 'md') {
                    outputContent = `# Folder: ${folder.name}\nExported: ${dateHeader}\n\n---\n\n`;
                    folderNotes.forEach(note => {
                        let tempContent = note.content;
                        tempContent = tempContent.replace(/<b>(.*?)<\/b>/gi, '**$1**');
                        tempContent = tempContent.replace(/<u>(.*?)<\/u>/gi, '_$1_');
                        tempContent = tempContent.replace(/<div.*?>(.*?)<\/div>/gi, '\n$1').replace(/<br>/gi, '\n');
                        tempContent = tempContent.replace(/<[^>]*>/g, '');
                        outputContent += `## ${note.title || 'Untitled Note'}\n\n${tempContent}\n\n---\n\n`;
                    });
                } else {
                    outputContent = `FOLDER: ${folder.name.toUpperCase()}\nExported: ${dateHeader}\n========================================\n\n`;
                    folderNotes.forEach(note => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = note.content;
                        const textOnly = tempDiv.innerText;
                        outputContent += `TITLE: ${note.title || 'Untitled Note'}\n----------------------------------------\n${textOnly}\n\n========================================\n\n`;
                    });
                }

                downloadFile(`${folder.name.replace(/\s+/g, '_')}_compiled.${ext}`, outputContent);
            });
        });

        const folderNotesDiv = document.createElement('div');
        folderNotesDiv.classList.add('folder-notes');

        const folderNoteItems = notes.filter(n => n.folderId === folder.id);
        folderNoteItems.forEach(note => {
            folderNotesDiv.appendChild(createNoteItemDOM(note));
        });

        folderContainer.appendChild(folderHeader);
        if(folderNoteItems.length > 0) folderContainer.appendChild(folderNotesDiv);
        notesList.appendChild(folderContainer);
    });

    const rootNotes = notes.filter(n => !n.folderId);
    rootNotes.forEach(note => {
        notesList.appendChild(createNoteItemDOM(note));
    });
}

function createNoteItemDOM(note) {
    const item = document.createElement('div');
    item.classList.add('note-item');
    if (note.id === activeNoteId) item.classList.add('active');

    const title = note.title.trim() === '' ? 'Untitled Note' : note.title;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const preview = tempDiv.innerText.trim() === '' ? 'Empty note...' : tempDiv.innerText;

    item.innerHTML = `
        <div class="note-item-title">${escapeHTML(title)}</div>
        <div class="note-item-preview">${escapeHTML(preview)}</div>
    `;

    item.addEventListener('click', () => {
        activeNoteId = note.id;
        localStorage.setItem('wynote_active_id', activeNoteId);
        renderNotesAndFolders();
        loadActiveNote();
        appContainer.classList.remove('sidebar-open');
    });

    return item;
}

function loadActiveNote() {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (activeNote) {
        noteTitleInput.value = activeNote.title;
        noteContentInput.innerHTML = activeNote.content;
        enableEditor(true);
    } else {
        noteTitleInput.value = '';
        noteContentInput.innerHTML = '';
        enableEditor(false);
    }
}

function enableEditor(status) {
    noteTitleInput.disabled = !status;
    noteContentInput.setAttribute('contenteditable', status ? 'true' : 'false');
    if (!status) {
        noteContentInput.setAttribute('placeholder', 'Create or select a note to write...');
    } else {
        noteContentInput.setAttribute('placeholder', 'Start writing...');
    }
}

function updateNote() {
    if (!activeNoteId) return;
    saveStatus.innerText = 'Saving...';
    
    const index = notes.findIndex(n => n.id === activeNoteId);
    if (index !== -1) {
        notes[index].title = noteTitleInput.value;
        notes[index].content = noteContentInput.innerHTML;
        notes[index].updatedAt = new Date().toISOString();
    }
    
    saveData();
    setTimeout(() => {
        saveStatus.innerText = 'Saved';
        renderNotesAndFolders();
    }, 400);
}

function saveData() {
    localStorage.setItem('wynote_notes', JSON.stringify(notes));
    localStorage.setItem('wynote_folders', JSON.stringify(folders));
    localStorage.setItem('wynote_active_id', activeNoteId);
}

// --- SECURE & DEVICE COMPATIBLE BLOB EXPORTER ---
function setupRichTextEditor() {
    document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.execCommand(btn.getAttribute('data-cmd'), false, null);
            noteContentInput.focus();
            updateNote();
        });
    });

    document.getElementById('highlight-btn').addEventListener('click', () => {
        document.execCommand('hiliteColor', false, '#f59e0b');
        noteContentInput.focus();
        updateNote();
    });

    document.getElementById('todo-btn').addEventListener('click', () => {
        const todoHTML = `<div class="todo-item" contenteditable="false"><input type="checkbox" class="todo-checkbox"><span contenteditable="true" style="outline:none; width:100%;">New Task</span></div>`;
        document.execCommand('insertHTML', false, todoHTML);
        noteContentInput.focus();
        updateNote();
    });

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
            updateNote();
        }
    });

    // Individual file down-loader engine (Fully compatible with iOS and Android WebViews)
    document.querySelectorAll('.export-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const ext = opt.getAttribute('data-ext');
            const activeNote = notes.find(n => n.id === activeNoteId);
            if (!activeNote) return;

            triggerRewardAdGate(`Unlocking ${ext.toUpperCase()} Download File`, () => {
                const filename = (activeNote.title.trim() === '' ? 'Untitled' : activeNote.title) + '.' + ext;
                let fileContent = '';

                if (ext === 'html') {
                    fileContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.title || 'Untitled'}</title></head><body style="padding:20px; font-family:sans-serif;">${noteContentInput.innerHTML}</body></html>`;
                } else if (ext === 'md') {
                    let temp = noteContentInput.innerHTML;
                    temp = temp.replace(/<b>(.*?)<\/b>/gi, '**$1**');
                    temp = temp.replace(/<u>(.*?)<\/u>/gi, '_$1_');
                    temp = temp.replace(/<div.*?>(.*?)<\/div>/gi, '\n$1').replace(/<br>/gi, '\n');
                    fileContent = temp.replace(/<[^>]*>/g, '');
                } else {
                    fileContent = noteContentInput.innerText;
                }
                downloadFile(filename, fileContent);
            });
        });
    });
}

// Modern device-compliant blob-download link emulator (Standard sandbox bypass)
function downloadFile(filename, content) {
    const mimeType = filename.endsWith('.html') ? 'text/html' : 'text/plain';
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    
    // Clean memory instantly
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
}

newNoteBtn.addEventListener('click', () => createNote());
deleteNoteBtn.addEventListener('click', () => {
    if (!activeNoteId) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = notes.length > 0 ? notes[0].id : null;
    saveData();
    renderNotesAndFolders();
    loadActiveNote();
});

noteTitleInput.addEventListener('input', updateNote);
noteContentInput.addEventListener('input', updateNote);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
