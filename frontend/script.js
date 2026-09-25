const API_URL = "http://192.168.249.134:5000/api/notes";

let notes = [];
let currentFilter = "all";
let editingNoteId = null;
let sortNewest = true;

async function loadNotes() {
  try {
    const response = await fetch(API_URL);
    notes = await response.json();
    renderNotes();
  } catch (error) {
    showToast("Could not connect to backend");
  }
}

function renderNotes() {
  const grid = document.getElementById("notesGrid");
  const empty = document.getElementById("emptyState");

  let filtered = [...notes];

  if (currentFilter === "favorite") {
    filtered = filtered.filter(note => note.favorite);
  }

  if (currentFilter === "pinned") {
    filtered = filtered.filter(note => note.pinned);
  }

  if (currentFilter.startsWith("tag:")) {
    const tag = currentFilter.replace("tag:", "");
    filtered = filtered.filter(note => note.tag === tag);
  }

  const search = document.getElementById("searchInput").value.toLowerCase().trim();

  if (search) {
    filtered = filtered.filter(note =>
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search) ||
      note.tag.toLowerCase().includes(search)
    );
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  grid.innerHTML = "";

  if (filtered.length === 0) {
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");

    filtered.forEach(note => {
      const card = document.createElement("article");
      card.className = "note-card";

      card.innerHTML = `
        <div class="note-top">
          <span class="note-tag">${escapeHtml(note.tag)}</span>

          <div class="note-actions">
            <button onclick="toggleFavorite('${note._id}')" title="Favorite">
              ${note.favorite ? "★" : "☆"}
            </button>

            <button onclick="togglePin('${note._id}')" title="Pin">
              ${note.pinned ? "📌" : "○"}
            </button>

            <button onclick="editNote('${note._id}')" title="Edit">
              ✎
            </button>

            <button onclick="deleteNote('${note._id}')" title="Delete">
              ×
            </button>
          </div>
        </div>

        <h3 class="note-title">${escapeHtml(note.title)}</h3>

        <p class="note-content">
          ${escapeHtml(note.content)}
        </p>

        <div class="note-bottom">
          <span>${formatDate(note.updatedAt)}</span>

          <span class="note-icons">
            ${note.favorite ? "★" : ""}
            ${note.pinned ? " 📌" : ""}
          </span>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  updateStats();
}

function updateStats() {
  document.getElementById("allCount").textContent = notes.length;
  document.getElementById("totalNotes").textContent = notes.length;

  document.getElementById("favoriteNotes").textContent =
    notes.filter(note => note.favorite).length;
}

function openEditor(note = null) {
  editingNoteId = note ? note._id : null;

  document.getElementById("editorTitle").textContent =
    note ? "Edit Note" : "New Note";

  document.getElementById("noteTitle").value =
    note ? note.title : "";

  document.getElementById("noteContent").value =
    note ? note.content : "";

  document.getElementById("noteTag").value =
    note ? note.tag : "General";

  document.getElementById("noteFavorite").checked =
    note ? note.favorite : false;

  document.getElementById("notePinned").checked =
    note ? note.pinned : false;

  document.getElementById("editorOverlay").classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("noteTitle").focus();
  }, 100);
}

function closeEditor() {
  document.getElementById("editorOverlay").classList.add("hidden");
  editingNoteId = null;
}

async function saveNote() {
  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();
  const tag = document.getElementById("noteTag").value;
  const favorite = document.getElementById("noteFavorite").checked;
  const pinned = document.getElementById("notePinned").checked;

  if (!title || !content) {
    showToast("Title and content are required");
    return;
  }

  const data = {
    title,
    content,
    tag,
    favorite,
    pinned
  };

  try {
    const url = editingNoteId
      ? `${API_URL}/${editingNoteId}`
      : API_URL;

    const method = editingNoteId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    closeEditor();
    await loadNotes();

    showToast(editingNoteId ? "Note updated" : "Note created");
  } catch (error) {
    showToast("Could not save note");
  }
}

function editNote(id) {
  const note = notes.find(note => note._id === id);

  if (note) {
    openEditor(note);
  }
}

async function deleteNote(id) {
  if (!confirm("Delete this note?")) {
    return;
  }

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    await loadNotes();
    showToast("Note deleted");
  } catch (error) {
    showToast("Could not delete note");
  }
}

async function toggleFavorite(id) {
  try {
    await fetch(`${API_URL}/${id}/favorite`, {
      method: "PATCH"
    });

    await loadNotes();
  } catch (error) {
    showToast("Could not update favorite");
  }
}

async function togglePin(id) {
  try {
    await fetch(`${API_URL}/${id}/pin`, {
      method: "PATCH"
    });

    await loadNotes();
  } catch (error) {
    showToast("Could not update pin");
  }
}

function filterNotes(filter) {
  currentFilter = filter;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  event.currentTarget.classList.add("active");

  if (filter === "all") {
    document.getElementById("sectionHeading").textContent = "All Notes";
  } else if (filter === "favorite") {
    document.getElementById("sectionHeading").textContent = "Favorites";
  } else {
    document.getElementById("sectionHeading").textContent = "Pinned Notes";
  }

  renderNotes();
}

function filterTag(tag) {
  currentFilter = `tag:${tag}`;
  document.getElementById("sectionHeading").textContent = `${tag} Notes`;
  renderNotes();
}

function searchNotes() {
  renderNotes();
}

function toggleSort() {
  sortNewest = !sortNewest;
  renderNotes();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("searchInput").focus();
  }

  if (event.key === "Escape") {
    closeEditor();
  }
});

loadNotes();
