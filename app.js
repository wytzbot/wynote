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
const mobileBackBtn = document.getElementById('mobile-back-btn');

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
});

// --- FORCE SPLASH AD ON ENTRY (Triggers on every single page load) ---
function triggerSplashAdOnEntry() {
    // Bring up the overlay instantly
    splashAdModal.classList.add('active');
    
    let timeLeft = 5;
    splashTimerSpan.innerText = timeLeft;
    
    // Ensure button is locked
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

// --- REWARDED AD GATEWAY (Triggers every time a premium feature is requested) ---
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

// --- FOLDER & NOTE DATA DIRECTORY ---
createFolderBtn.addEventListener('click', () => {
    // Intercept with Reward Ad
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
    
    // Auto-focus writing workspace on mobile
    appContainer.classList.add('mobile-note-open');
}

function renderNotesAndFolders() {
    notesList.innerHTML = '';

    // Folders
    folders.forEach(folder => {
        const folderContainer = document.createElement('div');
        folderContainer.classList.add('folder-container');

        const folderHeader = document.createElement('div');
        folderHeader.classList.add('folder-header');
        folderHeader.innerHTML = `<span>📁 ${escapeHTML(folder.name)}</span><button class="add-note-to-folder" style="background:transparent; border:none; cursor:pointer; color:var(--accent);">+ Add</button>`;
        
        folderHeader.querySelector('.add-note-to-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            createNote(folder.id);
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

    // Root Notes
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
        appContainer.classList.add('mobile-note-open');
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

// --- TEXT EDITOR & HIGH-GATED EXPORTS ---
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

    // Save To-Do changes inside editor
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

    // Intercept Exporter with Reward Ads
    document.querySelectorAll('.export-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const ext = opt.getAttribute('data-ext');
            const activeNote = notes.find(n => n.id === activeNoteId);
            if (!activeNote) return;

            triggerRewardAdGate(`Unlocking ${ext.toUpperCase()} Download File`, () => {
                const filename = (activeNote.title.trim() === '' ? 'Untitled' : activeNote.title) + '.' + ext;
                let fileContent = '';

                if (ext === 'html') {
                    fileContent = noteContentInput.innerHTML;
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

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Mobile back navigation
mobileBackBtn.addEventListener('click', () => {
    appContainer.classList.remove('mobile-note-open');
});

newNoteBtn.addEventListener('click', () => createNote());
deleteNoteBtn.addEventListener('click', () => {
    if (!activeNoteId) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = notes.length > 0 ? notes[0].id : null;
    saveData();
    renderNotesAndFolders();
    loadActiveNote();
    appContainer.classList.remove('mobile-note-open');
});

noteTitleInput.addEventListener('input', updateNote);
noteContentInput.addEventListener('input', updateNote);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
