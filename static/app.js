// Theme toggle
const btnTheme = document.getElementById("btn-theme");
btnTheme.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
});

// ─── CONFIG STATE ──────────────────────────────────────
let appConfig = { source_dir: "", destinations: [] };

// ─── DOM REFS (files view) ─────────────────────────────
const selectAll = document.getElementById("select-all");
const fileTbody = document.getElementById("file-tbody");
const fileCount = document.getElementById("file-count");
const seriesName = document.getElementById("series-name");
const destination = document.getElementById("destination");
const previewSection = document.getElementById("preview-section");
const previewList = document.getElementById("preview-list");
const btnOrganize = document.getElementById("btn-organize");
const btnOrganizeMatched = document.getElementById("btn-organize-matched");
const filterSelect = document.getElementById("filter-match");
const toastContainer = document.getElementById("toast-container");

// ─── DOM REFS (config view) ────────────────────────────
const configSource = document.getElementById("config-source");
const configDestList = document.getElementById("config-dest-list");
const configNewDest = document.getElementById("config-new-dest");
const btnAddDest = document.getElementById("btn-add-dest");
const btnSaveConfig = document.getElementById("btn-save-config");

// ─── DOM REFS (navigation) ─────────────────────────────
const viewFiles = document.getElementById("view-files");
const viewConfig = document.getElementById("view-config");
const navTabs = document.querySelectorAll(".nav-tab");

let filesData = [];
let sortField = null;  // "name", "series", "tome", "size"
let sortDir = "asc";   // "asc" or "desc"
let filterMatch = "all"; // "all", "matched", "suggested", "unmatched"

// ─── NAVIGATION ────────────────────────────────────────
navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const view = tab.dataset.view;
        navTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        viewFiles.style.display = view === "files" ? "" : "none";
        viewConfig.style.display = view === "config" ? "" : "none";

        if (view === "config") {
            loadConfigUI();
        }
    });
});

// ─── CONFIG LOADING ────────────────────────────────────
async function loadConfig() {
    try {
        const res = await fetch("/api/config");
        appConfig = await res.json();
    } catch {
        showToast("Erreur lors du chargement de la configuration", "error");
    }
}

function populateDestinations() {
    // Keep the first "-- Choisir --" option, replace the rest
    destination.innerHTML = `<option value="">-- Choisir --</option>`;
    appConfig.destinations.forEach((dest) => {
        const label = dest.split("/").pop();
        const opt = document.createElement("option");
        opt.value = dest;
        opt.textContent = label;
        destination.appendChild(opt);
    });
}

// ─── CONFIG PAGE ───────────────────────────────────────
function loadConfigUI() {
    configSource.value = appConfig.source_dir;
    renderDestList();
}

function renderDestList() {
    configDestList.innerHTML = "";
    appConfig.destinations.forEach((dest, i) => {
        const li = document.createElement("li");
        li.className = "config-dest-item";
        li.innerHTML = `
            <span class="config-dest-path">${escHtml(dest)}</span>
            <button class="btn-dest-remove" type="button" data-index="${i}" title="Supprimer">&times;</button>
        `;
        configDestList.appendChild(li);
    });
}

configDestList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-dest-remove");
    if (!btn) return;
    const idx = parseInt(btn.dataset.index);
    appConfig.destinations.splice(idx, 1);
    renderDestList();
});

btnAddDest.addEventListener("click", () => {
    const val = configNewDest.value.trim();
    if (!val) return;
    if (appConfig.destinations.includes(val)) {
        showToast("Ce dossier est déjà dans la liste", "error");
        return;
    }
    appConfig.destinations.push(val);
    configNewDest.value = "";
    renderDestList();
});

configNewDest.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnAddDest.click();
});

btnSaveConfig.addEventListener("click", async () => {
    const sourceDir = configSource.value.trim();
    if (!sourceDir) {
        showToast("Le dossier source est requis", "error");
        return;
    }
    if (appConfig.destinations.length === 0) {
        showToast("Au moins une destination est requise", "error");
        return;
    }

    btnSaveConfig.disabled = true;
    btnSaveConfig.textContent = "En cours...";

    try {
        const res = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_dir: sourceDir,
                destinations: appConfig.destinations,
            }),
        });
        const data = await res.json();
        if (data.error) {
            showToast(data.error, "error");
            return;
        }
        appConfig = data.config;
        populateDestinations();
        showToast("Configuration sauvegardée", "success");
    } catch {
        showToast("Erreur lors de la sauvegarde", "error");
    } finally {
        btnSaveConfig.disabled = false;
        btnSaveConfig.textContent = "Sauvegarder";
    }
});

// ─── SCAN FILES ────────────────────────────────────────
async function scanFiles() {
    const source = appConfig.source_dir;
    if (!source) return;

    try {
        const res = await fetch(`/api/files?source=${encodeURIComponent(source)}`);
        const data = await res.json();
        filesData = data.files;
        renderFiles();
    } catch {
        showToast("Erreur lors du scan", "error");
    }
}

function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function buildFileRow(f, i, extraClass = "") {
    const nameParts = f.name.split(".");
    const ext = nameParts.pop();
    const baseName = nameParts.join(".");
    const tomeVal = f.tome !== null ? f.tome : "";
    const tomeDisplay = f.tome !== null
        ? `<input type="number" class="tome-input" data-index="${i}" value="${tomeVal}" min="0">`
        : `<input type="number" class="tome-input" data-index="${i}" value="" min="0" placeholder="?">`;

    const guess = f.series_guess || "";
    const match = f.series_match;
    const score = f.match_score || 0;
    const hasMatch = match !== null && match !== undefined;
    const isHighConf = hasMatch && score >= 0.9;
    const isSuggestion = hasMatch && score >= 0.6 && score < 0.9;
    const searchVal = hasMatch ? match.name : "";
    const btnLabel = isHighConf ? `+ ${escHtml(match.dest_label)}` : (isSuggestion ? `? ${escHtml(match.dest_label)}` : "");
    const btnClass = isSuggestion ? "btn-add-to suggestion" : "btn-add-to";
    const btnHtml = hasMatch
        ? `<button class="${btnClass}" type="button" data-index="${i}" data-series="${escHtml(match.name)}" data-dest="${escHtml(match.destination)}" title="${escHtml(match.dest_label)}/${escHtml(match.name)}">${btnLabel}</button>`
        : `<button class="btn-add-to" type="button" data-index="${i}" style="display:none"></button>`;

    const confClass = isHighConf ? "match-high" : (isSuggestion ? "match-suggestion" : "match-none");
    const confBadge = isHighConf
        ? `<span class="conf-badge conf-high" title="Match ${Math.round(score * 100)}%">&#10003;</span>`
        : (isSuggestion
            ? `<span class="conf-badge conf-suggest" title="Suggestion ${Math.round(score * 100)}%">?</span>`
            : `<span class="conf-badge conf-none" title="Pas de match">&#x2015;</span>`);

    return `<tr data-index="${i}" class="${confClass}${extraClass ? " " + extraClass : ""}">
        <td class="col-check"><input type="checkbox" class="file-check" data-index="${i}"></td>
        <td class="col-name"><span class="file-name">${escHtml(baseName)}<span class="file-ext">.${escHtml(ext)}</span></span></td>
        <td class="col-series"><span class="series-guess">${escHtml(guess)}</span> ${confBadge}</td>
        <td class="col-search-ext">${guess ? `<a class="btn-ext-search" href="https://www.nautiljon.com/search.php?q=${encodeURIComponent(guess)}" target="_blank" rel="noopener" title="Nautiljon"><span class="ext-label">N</span></a><a class="btn-ext-search" href="https://www.manga-news.com/index.php/recherche/?q=${encodeURIComponent(guess)}" target="_blank" rel="noopener" title="Manga-News"><span class="ext-label">M</span></a>` : ""}</td>
        <td class="col-match">
            <div class="series-search-wrap">
                <input type="text" class="series-search" data-index="${i}" value="${escHtml(searchVal)}" placeholder="Rechercher..." autocomplete="off">
                <div class="series-dropdown" data-index="${i}"></div>
                ${btnHtml}
            </div>
        </td>
        <td class="col-tome">${tomeDisplay}</td>
        <td class="col-size">${f.size_human}</td>
        <td class="col-actions"><button class="btn-delete" type="button" data-index="${i}" title="Supprimer ${escHtml(f.name)}">&#x2715;</button></td>
    </tr>`;
}

function getDisplayFiles() {
    // Build array of {file, index} preserving original indices, then filter and sort
    let items = filesData.map((f, i) => ({ file: f, index: i }));

    // Apply filter
    if (filterMatch === "matched") {
        items = items.filter(({ file: f }) => f.series_match && (f.match_score || 0) >= 0.9);
    } else if (filterMatch === "suggested") {
        items = items.filter(({ file: f }) => f.series_match && (f.match_score || 0) >= 0.6 && (f.match_score || 0) < 0.9);
    } else if (filterMatch === "unmatched") {
        items = items.filter(({ file: f }) => !f.series_match);
    }

    // Apply sort
    if (sortField) {
        const dir = sortDir === "asc" ? 1 : -1;
        items.sort((a, b) => {
            let va, vb;
            switch (sortField) {
                case "name": va = a.file.name.toLowerCase(); vb = b.file.name.toLowerCase(); break;
                case "series": va = (a.file.series_guess || "").toLowerCase(); vb = (b.file.series_guess || "").toLowerCase(); break;
                case "tome": va = a.file.tome ?? 9999; vb = b.file.tome ?? 9999; break;
                case "size": va = a.file.size; vb = b.file.size; break;
                default: return 0;
            }
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }

    return items;
}

function renderFiles() {
    // Preserve scroll position across re-renders
    const tableWrap = document.querySelector(".file-table-wrap");
    const scrollTop = tableWrap ? tableWrap.scrollTop : 0;

    if (filesData.length === 0) {
        fileTbody.innerHTML = `<tr class="empty-row"><td colspan="8">Aucun fichier CBR/CBZ/PDF trouvé</td></tr>`;
        fileCount.textContent = "0 fichier";
        return;
    }

    const displayItems = getDisplayFiles();
    const total = filesData.length;
    const shown = displayItems.length;
    fileCount.textContent = filterMatch !== "all" && shown !== total
        ? `${shown} / ${total} fichier${total > 1 ? "s" : ""}`
        : `${total} fichier${total > 1 ? "s" : ""}`;

    if (displayItems.length === 0) {
        fileTbody.innerHTML = `<tr class="empty-row"><td colspan="8">Aucun fichier ne correspond au filtre</td></tr>`;
        selectAll.checked = false;
        updatePreview();
        btnOrganizeMatched.style.display = "none";
        return;
    }

    // Group files by series_guess
    const groups = new Map();
    displayItems.forEach(({ file: f, index: i }) => {
        const key = (f.series_guess || "").toLowerCase().trim() || "__ungrouped__";
        if (!groups.has(key)) {
            groups.set(key, { label: f.series_guess || "Sans série détectée", files: [] });
        }
        groups.get(key).files.push({ file: f, index: i });
    });

    // Single-file groups don't need a header — flatten if only one group or all single-file groups
    const multiFileGroups = [...groups.values()].filter((g) => g.files.length > 1);
    const useGrouping = multiFileGroups.length > 0 && groups.size > 1;

    // Sort groups themselves when a sort field is active
    let sortedGroups = [...groups.entries()];
    if (useGrouping && sortField) {
        const dir = sortDir === "asc" ? 1 : -1;
        sortedGroups.sort(([, a], [, b]) => {
            // Sort groups by the first file's sort key value
            const fa = a.files[0].file, fb = b.files[0].file;
            let va, vb;
            switch (sortField) {
                case "name": va = fa.name.toLowerCase(); vb = fb.name.toLowerCase(); break;
                case "series": va = (fa.series_guess || "").toLowerCase(); vb = (fb.series_guess || "").toLowerCase(); break;
                case "tome": va = fa.tome ?? 9999; vb = fb.tome ?? 9999; break;
                case "size": va = fa.size; vb = fb.size; break;
                default: return 0;
            }
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }

    let html = "";
    if (useGrouping) {
        let groupIdx = 0;
        for (const [key, group] of sortedGroups) {
            const indices = group.files.map((f) => f.index);
            // Spacer row between groups (not before the first)
            if (groupIdx > 0) {
                html += `<tr class="group-spacer"><td colspan="8"></td></tr>`;
            }
            if (group.files.length > 1) {
                html += `<tr class="group-header" data-group-indices="${indices.join(",")}">
                    <td class="col-check"><input type="checkbox" class="group-check" data-group-indices="${indices.join(",")}"></td>
                    <td colspan="7"><span class="group-label">${escHtml(group.label)}</span><span class="group-count">${group.files.length}</span></td>
                </tr>`;
            }
            for (let gi = 0; gi < group.files.length; gi++) {
                const { file, index } = group.files[gi];
                const isLast = gi === group.files.length - 1;
                html += buildFileRow(file, index, isLast ? "group-last" : "");
            }
            groupIdx++;
        }
    } else {
        displayItems.forEach(({ file, index }) => {
            html += buildFileRow(file, index);
        });
    }

    fileTbody.innerHTML = html;

    selectAll.checked = false;
    updatePreview();

    // Show/hide batch organize button (high-confidence matches only, score >= 0.9)
    const matchedCount = filesData.filter((f) => f.series_match && (f.match_score || 0) >= 0.9).length;
    if (matchedCount > 0) {
        btnOrganizeMatched.textContent = `Organiser les ${matchedCount} matchés`;
        btnOrganizeMatched.style.display = "inline-flex";
    } else {
        btnOrganizeMatched.style.display = "none";
    }

    // Restore scroll position
    if (tableWrap) tableWrap.scrollTop = scrollTop;
}

// Series search autocomplete
let searchTimeout = null;

fileTbody.addEventListener("input", (e) => {
    if (!e.target.classList.contains("series-search")) return;

    const input = e.target;
    const idx = input.dataset.index;
    const query = input.value.trim();

    // Hide add button when typing
    const wrap = input.closest(".series-search-wrap");
    const addBtn = wrap.querySelector(".btn-add-to");
    addBtn.style.display = "none";
    addBtn.removeAttribute("data-series");
    addBtn.removeAttribute("data-dest");

    clearTimeout(searchTimeout);
    const dropdown = wrap.querySelector(".series-dropdown");

    if (query.length < 2) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("open");
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search-series?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.results.length === 0) {
                dropdown.innerHTML = `<div class="dropdown-empty">Aucune série trouvée</div>`;
            } else {
                dropdown.innerHTML = data.results.map((r) =>
                    `<div class="dropdown-item" data-name="${escHtml(r.name)}" data-dest="${escHtml(r.destination)}">
                        <span class="dropdown-name">${escHtml(r.name)}</span>
                        <span class="dropdown-label">${escHtml(r.dest_label)}</span>
                    </div>`
                ).join("");
            }
            dropdown.classList.add("open");
        } catch {
            dropdown.innerHTML = "";
            dropdown.classList.remove("open");
        }
    }, 200);
});

// Keyboard navigation for dropdown
fileTbody.addEventListener("keydown", (e) => {
    if (!e.target.classList.contains("series-search")) return;

    const wrap = e.target.closest(".series-search-wrap");
    const dropdown = wrap.querySelector(".series-dropdown");
    if (!dropdown.classList.contains("open")) return;

    const items = dropdown.querySelectorAll(".dropdown-item");
    if (items.length === 0) return;

    const active = dropdown.querySelector(".dropdown-item.active");
    let idx = active ? [...items].indexOf(active) : -1;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        if (active) active.classList.remove("active");
        idx = (idx + 1) % items.length;
        items[idx].classList.add("active");
        items[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (active) active.classList.remove("active");
        idx = idx <= 0 ? items.length - 1 : idx - 1;
        items[idx].classList.add("active");
        items[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (active) {
            active.click();
        } else if (items.length > 0) {
            items[0].click();
        }
    } else if (e.key === "Escape") {
        e.preventDefault();
        dropdown.innerHTML = "";
        dropdown.classList.remove("open");
        e.target.blur();
    }
});

// Select from dropdown
fileTbody.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;

    const wrap = item.closest(".series-search-wrap");
    const input = wrap.querySelector(".series-search");
    const dropdown = wrap.querySelector(".series-dropdown");
    const addBtn = wrap.querySelector(".btn-add-to");

    const name = item.dataset.name;
    const dest = item.dataset.dest;
    const destLabel = item.querySelector(".dropdown-label").textContent;

    input.value = name;
    dropdown.innerHTML = "";
    dropdown.classList.remove("open");

    // Show add button
    addBtn.dataset.series = name;
    addBtn.dataset.dest = dest;
    addBtn.textContent = `+ ${destLabel}`;
    addBtn.title = `${destLabel}/${name}`;
    addBtn.style.display = "inline-flex";
});

// Close dropdown on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest(".series-search-wrap")) {
        document.querySelectorAll(".series-dropdown.open").forEach((d) => {
            d.innerHTML = "";
            d.classList.remove("open");
        });
    }
});

// Select all
selectAll.addEventListener("change", () => {
    document.querySelectorAll(".file-check").forEach((cb) => {
        cb.checked = selectAll.checked;
        cb.closest("tr").classList.toggle("selected", selectAll.checked);
    });
    // Sync group checkboxes
    document.querySelectorAll(".group-check").forEach((gc) => {
        gc.checked = selectAll.checked;
    });
    updatePreview();
});

// Group checkbox — select all files in the group
fileTbody.addEventListener("change", (e) => {
    if (!e.target.classList.contains("group-check")) return;
    const indices = e.target.dataset.groupIndices.split(",").map(Number);
    const checked = e.target.checked;
    indices.forEach((idx) => {
        const cb = fileTbody.querySelector(`.file-check[data-index="${idx}"]`);
        if (cb) {
            cb.checked = checked;
            cb.closest("tr").classList.toggle("selected", checked);
        }
    });
    autoFillFromSelection();
});

// "Add to" button — directly move file to existing series
fileTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-add-to");
    if (!btn || btn.disabled) return;

    const idx = parseInt(btn.dataset.index);
    const serName = btn.dataset.series;
    const dest = btn.dataset.dest;
    if (!serName || !dest) return;
    const file = filesData[idx];
    const tomeInput = fileTbody.querySelector(`.tome-input[data-index="${idx}"]`);
    const tome = tomeInput && tomeInput.value !== "" ? parseInt(tomeInput.value) : null;
    const source = appConfig.source_dir;

    // Disable button during request
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "...";

    try {
        const res = await fetch("/api/organize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                series_name: serName,
                destination: dest,
                source_dir: source,
                force: true,
                files: [{ source: file.name, tome }],
            }),
        });

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const r = data.results[0];
        if (r.success) {
            showToast(`${r.new_name} ajouté à ${serName}/`, "success");
            // Remove row from data and re-render
            filesData.splice(idx, 1);
            renderFiles();
        } else if (r.error) {
            showToast(`${file.name}: ${r.error}`, "error");
        }
    } catch {
        showToast("Erreur lors de l'ajout", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// Delete button
fileTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-delete");
    if (!btn || btn.disabled) return;

    const idx = parseInt(btn.dataset.index);
    const file = filesData[idx];

    btn.disabled = true;
    btn.textContent = "...";

    try {
        const res = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_dir: appConfig.source_dir,
                filename: file.name,
            }),
        });

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            btn.disabled = false;
            btn.textContent = "\u2715";
            return;
        }

        const deletedFile = filesData.splice(idx, 1)[0];
        renderFiles();
        showUndoToast(`${file.name} supprimé`, async () => {
            const r = await fetch("/api/undelete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_dir: appConfig.source_dir,
                    filename: deletedFile.name,
                }),
            });
            const d = await r.json();
            if (d.success) {
                showToast(`${deletedFile.name} restauré`, "success");
                await scanFiles();
            } else {
                showToast(d.error || "Erreur lors de la restauration", "error");
            }
        });
    } catch {
        showToast("Erreur lors de la suppression", "error");
        btn.disabled = false;
        btn.textContent = "\u2715";
    }
});

// Individual selection
fileTbody.addEventListener("change", (e) => {
    if (e.target.classList.contains("file-check")) {
        e.target.closest("tr").classList.toggle("selected", e.target.checked);
        const allChecks = document.querySelectorAll(".file-check");
        selectAll.checked = [...allChecks].every((cb) => cb.checked);
        autoFillFromSelection();
    }
    if (e.target.classList.contains("tome-input")) {
        updatePreview();
    }
});

fileTbody.addEventListener("input", (e) => {
    if (e.target.classList.contains("tome-input")) {
        updatePreview();
    }
});

// Auto-fill series name and destination from selected files
function autoFillFromSelection() {
    const checked = document.querySelectorAll(".file-check:checked");
    if (checked.length === 0) return;

    // Collect unique series matches and guesses from selected files
    const matches = new Map(); // name → {name, dest, dest_label, count}
    const guesses = new Map(); // guess → count

    checked.forEach((cb) => {
        const idx = parseInt(cb.dataset.index);
        const f = filesData[idx];
        if (f.series_match) {
            const key = f.series_match.name;
            if (!matches.has(key)) {
                matches.set(key, { ...f.series_match, count: 0 });
            }
            matches.get(key).count++;
        }
        if (f.series_guess) {
            guesses.set(f.series_guess, (guesses.get(f.series_guess) || 0) + 1);
        }
    });

    // If all selected share the same match, auto-fill both name and destination
    if (matches.size === 1) {
        const m = [...matches.values()][0];
        if (!seriesName.value.trim()) seriesName.value = m.name;
        if (!destination.value) destination.value = m.destination;
    }
    // Otherwise if all share the same guess, auto-fill just the name
    else if (guesses.size === 1 && !seriesName.value.trim()) {
        seriesName.value = [...guesses.keys()][0];
    }

    updatePreview();
}

// Action panel autocomplete
const actionDropdown = document.getElementById("action-dropdown");
let actionSearchTimeout = null;

seriesName.addEventListener("input", () => {
    updatePreview();
    const query = seriesName.value.trim();

    clearTimeout(actionSearchTimeout);
    if (query.length < 2) {
        actionDropdown.innerHTML = "";
        actionDropdown.classList.remove("open");
        return;
    }

    actionSearchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search-series?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.results.length === 0) {
                actionDropdown.innerHTML = `<div class="dropdown-empty">Aucune série trouvée</div>`;
            } else {
                actionDropdown.innerHTML = data.results.map((r) =>
                    `<div class="dropdown-item" data-name="${escHtml(r.name)}" data-dest="${escHtml(r.destination)}">
                        <span class="dropdown-name">${escHtml(r.name)}</span>
                        <span class="dropdown-label">${escHtml(r.dest_label)}</span>
                    </div>`
                ).join("");
            }
            actionDropdown.classList.add("open");
        } catch {
            actionDropdown.innerHTML = "";
            actionDropdown.classList.remove("open");
        }
    }, 200);
});

seriesName.addEventListener("keydown", (e) => {
    if (!actionDropdown.classList.contains("open")) return;
    const items = actionDropdown.querySelectorAll(".dropdown-item");
    if (items.length === 0) return;

    const active = actionDropdown.querySelector(".dropdown-item.active");
    let idx = active ? [...items].indexOf(active) : -1;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        if (active) active.classList.remove("active");
        idx = (idx + 1) % items.length;
        items[idx].classList.add("active");
        items[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (active) active.classList.remove("active");
        idx = idx <= 0 ? items.length - 1 : idx - 1;
        items[idx].classList.add("active");
        items[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (active) {
            active.click();
        } else if (items.length > 0) {
            items[0].click();
        }
    } else if (e.key === "Escape") {
        e.preventDefault();
        actionDropdown.innerHTML = "";
        actionDropdown.classList.remove("open");
    }
});

actionDropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;

    seriesName.value = item.dataset.name;
    destination.value = item.dataset.dest;
    actionDropdown.innerHTML = "";
    actionDropdown.classList.remove("open");
    updatePreview();
});

// Close action dropdown on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest(".action-search-wrap")) {
        actionDropdown.innerHTML = "";
        actionDropdown.classList.remove("open");
    }
});

// Update preview on destination change
destination.addEventListener("change", updatePreview);

function getSelectedFiles() {
    const selected = [];
    document.querySelectorAll(".file-check:checked").forEach((cb) => {
        const idx = parseInt(cb.dataset.index);
        const tomeInput = document.querySelector(`.tome-input[data-index="${idx}"]`);
        const tome = tomeInput.value !== "" ? parseInt(tomeInput.value) : null;
        selected.push({
            source: filesData[idx].name,
            tome: tome,
            index: idx,
        });
    });
    return selected;
}

function updatePreview() {
    const selected = getSelectedFiles();
    const name = seriesName.value.trim();
    const dest = destination.value;

    btnOrganize.disabled = selected.length === 0 || !name || !dest;

    if (selected.length === 0 || !name) {
        previewSection.style.display = "none";
        return;
    }

    previewSection.style.display = "block";
    previewList.innerHTML = selected.map((f) => {
        const ext = f.source.split(".").pop();
        const newName = f.tome !== null
            ? `${name} - T${String(f.tome).padStart(2, "0")}.${ext}`
            : `${name}.${ext}`;
        return `<li>
            <span class="preview-old">${f.source}</span>
            <span class="preview-arrow">&rarr;</span>
            <span class="preview-new">${newName}</span>
        </li>`;
    }).join("");
}

// Organize
async function doOrganize(force = false) {
    const selected = getSelectedFiles();
    const name = seriesName.value.trim();
    const dest = destination.value;
    const source = appConfig.source_dir;

    if (!name || !dest || selected.length === 0) return;

    btnOrganize.disabled = true;
    btnOrganize.textContent = "En cours...";

    try {
        const res = await fetch("/api/organize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                series_name: name,
                destination: dest,
                source_dir: source,
                force: force,
                files: selected.map((f) => ({
                    source: f.source,
                    tome: f.tome,
                })),
            }),
        });

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        // Warning: directory exists, ask for confirmation
        if (data.warning) {
            const existing = data.existing_files || [];
            const detail = existing.length > 0
                ? `\n\nFichiers existants :\n- ${existing.slice(0, 10).join("\n- ")}${existing.length > 10 ? `\n... et ${existing.length - 10} autres` : ""}`
                : "";
            if (confirm(`${data.warning}${detail}\n\nVoulez-vous continuer ?`)) {
                await doOrganize(true);
            }
            return;
        }

        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);

        if (successes.length > 0) {
            showToast(`${successes.length} fichier${successes.length > 1 ? "s" : ""} organisé${successes.length > 1 ? "s" : ""} dans ${name}/`, "success");
        }
        if (errors.length > 0) {
            errors.forEach((e) => showToast(`${e.source}: ${e.error}`, "error"));
        }

        // Refresh file list
        await scanFiles();
        seriesName.value = "";
        previewSection.style.display = "none";
    } catch {
        showToast("Erreur lors de l'organisation", "error");
    } finally {
        btnOrganize.disabled = false;
        btnOrganize.textContent = "Organiser les fichiers";
    }
}

btnOrganize.addEventListener("click", () => doOrganize(false));

function showUndoToast(message, onUndo) {
    const toast = document.createElement("div");
    toast.className = "toast success";
    toast.innerHTML = `<span>${escHtml(message)}</span> <button class="btn-undo" type="button">Annuler</button>`;
    toastContainer.appendChild(toast);

    const undoBtn = toast.querySelector(".btn-undo");
    let undone = false;
    undoBtn.addEventListener("click", async () => {
        if (undone) return;
        undone = true;
        toast.remove();
        await onUndo();
    });

    setTimeout(() => {
        if (!undone) {
            toast.classList.add("toast-out");
            toast.addEventListener("animationend", () => toast.remove());
        }
    }, 6000);
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3700);
}

// Batch organize all auto-matched files
btnOrganizeMatched.addEventListener("click", async () => {
    const matched = filesData.filter((f) => f.series_match && (f.match_score || 0) >= 0.9);
    if (matched.length === 0) return;

    if (!confirm(`Organiser ${matched.length} fichier${matched.length > 1 ? "s" : ""} automatiquement matchés ?`)) return;

    btnOrganizeMatched.disabled = true;
    btnOrganizeMatched.textContent = "En cours...";

    const items = matched.map((f) => ({
        source: f.name,
        series_name: f.series_match.name,
        destination: f.series_match.destination,
        tome: f.tome,
    }));

    try {
        const res = await fetch("/api/organize-matched", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_dir: appConfig.source_dir,
                items,
            }),
        });

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);

        if (successes.length > 0) {
            showToast(`${successes.length} fichier${successes.length > 1 ? "s" : ""} organisé${successes.length > 1 ? "s" : ""}`, "success");
        }
        errors.forEach((e) => showToast(`${e.source}: ${e.error}`, "error"));

        await scanFiles();
    } catch {
        showToast("Erreur lors de l'organisation batch", "error");
    } finally {
        btnOrganizeMatched.disabled = false;
    }
});

// Column sorting
document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
        const field = th.dataset.sort;
        if (sortField === field) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
            sortField = field;
            sortDir = "asc";
        }
        // Update header classes
        document.querySelectorAll("th.sortable").forEach((h) => {
            h.classList.remove("sort-asc", "sort-desc");
        });
        th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
        renderFiles();
    });
});

// Filter by match status
filterSelect.addEventListener("change", () => {
    filterMatch = filterSelect.value;
    renderFiles();
});

// ─── INIT ──────────────────────────────────────────────
async function init() {
    await loadConfig();
    populateDestinations();
    await scanFiles();
}

init();
