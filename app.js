const STORAGE_KEY = "jat.applications.v1";
const THEME_KEY = "jat.theme";
const STATUSES = ["Wishlist", "Applied", "Interview", "Offer", "Rejected"];

const state = {
  applications: [],
  search: "",
  statusFilter: "all",
  sortBy: "newest",
  editingId: null,
};

const el = {
  form: document.getElementById("applicationForm"),
  formTitle: document.getElementById("formTitle"),
  formError: document.getElementById("formError"),
  applicationId: document.getElementById("applicationId"),
  company: document.getElementById("company"),
  role: document.getElementById("role"),
  status: document.getElementById("status"),
  appliedDate: document.getElementById("appliedDate"),
  jobLink: document.getElementById("jobLink"),
  location: document.getElementById("location"),
  salary: document.getElementById("salary"),
  followUpDate: document.getElementById("followUpDate"),
  notes: document.getElementById("notes"),
  saveBtn: document.getElementById("saveBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  seedDataBtn: document.getElementById("seedDataBtn"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  sortBy: document.getElementById("sortBy"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearBtn: document.getElementById("clearBtn"),
  tableBody: document.getElementById("tableBody"),
  statGrid: document.getElementById("statGrid"),
  board: document.getElementById("board"),
  emptyState: document.getElementById("emptyState"),
  themeToggle: document.getElementById("themeToggle"),
  statCardTemplate: document.getElementById("statCardTemplate"),
};

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function sanitize(text) {
  return String(text || "").trim();
}

function safeDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function normalizeApplication(item) {
  return {
    id: sanitize(item.id) || uid(),
    company: sanitize(item.company),
    role: sanitize(item.role),
    status: STATUSES.includes(item.status) ? item.status : "Wishlist",
    appliedDate: safeDate(item.appliedDate),
    jobLink: sanitize(item.jobLink),
    location: sanitize(item.location),
    salary: sanitize(item.salary),
    followUpDate: safeDate(item.followUpDate),
    notes: sanitize(item.notes),
    createdAt: Number(item.createdAt) || Date.now(),
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.applications));
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.applications = Array.isArray(parsed)
      ? parsed
          .map((item) => normalizeApplication(item))
          .filter((item) => item.company && item.role)
      : [];
  } catch {
    state.applications = [];
  }
}

function getFiltered() {
  const query = state.search.toLowerCase();
  const filtered = state.applications.filter((a) => {
    const searchMatch =
      !query ||
      [a.company, a.role, a.notes, a.location, a.salary].some((x) =>
        x.toLowerCase().includes(query)
      );
    const statusMatch =
      state.statusFilter === "all" || a.status === state.statusFilter;
    return searchMatch && statusMatch;
  });

  filtered.sort((a, b) => {
    switch (state.sortBy) {
      case "oldest":
        return a.createdAt - b.createdAt;
      case "company":
        return a.company.localeCompare(b.company);
      case "status":
        return a.status.localeCompare(b.status);
      case "followup": {
        const da = a.followUpDate ? Date.parse(a.followUpDate) : Number.MAX_SAFE_INTEGER;
        const db = b.followUpDate ? Date.parse(b.followUpDate) : Number.MAX_SAFE_INTEGER;
        return da - db;
      }
      case "newest":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return filtered;
}

function renderStats(items) {
  el.statGrid.innerHTML = "";
  const counts = { Total: items.length };
  for (const status of STATUSES) counts[status] = items.filter((i) => i.status === status).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  const upcoming = items.filter((i) => i.followUpDate && Date.parse(i.followUpDate) >= todayTs).length;
  counts["Follow-ups"] = upcoming;

  Object.entries(counts).forEach(([name, value]) => {
    const node = el.statCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = name;
    node.querySelector("p").textContent = String(value);
    el.statGrid.appendChild(node);
  });
}

function renderBoard(items) {
  el.board.innerHTML = "";
  for (const status of STATUSES) {
    const col = document.createElement("section");
    col.className = "column";
    const subset = items.filter((i) => i.status === status);
    const title = document.createElement("h3");
    title.textContent = `${status} (${subset.length})`;
    col.appendChild(title);
    subset.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card";
      const company = document.createElement("strong");
      company.textContent = item.company;
      const br1 = document.createElement("br");
      const role = document.createTextNode(item.role);
      card.append(company, br1, role);
      if (item.followUpDate) {
        const br2 = document.createElement("br");
        const follow = document.createElement("small");
        follow.textContent = `Follow-up: ${item.followUpDate}`;
        card.append(br2, follow);
      }
      col.appendChild(card);
    });
    el.board.appendChild(col);
  }
}

function rowActions(app) {
  const wrap = document.createElement("div");
  wrap.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "ghost";
  editBtn.addEventListener("click", () => startEdit(app.id));

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.className = "danger";
  delBtn.addEventListener("click", () => removeApp(app.id));

  wrap.append(editBtn, delBtn);
  return wrap;
}

function renderTable(items) {
  el.tableBody.innerHTML = "";
  el.emptyState.hidden = items.length > 0;

  items.forEach((app) => {
    const tr = document.createElement("tr");
    const company = document.createElement("td");
    company.textContent = app.company;
    const role = document.createElement("td");
    role.textContent = app.role;
    const status = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = app.status;
    status.appendChild(tag);
    const appliedDate = document.createElement("td");
    appliedDate.textContent = app.appliedDate || "-";
    const followUpDate = document.createElement("td");
    followUpDate.textContent = app.followUpDate || "-";
    const actions = document.createElement("td");
    actions.appendChild(rowActions(app));
    tr.append(company, role, status, appliedDate, followUpDate, actions);
    el.tableBody.appendChild(tr);
  });
}

function render() {
  const items = getFiltered();
  renderStats(items);
  renderBoard(items);
  renderTable(items);
}

function clearForm() {
  el.form.reset();
  el.applicationId.value = "";
  state.editingId = null;
  el.formTitle.textContent = "Add Application";
  el.saveBtn.textContent = "Save";
  el.cancelEditBtn.hidden = true;
  el.formError.textContent = "";
  el.status.value = "Wishlist";
}

function startEdit(id) {
  const app = state.applications.find((a) => a.id === id);
  if (!app) return;
  state.editingId = id;
  el.applicationId.value = app.id;
  el.company.value = app.company;
  el.role.value = app.role;
  el.status.value = app.status;
  el.appliedDate.value = app.appliedDate;
  el.jobLink.value = app.jobLink;
  el.location.value = app.location;
  el.salary.value = app.salary;
  el.followUpDate.value = app.followUpDate;
  el.notes.value = app.notes;
  el.formTitle.textContent = "Edit Application";
  el.saveBtn.textContent = "Update";
  el.cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeApp(id) {
  const ok = window.confirm("Delete this application?");
  if (!ok) return;
  state.applications = state.applications.filter((a) => a.id !== id);
  persist();
  if (state.editingId === id) clearForm();
  render();
}

function validateForm(payload) {
  if (!payload.company || !payload.role) return "Company and role are required.";
  if (payload.jobLink && !/^https?:\/\//i.test(payload.jobLink)) {
    return "Job link must start with http:// or https://";
  }
  if (payload.appliedDate && payload.followUpDate && payload.followUpDate < payload.appliedDate) {
    return "Follow-up date cannot be before applied date.";
  }
  return "";
}

function upsertApplication(payload) {
  if (state.editingId) {
    state.applications = state.applications.map((a) =>
      a.id === state.editingId ? { ...a, ...payload } : a
    );
  } else {
    state.applications.push({ id: uid(), createdAt: Date.now(), ...payload });
  }
  persist();
  clearForm();
  render();
}

function collectPayload() {
  return {
    company: sanitize(el.company.value),
    role: sanitize(el.role.value),
    status: STATUSES.includes(el.status.value) ? el.status.value : "Wishlist",
    appliedDate: safeDate(el.appliedDate.value),
    jobLink: sanitize(el.jobLink.value),
    location: sanitize(el.location.value),
    salary: sanitize(el.salary.value),
    followUpDate: safeDate(el.followUpDate.value),
    notes: sanitize(el.notes.value),
  };
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.applications, null, 2)], { type: "application/json" });
  downloadBlob(blob, "job-applications.json");
}

function toCsvValue(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv() {
  const headers = ["company", "role", "status", "appliedDate", "followUpDate", "location", "salary", "jobLink", "notes"];
  const rows = [headers.join(",")];
  for (const item of state.applications) {
    rows.push(headers.map((h) => toCsvValue(item[h])).join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "job-applications.csv");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(parsed)) throw new Error("invalid");
      state.applications = parsed
        .map((item) => normalizeApplication(item))
        .filter((item) => item.company && item.role);
      persist();
      clearForm();
      render();
      el.formError.textContent = "Import successful.";
    } catch {
      el.formError.textContent = "Invalid JSON file.";
    }
  };
  reader.readAsText(file);
}

function seedData() {
  if (state.applications.length && !window.confirm("Replace existing data with sample applications?")) return;
  const today = new Date();
  const plusDays = (d) => {
    const t = new Date(today);
    t.setDate(today.getDate() + d);
    return t.toISOString().slice(0, 10);
  };

  state.applications = [
    {
      id: uid(),
      company: "Acme Labs",
      role: "Frontend Engineer",
      status: "Applied",
      appliedDate: plusDays(-2),
      followUpDate: plusDays(5),
      jobLink: "https://example.com/jobs/frontend",
      location: "Remote",
      salary: "110k-130k",
      notes: "Referred by a former colleague.",
      createdAt: Date.now() - 2000,
    },
    {
      id: uid(),
      company: "Nimbus AI",
      role: "Product Analyst",
      status: "Interview",
      appliedDate: plusDays(-10),
      followUpDate: plusDays(2),
      jobLink: "https://example.com/jobs/analyst",
      location: "New York, NY",
      salary: "95k-115k",
      notes: "Round 2 technical interview on Thursday.",
      createdAt: Date.now() - 1000,
    },
    {
      id: uid(),
      company: "Brightside Health",
      role: "Operations Associate",
      status: "Wishlist",
      appliedDate: "",
      followUpDate: "",
      jobLink: "https://example.com/jobs/ops",
      location: "Austin, TX",
      salary: "70k-80k",
      notes: "Need to tailor resume before applying.",
      createdAt: Date.now(),
    },
  ];
  persist();
  clearForm();
  render();
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  el.themeToggle.textContent = dark ? "☀️ Theme" : "🌙 Theme";
}

function setupEvents() {
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = collectPayload();
    const error = validateForm(payload);
    el.formError.textContent = error;
    if (error) return;
    upsertApplication(payload);
  });

  el.cancelEditBtn.addEventListener("click", clearForm);
  el.seedDataBtn.addEventListener("click", seedData);

  el.searchInput.addEventListener("input", (e) => {
    state.search = sanitize(e.target.value);
    render();
  });
  el.statusFilter.addEventListener("change", (e) => {
    state.statusFilter = e.target.value;
    render();
  });
  el.sortBy.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    render();
  });

  el.exportJsonBtn.addEventListener("click", exportJson);
  el.exportCsvBtn.addEventListener("click", exportCsv);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importJson(file);
    e.target.value = "";
  });

  el.clearBtn.addEventListener("click", () => {
    if (!state.applications.length) return;
    const ok = window.confirm("Clear all applications? This cannot be undone.");
    if (!ok) return;
    state.applications = [];
    persist();
    clearForm();
    render();
  });

  el.themeToggle.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

function init() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
  load();
  setupEvents();
  clearForm();
  render();
}

init();
