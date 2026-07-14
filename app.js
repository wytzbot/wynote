// State Management
let notes = JSON.parse(localStorage.getItem('wynote_notes')) || [];
let activeNoteId = localStorage.getItem('wynote_active_id') || null;
let isPremium = localStorage.getItem('wynote_premium') === 'true';

// DOM Elements
const notesList = document.getElementById('notes-list');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content'); // Now contenteditable
const newNoteBtn = document.getElementById('new-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const saveStatus = document.getElementById('save-status');

// Ads & Premium Elements
const splashAdModal = document.getElementById('splash-ad-modal');
const closeSplashAdBtn = document.getElementById('close-splash-ad-btn');
const splashTimerSpan = document.getElementById('splash-timer');

const rewardAdModal = document.getElementById('reward-ad-modal');
const unlockPremiumBtn = document.getElementById('unlock-premium-btn');
const premiumStatus = document.getElementById('premium-status');
const rewardTimerSpan = document.getElementById('reward-timer');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initSplashAd();
    applyPremiumTheme();
    renderNotesList();
    loadActiveNote();
    setupRichTextCommands();
});

// --- AD SYSTEMS ---
function initSplashAd() {
    let timeLeft = 5;
    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            closeSplashAdBtn.disabled = false;
            closeSplashAdBtn.classList.remove('disabled');
            closeSplashAdBtn.innerText = "Continue to WyNote";
        } else {
            splashTimerSpan.innerText = timeLeft;
        }
    }, 1000);
}

closeSplashAdBtn.addEventListener('click', () => {
    splashAdModal.classList.remove('active');
});

unlockPremiumBtn.addEventListener('click', () => {
    rewardAdModal.classList.add('active');
    let timeLeft = 8;
    rewardTimerSpan.innerText = timeLeft;

    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            unlockPremium();
        } else {
            rewardTimerSpan.innerText = timeLeft;
        }
    }, 1000);
});

function unlockPremium() {
    isPremium = true;
    localStorage.setItem('wynote_premium', 'true');
    rewardAdModal.classList.remove('active');
    applyPremiumTheme();
}

function applyPremiumTheme() {
    if (isPremium) {
        document.body.classList.add('premium-theme');
        unlockPremiumBtn.classList.add('hidden');
        premiumStatus.classList.remove('hidden');
    }
}

// --- RICH TEXT EDITOR COMMANDS ---
function setupRichTextCommands() {
    // Simple formats (Bold, Underline, Undo, Redo)
    document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-cmd');
            document.execCommand(command, false, null);
            noteContentInput.focus();
            updateNote();
        });
    });

    // Custom Highlight Tool
    document.getElementById('highlight-btn').addEventListener('click', () => {
        // Toggle yellow highlight. Uses a modern hex code that renders beautifully.
        document.execCommand('hiliteColor', false, '#f59e0b');
        noteContentInput.focus();
        updateNote();
    });

    // To-Do List Tool
    document.getElementById('todo-btn').addEventListener('click', () => {
        const todoHTML = `<div class="todo-item" contenteditable="false"><input type="checkbox" class="todo-checkbox"><span contenteditable="true" style="outline:none; width: 100%;">New Task</span></div>`;
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

    // File Downloader / Exporter
    document.querySelectorAll('.export-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const ext = opt.getAttribute('data-ext');
            const activeNote = notes.find(n => n.id === activeNoteId);
            if (!activeNote) return;

            const filename = (activeNote.title.trim() === '' ? 'Untitled' : activeNote.title) + '.' + ext;
            let fileContent = '';

            if (ext === 'html') {
                fileContent = noteContentInput.innerHTML;
            } else if (ext === 'md') {
                // Simplistic converter: Bold text & standard tags to Markdown
                let temp = noteContentInput.innerHTML;
                temp = temp.replace(/<b>(.*?)<\/b>/gi, '**$1**');
                temp = temp.replace(/<u>(.*?)<\/u>/gi, '_$1_');
                temp = temp.replace(/<div class="todo-item".*?><input.*?checkbox".*?(checked)?.*?>.*?<span.*?>(.*?)<\/span><\/div>/gi, (m, checked, text) => {
                    return checked ? `- [x] ${text}` : `- [ ] ${text}`;
                });
                temp = temp.replace(/<div.*?>(.*?)<\/div>/gi, '\n$1');
                temp = temp.replace(/<br>/gi, '\n');
                fileContent = temp.replace(/<[^>]*>/g, ''); // strip remaining tags
            } else {
                fileContent = noteContentInput.innerText; // .txt plain text extraction
            }

            downloadFile(filename, fileContent);
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

// --- NOTEPAD DATA LOGIC ---
function createNote() {
    const newNote = {
        id: Date.now().toString(),
        title: '',
        content: '', // Now saves structured HTML/Rich Text content
        updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    activeNoteId = newNote.id;
    saveNotes();
    renderNotesList();
    loadActiveNote();
    noteTitleInput.focus();
}

function renderNotesList() {
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:14px;">No notes yet</div>`;
        return;
    }

    notes.forEach(note => {
        const item = document.createElement('div');
        item.classList.add('note-item');
        if (note.id === activeNoteId) item.classList.add('active');

        const title = note.title.trim() === '' ? 'Untitled Note' : note.title;
        
        // Strip HTML tags to show a clean, plain text preview in the sidebar
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
            renderNotesList();
            loadActiveNote();
        });

        notesList.appendChild(item);
    });
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
        noteContentInput.setAttribute('placeholder', 'Create a note to start writing...');
    } else {
        noteContentInput.setAttribute('placeholder', 'Start writing something beautiful...');
    }
}

function saveNotes() {
    localStorage.setItem('wynote_notes', JSON.stringify(notes));
    localStorage.setItem('wynote_active_id', activeNoteId);
}

function updateNote() {
    if (!activeNoteId) return;
    
    saveStatus.innerText = 'Saving...';
    
    const index = notes.findIndex(n => n.id === activeNoteId);
    if (index !== -1) {
        notes[index].title = noteTitleInput.value;
        notes[index].content = noteContentInput.innerHTML; // Saves HTML to keep formatting!
        notes[index].updatedAt = new Date().toISOString();
        
        const [updatedNote] = notes.splice(index, 1);
        notes.unshift(updatedNote);
    }
    
    saveNotes();
    
    setTimeout(() => {
        saveStatus.innerText = 'Saved';
        renderNotesList();
    }, 400);
}

function deleteNote() {
    if (!activeNoteId) return;
    
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = notes.length > 0 ? notes[0].id : null;
    
    saveNotes();
    renderNotesList();
    loadActiveNote();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Event Listeners
newNoteBtn.addEventListener('click', createNote);
deleteNoteBtn.addEventListener('click', deleteNote);
noteTitleInput.addEventListener('input', updateNote);
noteContentInput.addEventListener('input', updateNote);
