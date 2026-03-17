const STORAGE_KEY = 'jat.applications.v1';
const DRAFT_KEY = 'jat.draft.v1';

const form = document.getElementById('applicationForm');
const list = document.getElementById('applicationsList');
const template = document.getElementById('applicationCardTemplate');
const stats = document.getElementById('stats');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const analysisHint = document.getElementById('analysisHint');

const fieldIds = ['jobTitle', 'company', 'location', 'salary', 'applyUrl', 'deadline', 'status', 'dateApplied', 'skills', 'notes'];

let applications = loadJson(STORAGE_KEY, []);
let editingId = null;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function formDataObject() {
  return Object.fromEntries(new FormData(form).entries());
}

function setForm(data) {
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = data[id] || '';
  });
}

function resetForm() {
  editingId = null;
  form.reset();
  document.getElementById('status').value = 'Saved';
  document.getElementById('dateApplied').value = new Date().toISOString().slice(0, 10);
}

function autoExtract(description) {
  const pick = (regex) => description.match(regex)?.[1]?.trim() || '';
  const title = pick(/(?:job title|position|role)\s*[:\-]\s*([^\n]+)/i) || pick(/^([^\n]{3,60})$/m);
  const company = pick(/(?:company|organization|employer)\s*[:\-]\s*([^\n]+)/i);
  const location = pick(/(?:location|based in)\s*[:\-]\s*([^\n]+)/i);
  const salary = pick(/(?:salary|compensation|pay)\s*[:\-]\s*([^\n]+)/i) || description.match(/\$[\d,.]+(?:\s*[-–]\s*\$?[\d,.]+)?(?:\s*\/?\s*(?:year|hr|hour))?/i)?.[0] || '';
  const applyUrl = description.match(/https?:\/\/[^\s)]+/i)?.[0] || '';
  const deadlinePhrase = pick(/(?:deadline|apply by)\s*[:\-]\s*([^\n]+)/i);

  const skillPool = ['JavaScript', 'TypeScript', 'React', 'Node', 'Python', 'Java', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'API', 'Excel', 'Communication', 'Leadership'];
  const skills = skillPool.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(description)).join(', ');

  return {
    jobTitle: title,
    company,
    location,
    salary,
    applyUrl,
    deadline: parseToDate(deadlinePhrase),
    skills,
    notes: description.slice(0, 400),
  };
}

function parseToDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function filteredApplications() {
  const q = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return applications.filter((app) => {
    const blob = `${app.jobTitle} ${app.company} ${app.location} ${app.skills} ${app.notes}`.toLowerCase();
    const queryOk = !q || blob.includes(q);
    const statusOk = status === 'all' || app.status === status;
    return queryOk && statusOk;
  });
}

function renderStats() {
  const counts = applications.reduce((acc, app) => {
    acc.total += 1;
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, { total: 0, Saved: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 });

  stats.innerHTML = ['total', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected']
    .map((k) => `<div class="stat"><strong>${k === 'total' ? 'Total' : k}</strong><br>${counts[k] || 0}</div>`)
    .join('');
}

function renderList() {
  renderStats();
  list.innerHTML = '';
  const items = filteredApplications();
  if (!items.length) {
    list.innerHTML = '<li class="application-card"><p>No applications found. Save one to get started.</p></li>';
    return;
  }

  items.forEach((app) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-role="title"]').textContent = `${app.jobTitle || 'Untitled role'} — ${app.company || 'Unknown company'}`;
    node.querySelector('[data-role="meta"]').textContent = [app.location, app.salary, app.dateApplied && `Applied: ${app.dateApplied}`].filter(Boolean).join(' • ');
    node.querySelector('[data-role="summary"]').textContent = app.notes?.slice(0, 120) || '';
    node.querySelector('[data-role="skills"]').textContent = app.skills ? `Skills: ${app.skills}` : '';

    const statusSelect = node.querySelector('[data-role="statusSelect"]');
    statusSelect.value = app.status || 'Saved';
    statusSelect.addEventListener('change', () => {
      app.status = statusSelect.value;
      saveApplications();
      renderList();
    });

    node.querySelector('[data-role="edit"]').addEventListener('click', () => {
      editingId = app.id;
      setForm(app);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    node.querySelector('[data-role="delete"]').addEventListener('click', () => {
      applications = applications.filter((item) => item.id !== app.id);
      saveApplications();
      renderList();
    });

    list.appendChild(node);
  });
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formDataObject()));
}

function loadDraft() {
  const draft = loadJson(DRAFT_KEY, null);
  if (draft) setForm(draft);
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
  const description = document.getElementById('jobDescription').value.trim();
  if (!description) {
    analysisHint.textContent = 'Paste a job description first.';
    return;
  }

  const prefilled = autoExtract(description);
  setForm({ ...formDataObject(), ...prefilled });
  analysisHint.textContent = 'Auto-filled fields. Review and click Save Application.';
  saveDraft();
});

document.getElementById('clearDraftBtn').addEventListener('click', () => {
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById('jobDescription').value = '';
  analysisHint.textContent = 'Draft cleared.';
  resetForm();
});

form.addEventListener('input', saveDraft);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = formDataObject();
  const payload = { ...data, id: editingId || crypto.randomUUID(), updatedAt: new Date().toISOString() };

  if (editingId) {
    applications = applications.map((item) => (item.id === editingId ? payload : item));
  } else {
    applications.unshift(payload);
  }

  saveApplications();
  localStorage.removeItem(DRAFT_KEY);
  analysisHint.textContent = editingId ? 'Application updated.' : 'Application saved.';
  resetForm();
  renderList();
});

document.getElementById('resetFormBtn').addEventListener('click', resetForm);
searchInput.addEventListener('input', renderList);
statusFilter.addEventListener('change', renderList);

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(applications, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'job-applications.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());

document.getElementById('importFile').addEventListener('change', async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error('Invalid format');
    applications = imported.filter((item) => item && typeof item === 'object' && item.id);
    saveApplications();
    renderList();
    analysisHint.textContent = 'Applications imported.';
  } catch {
    analysisHint.textContent = 'Could not import file. Use exported JSON format.';
  }
});

loadDraft();
if (!document.getElementById('dateApplied').value) {
  document.getElementById('dateApplied').value = new Date().toISOString().slice(0, 10);
}
renderList();
