const totalCount = document.querySelector("#total-count");
const stats = document.querySelector("#stats");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const addButton = document.querySelector("#add-book");
const bookRows = document.querySelector("#book-rows");
const message = document.querySelector("#message");
const dialog = document.querySelector("#book-dialog");
const form = document.querySelector("#book-form");
const formTitle = document.querySelector("#form-title");
const cancelButton = document.querySelector("#cancel-form");

const COLUMN_COUNT = 7;
const SEARCH_DEBOUNCE_MS = 250;

const booksById = new Map();
let editingId = null;
let loadSeq = 0; // used to discard stale /api/books responses
let searchTimer = null;
let formMessage = null; // error area inside the dialog

function init() {
  formMessage = ensureFormMessage();

  // FIX: always search with the current input value (the old code used the
  // previous keystroke's value) and debounce so we don't fire a request per key.
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadBooks(), SEARCH_DEBOUNCE_MS);
  });
  categorySelect.addEventListener("change", () => {
    loadBooks();
  });
  addButton.addEventListener("click", () => {
    openCreate();
  });
  cancelButton.addEventListener("click", () => {
    dialog.close();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveBook();
  });
  bookRows.addEventListener("click", onRowClick);
  refresh();
}

// Uses #form-message if it exists in the HTML, otherwise creates it.
function ensureFormMessage() {
  let el = document.querySelector("#form-message");
  if (!el) {
    el = document.createElement("p");
    el.id = "form-message";
    el.className = "message";
    const actions = form.querySelector(".form-actions");
    if (actions) {
      actions.before(el);
    } else {
      form.append(el);
    }
  }
  return el;
}

// Wraps fetch so network failures and non-JSON responses never throw.
async function request(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await readJson(response);
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: { error: "Could not reach the server" } };
  }
}

async function refresh() {
  await Promise.all([loadStats(), loadCategories(), loadBooks()]);
}

async function loadStats() {
  const { ok, data } = await request("/api/dashboard/stats");
  if (!ok) {
    showError(data.error);
    return;
  }
  totalCount.textContent = `${data.total_books} titles`;
  const categoryItems = data.books_by_category
    .map((item) => `<li><span>${escapeHtml(item.category)}</span><strong>${item.count}</strong></li>`)
    .join("");
  stats.innerHTML = `
    <article class="stat-card"><span>Titles</span><strong>${data.total_books}</strong></article>
    <article class="stat-card"><span>Copies in stock</span><strong>${data.available_copies}</strong></article>
    <article class="stat-card"><span>By category</span><ul class="stat-list">${categoryItems}</ul></article>
  `;
}

async function loadCategories() {
  const { ok, data } = await request("/api/categories");
  if (!ok) {
    showError(data.error);
    return;
  }
  const current = categorySelect.value;
  categorySelect.innerHTML = `<option value="">All categories</option>${data
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("")}`;
  categorySelect.value = data.includes(current) ? current : "";
}

async function loadBooks(query = searchInput.value.trim()) {
  const seq = ++loadSeq;
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (categorySelect.value) {
    params.set("category", categorySelect.value);
  }
  const { ok, data } = await request(`/api/books?${params.toString()}`);
  // FIX: a newer request has started, so this response is out of date.
  if (seq !== loadSeq) {
    return;
  }
  if (!ok) {
    showError(data.error);
    return;
  }
  renderBooks(data);
}

function renderBooks(books) {
  booksById.clear();
  if (!books.length) {
    bookRows.innerHTML = `<tr><td colspan="${COLUMN_COUNT}">No books found.</td></tr>`;
    return;
  }
  bookRows.innerHTML = books
    .map((book) => {
      booksById.set(String(book.id), book);
      return `<tr>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(book.category)}</td>
        <td>${book.published_year}</td>
        <td>${Number(book.price).toFixed(2)}</td>
        <td>
          <span class="stock-controls">
            <button type="button" class="secondary" data-action="decrease" data-id="${book.id}" ${book.quantity <= 0 ? "disabled" : ""}>-</button>
            <span>${book.quantity}</span>
            <button type="button" class="secondary" data-action="increase" data-id="${book.id}">+</button>
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="secondary" data-action="edit" data-id="${book.id}">Edit</button>
            <button type="button" class="danger" data-action="delete" data-id="${book.id}">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function onRowClick(event) {
  const button = event.target.closest("button");
  if (!button || button.disabled) {
    return;
  }
  const id = button.dataset.id;
  const action = button.dataset.action;
  if (action === "edit") {
    openEdit(id);
  } else if (action === "delete") {
    deleteBook(id);
  } else if (action === "increase") {
    adjustStock(id, 1);
  } else if (action === "decrease") {
    adjustStock(id, -1);
  }
}

function openCreate() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Add book";
  message.textContent = "";
  formMessage.textContent = "";
  dialog.showModal();
}

function openEdit(id) {
  const book = booksById.get(String(id));
  if (!book) {
    return;
  }
  editingId = book.id;
  formTitle.textContent = "Edit book";
  form.elements.title.value = book.title;
  form.elements.author.value = book.author;
  form.elements.isbn.value = book.isbn;
  form.elements.category.value = book.category;
  form.elements.published_year.value = book.published_year;
  form.elements.price.value = book.price;
  form.elements.quantity.value = book.quantity;
  message.textContent = "";
  formMessage.textContent = "";
  dialog.showModal();
}

async function saveBook() {
  const payload = {
    title: form.elements.title.value,
    author: form.elements.author.value,
    isbn: form.elements.isbn.value,
    category: form.elements.category.value,
    published_year: Number(form.elements.published_year.value),
    price: Number(form.elements.price.value),
    quantity: Number(form.elements.quantity.value),
  };
  const { ok, data } = await request(editingId ? `/api/books/${editingId}` : "/api/books", {
    method: editingId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!ok) {
    // FIX: show the error inside the dialog, where the user can see it.
    formMessage.textContent = data.error || "Request failed";
    return;
  }
  dialog.close();
  formMessage.textContent = "";
  message.textContent = "";
  await refresh();
}

async function deleteBook(id) {
  const book = booksById.get(String(id));
  if (!book || !window.confirm(`Delete ${book.title}?`)) {
    return;
  }
  const { ok, data } = await request(`/api/books/${id}`, { method: "DELETE" });
  if (!ok) {
    showError(data.error);
    return;
  }
  message.textContent = "";
  await refresh();
}

async function adjustStock(id, adjustment) {
  const { ok, data } = await request(`/api/books/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adjustment }),
  });
  if (!ok) {
    showError(data.error);
    return;
  }
  message.textContent = "";
  await refresh();
}

// FIX: never throws on empty or non-JSON bodies (e.g. an HTML 500 page).
async function readJson(response) {
  if (response.status === 204) {
    return {};
  }
  try {
    return await response.json();
  } catch {
    return { error: `Request failed (${response.status})` };
  }
}

function showError(text) {
  message.textContent = text || "Request failed";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
