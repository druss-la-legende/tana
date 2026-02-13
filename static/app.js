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
let appConfig = { source_dir: "", destinations: [], template: "", template_no_tome: "", template_rules: [], lang: "fr" };

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
const btnRefreshFiles = document.getElementById("btn-refresh-files");
const filterSelect = document.getElementById("filter-match");
const toastContainer = document.getElementById("toast-container");

// ─── DOM REFS (config view) ────────────────────────────
const configSource = document.getElementById("config-source");
const configDestList = document.getElementById("config-dest-list");
const configNewDest = document.getElementById("config-new-dest");
const btnAddDest = document.getElementById("btn-add-dest");
const btnSaveConfig = document.getElementById("btn-save-config");
const configTemplate = document.getElementById("config-template");
const configTemplateNoTome = document.getElementById("config-template-no-tome");
const templatePreview = document.getElementById("template-preview");
const configRulesList = document.getElementById("config-rules-list");
const configNewRuleFilter = document.getElementById("config-new-rule-filter");
const configNewRuleTemplate = document.getElementById("config-new-rule-template");
const configNewRuleNoTome = document.getElementById("config-new-rule-no-tome");
const btnAddRule = document.getElementById("btn-add-rule");
const configLang = document.getElementById("config-lang");
const configAuditCase = document.getElementById("config-audit-case");
const configDashboardEnabled = document.getElementById("config-dashboard-enabled");
const configExtList = document.getElementById("config-ext-list");
const configNewExt = document.getElementById("config-new-ext");
const btnAddExt = document.getElementById("btn-add-ext");

// ─── DOM REFS (navigation) ─────────────────────────────
const navTabs = document.querySelectorAll(".nav-tab");

// ─── DOM REFS (history view) ──────────────────────────
const historyTbody = document.getElementById("history-tbody");
const historyFilterSelect = document.getElementById("history-filter-action");
const btnRefreshHistory = document.getElementById("btn-refresh-history");

// ─── DOM REFS (audit view) ────────────────────────────
const auditTbody = document.getElementById("audit-tbody");
const auditSummary = document.getElementById("audit-summary");
const auditControls = document.getElementById("audit-controls");
const auditFilterSelect = document.getElementById("audit-filter");
const auditSearchInput = document.getElementById("audit-search");
const btnRunAudit = document.getElementById("btn-run-audit");
const auditLoader = document.getElementById("audit-loader");

// ─── DOM REFS (convert view) ─────────────────────────
const convertPathInput = document.getElementById("convert-path");
const convertPathSuggestions = document.getElementById("convert-path-suggestions");
const btnScanCbr = document.getElementById("btn-scan-cbr");
const btnConvert = document.getElementById("btn-convert");
const convertDeleteOriginal = document.getElementById("convert-delete-original");
const convertTbody = document.getElementById("convert-tbody");
const convertSelectAll = document.getElementById("convert-select-all");
const convertProgress = document.getElementById("convert-progress");
const convertProgressText = document.getElementById("convert-progress-text");
const convertDpi = document.getElementById("convert-dpi");
const convertJpegQuality = document.getElementById("convert-jpeg-quality");
const convertQualityValue = document.getElementById("convert-quality-value");
const convertPdfOptions = document.getElementById("convert-pdf-options");

let filesData = [];
let sortField = null;  // "name", "series", "tome", "size"
let sortDir = "asc";   // "asc" or "desc"
let filterMatch = "all"; // "all", "matched", "suggested", "unmatched", "duplicates"

let convertData = [];
let convertCancelled = false;
const btnCancelConvert = document.getElementById("btn-cancel-convert");

let auditData = null;
let auditFilter = "all";
let auditSearch = "";
let historyData = [];
let historyFilterAction = "";

// ─── TRIAGE STATE ────────────────────────────────────
let triageFiles = [];
let triageIndex = 0;
let triageOpen = false;
let triageSearchTimeout = null;

// ─── DOM REFS (trash view) ───────────────────────────
const trashTbody = document.getElementById("trash-tbody");
const trashSelectAll = document.getElementById("trash-select-all");
const trashBadge = document.getElementById("trash-badge");
const trashInfo = document.getElementById("trash-info");
const btnPurgeTrash = document.getElementById("btn-purge-trash");
const btnRefreshTrash = document.getElementById("btn-refresh-trash");
const btnRestoreSelected = document.getElementById("btn-restore-selected");
const btnDeleteSelected = document.getElementById("btn-delete-selected");

let trashData = [];

// ─── DOM REFS (triage) ──────────────────────────────
const triageOverlay = document.getElementById("triage-overlay");
const triageCounter = document.getElementById("triage-counter");
const triageFilename = document.getElementById("triage-filename");
const triageFileSize = document.getElementById("triage-file-size");
const triageFileExt = document.getElementById("triage-file-ext");
const triageSeriesGuess = document.getElementById("triage-series-guess");
const triageConfidence = document.getElementById("triage-confidence");
const triageSeriesInput = document.getElementById("triage-series");
const triageDestination = document.getElementById("triage-destination");
const triageTome = document.getElementById("triage-tome");
const triageTitle = document.getElementById("triage-title");
const triageDropdown = document.getElementById("triage-dropdown");
const triagePreview = document.getElementById("triage-preview");
const btnTriage = document.getElementById("btn-triage");
const btnTriageClose = document.getElementById("btn-triage-close");
const btnTriageOrganize = document.getElementById("btn-triage-organize");
const btnTriageSkip = document.getElementById("btn-triage-skip");
const btnTriagePrev = document.getElementById("btn-triage-prev");
const btnTriageDelete = document.getElementById("btn-triage-delete");

// ─── DOM REFS (drop overlay & import) ───────────────
const dropOverlay = document.getElementById("drop-overlay");
const btnImportFiles = document.getElementById("btn-import-files");
const fileInputHidden = document.getElementById("file-input-hidden");
let uploadInProgress = false;

// ─── LANGUAGE ─────────────────────────────────────────
configLang.addEventListener("change", () => {
    setLang(configLang.value);
    // Re-render dynamic content
    renderFiles();
    if (auditData) {
        renderAuditSummary();
        renderAuditTable();
    }
    renderHistory();
    renderConvertTable();
    updateConvertButton();
    if (trashData.length > 0) renderTrashTable();
});

// ─── NAVIGATION ────────────────────────────────────────
navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const view = tab.dataset.view;
        navTabs.forEach((t2) => t2.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll("main > section[id^='view-']").forEach((s) => {
            s.style.display = s.id === `view-${view}` ? "" : "none";
        });

        if (view === "dashboard") loadDashboard();
        if (view === "config") loadConfigUI();
        if (view === "history") loadHistory();
        if (view === "trash") loadTrash();
    });
});

// ─── CONFIG LOADING ────────────────────────────────────
async function loadConfig() {
    try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error(res.status);
        appConfig = await res.json();
        // Apply language from config
        const lang = appConfig.lang || localStorage.getItem("tana_lang") || "fr";
        setLang(lang);
    } catch {
        showToast(t("config.error.load"), "error");
    }
}

function populateDestinations() {
    destination.innerHTML = `<option value="">${t("action.choose")}</option>`;
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
    configTemplate.value = appConfig.template || "{series} - T{tome:02d}{ext}";
    configTemplateNoTome.value = appConfig.template_no_tome || "{series}{ext}";
    configLang.value = appConfig.lang || "fr";
    configAuditCase.value = appConfig.audit_case || "first";
    configDashboardEnabled.checked = !!appConfig.dashboard_enabled;
    if (!appConfig.template_rules) appConfig.template_rules = [];
    if (!appConfig.extensions) appConfig.extensions = [".cbr", ".cbz", ".pdf"];
    renderExtList();
    renderDestList();
    renderRulesList();
    updateTemplatePreview();
}

function renderRulesList() {
    configRulesList.innerHTML = "";
    (appConfig.template_rules || []).forEach((rule, i) => {
        const li = document.createElement("li");
        li.className = "config-dest-item config-rule-item";
        li.innerHTML = `
            <div class="config-rule-info">
                <span class="config-rule-filter">${escHtml(rule.filter)}</span>
                <span class="config-rule-tpl">${escHtml(rule.template)}</span>
                ${rule.template_no_tome ? `<span class="config-rule-tpl-nt">${escHtml(rule.template_no_tome)}</span>` : ""}
            </div>
            <button class="btn-dest-remove" type="button" data-rule-index="${i}" title="${t("config.delete")}">&times;</button>
        `;
        configRulesList.appendChild(li);
    });
}

configRulesList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-dest-remove");
    if (!btn || btn.dataset.ruleIndex === undefined) return;
    const idx = parseInt(btn.dataset.ruleIndex);
    appConfig.template_rules.splice(idx, 1);
    renderRulesList();
});

btnAddRule.addEventListener("click", () => {
    const filter = configNewRuleFilter.value.trim();
    const template = configNewRuleTemplate.value.trim();
    const noTome = configNewRuleNoTome.value.trim();
    if (!filter) { showToast(t("config.error.filter_required"), "error"); return; }
    if (!template) { showToast(t("config.error.template_required"), "error"); return; }
    if (!appConfig.template_rules) appConfig.template_rules = [];
    appConfig.template_rules.push({ filter, template, template_no_tome: noTome });
    configNewRuleFilter.value = "";
    configNewRuleTemplate.value = "";
    configNewRuleNoTome.value = "";
    renderRulesList();
});

async function updateTemplatePreview() {
    const template = configTemplate.value.trim();
    if (!template) { templatePreview.textContent = ""; return; }
    try {
        const res = await fetch("/api/template-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template, series: "One Piece", tome: 5, ext: ".cbz" }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        templatePreview.textContent = data.preview || "";
    } catch { templatePreview.textContent = ""; }
}

configTemplate.addEventListener("input", updateTemplatePreview);
configTemplateNoTome.addEventListener("input", updateTemplatePreview);

function renderExtList() {
    configExtList.innerHTML = "";
    appConfig.extensions.forEach((ext, i) => {
        const li = document.createElement("li");
        li.className = "config-dest-item";
        li.innerHTML = `
            <span class="config-dest-path">${escHtml(ext)}</span>
            <button class="btn-dest-remove" type="button" data-ext-index="${i}" title="${t("config.delete")}">&times;</button>
        `;
        configExtList.appendChild(li);
    });
}

configExtList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-dest-remove");
    if (!btn || btn.dataset.extIndex === undefined) return;
    const idx = parseInt(btn.dataset.extIndex);
    appConfig.extensions.splice(idx, 1);
    renderExtList();
});

btnAddExt.addEventListener("click", () => {
    let val = configNewExt.value.trim().toLowerCase();
    if (!val) return;
    if (!val.startsWith(".")) val = "." + val;
    if (appConfig.extensions.includes(val)) {
        showToast(t("config.error.duplicate_ext"), "error");
        return;
    }
    appConfig.extensions.push(val);
    configNewExt.value = "";
    renderExtList();
});

configNewExt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnAddExt.click();
});

function renderDestList() {
    configDestList.innerHTML = "";
    appConfig.destinations.forEach((dest, i) => {
        const li = document.createElement("li");
        li.className = "config-dest-item";
        li.innerHTML = `
            <span class="config-dest-path">${escHtml(dest)}</span>
            <button class="btn-dest-remove" type="button" data-index="${i}" title="${t("config.delete")}">&times;</button>
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
        showToast(t("config.error.duplicate_dest"), "error");
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
        showToast(t("config.error.source_required"), "error");
        return;
    }
    if (appConfig.destinations.length === 0) {
        showToast(t("config.error.dest_required"), "error");
        return;
    }

    btnSaveConfig.disabled = true;
    btnSaveConfig.textContent = t("action.in_progress");

    try {
        const res = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_dir: sourceDir,
                destinations: appConfig.destinations,
                extensions: appConfig.extensions || [".cbr", ".cbz", ".pdf"],
                template: configTemplate.value.trim(),
                template_no_tome: configTemplateNoTome.value.trim(),
                template_rules: appConfig.template_rules || [],
                audit_case: configAuditCase.value,
                dashboard_enabled: configDashboardEnabled.checked,
                lang: configLang.value,
            }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        if (data.error) {
            showToast(data.error, "error");
            return;
        }
        appConfig = data.config;
        populateDestinations();
        applyDashboardToggle();
        dashboardLoaded = false;
        if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach((w) => showToast(t(w.message_key, { path: w.path }), "warning"));
            showToast(t("config.saved_with_warnings"), "success");
        } else {
            showToast(t("config.saved"), "success");
        }
    } catch {
        showToast(t("config.error.save"), "error");
    } finally {
        btnSaveConfig.disabled = false;
        btnSaveConfig.textContent = t("config.btn_save");
    }
});

// ─── SCAN FILES ────────────────────────────────────────
async function scanFiles() {
    const source = appConfig.source_dir;
    if (!source) return;

    try {
        const res = await fetch(`/api/files?source=${encodeURIComponent(source)}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        filesData = data.files;
        renderFiles();
    } catch {
        showToast(t("scan.error"), "error");
    }
}

function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function highlightDiff(source, target) {
    // Find common prefix
    let pre = 0;
    while (pre < source.length && pre < target.length && source[pre] === target[pre]) pre++;
    // Find common suffix (no overlap with prefix)
    let suf = 0;
    while (suf < (source.length - pre) && suf < (target.length - pre) && source[source.length - 1 - suf] === target[target.length - 1 - suf]) suf++;

    const prefix = source.slice(0, pre);
    const diff = source.slice(pre, source.length - suf || undefined);
    const suffix = suf > 0 ? source.slice(source.length - suf) : "";

    if (!diff && source.length === target.length) return escHtml(source);
    const diffHtml = diff ? escHtml(diff) : '<span class="diff-insert-marker"></span>';
    return `${escHtml(prefix)}<span class="diff-highlight">${diffHtml}</span>${escHtml(suffix)}`;
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
    const pct = Math.round(score * 100);
    const confBadge = isHighConf
        ? `<span class="conf-badge conf-high" title="${t("files.match_pct", { pct })}">&#10003;</span>`
        : (isSuggestion
            ? `<span class="conf-badge conf-suggest" title="${t("files.suggestion_pct", { pct })}">?</span>`
            : `<span class="conf-badge conf-none" title="${t("files.no_match")}">&#x2015;</span>`);

    const dupClass = f.duplicate ? " duplicate-row" : "";
    const dupBadge = f.duplicate ? `<span class="duplicate-badge" title="${t("files.duplicate_title")}">${t("files.duplicate_badge")}</span>` : "";
    return `<tr data-index="${i}" class="${confClass}${dupClass}${extraClass ? " " + extraClass : ""}">
        <td class="col-check"><input type="checkbox" class="file-check" data-index="${i}"></td>
        <td class="col-name"><span class="file-name">${escHtml(baseName)}<span class="file-ext">.${escHtml(ext)}</span></span>${dupBadge}</td>
        <td class="col-series"><span class="series-guess">${escHtml(guess)}</span> ${confBadge}</td>
        <td class="col-search-ext">${guess ? `<a class="btn-ext-search" href="https://www.nautiljon.com/search.php?q=${encodeURIComponent(guess)}" target="_blank" rel="noopener" title="Nautiljon"><span class="ext-label">N</span></a><a class="btn-ext-search" href="https://www.manga-news.com/index.php/recherche/?q=${encodeURIComponent(guess)}" target="_blank" rel="noopener" title="Manga-News"><span class="ext-label">M</span></a>` : ""}</td>
        <td class="col-match">
            <div class="series-search-wrap">
                <input type="text" class="series-search" data-index="${i}" value="${escHtml(searchVal)}" placeholder="${t("files.search_placeholder")}" autocomplete="off">
                <div class="series-dropdown" data-index="${i}"></div>
                ${btnHtml}
            </div>
        </td>
        <td class="col-tome">${tomeDisplay}</td>
        <td class="col-title"><input type="text" class="title-input" data-index="${i}" value="" placeholder="${t("files.title_placeholder")}" autocomplete="off"></td>
        <td class="col-size">${f.size_human}</td>
        <td class="col-actions"><button class="btn-delete" type="button" data-index="${i}" title="${t("config.delete")} ${escHtml(f.name)}">&#x2715;</button></td>
    </tr>`;
}

function getDisplayFiles() {
    let items = filesData.map((f, i) => ({ file: f, index: i }));

    if (filterMatch === "matched") {
        items = items.filter(({ file: f }) => f.series_match && (f.match_score || 0) >= 0.9);
    } else if (filterMatch === "suggested") {
        items = items.filter(({ file: f }) => f.series_match && (f.match_score || 0) >= 0.6 && (f.match_score || 0) < 0.9);
    } else if (filterMatch === "unmatched") {
        items = items.filter(({ file: f }) => !f.series_match);
    } else if (filterMatch === "duplicates") {
        items = items.filter(({ file: f }) => f.duplicate);
    }

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
    const tableWrap = document.querySelector(".file-table-wrap");
    const scrollTop = tableWrap ? tableWrap.scrollTop : 0;

    if (filesData.length === 0) {
        const exts = (appConfig.extensions || [".cbr", ".cbz", ".pdf"]).map((e) => e.replace(".", "").toUpperCase()).join(", ");
        fileTbody.innerHTML = `<tr class="empty-row"><td colspan="9">
            <div class="empty-dropzone" id="empty-dropzone">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="empty-dropzone-title">${t("upload.empty_title")}</span>
                <span class="empty-dropzone-sub">${t("upload.empty_sub", { exts })}</span>
            </div>
        </td></tr>`;
        fileCount.textContent = t("files.count", { count: 0 });
        btnTriage.style.display = "none";
        document.getElementById("empty-dropzone")?.addEventListener("click", () => fileInputHidden.click());
        return;
    }

    const displayItems = getDisplayFiles();
    const total = filesData.length;
    const shown = displayItems.length;
    if (filterMatch !== "all" && shown !== total) {
        fileCount.textContent = total > 1
            ? t("files.count_filtered_plural", { shown, total })
            : t("files.count_filtered", { shown, total });
    } else {
        fileCount.textContent = total > 1
            ? t("files.count_plural", { count: total })
            : t("files.count", { count: total });
    }

    if (displayItems.length === 0) {
        fileTbody.innerHTML = `<tr class="empty-row"><td colspan="9">${t("files.empty_filter")}</td></tr>`;
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
            groups.set(key, { label: f.series_guess || t("files.no_series"), files: [] });
        }
        groups.get(key).files.push({ file: f, index: i });
    });

    const multiFileGroups = [...groups.values()].filter((g) => g.files.length > 1);
    const useGrouping = multiFileGroups.length > 0 && groups.size > 1;

    let sortedGroups = [...groups.entries()];
    if (useGrouping && sortField) {
        const dir = sortDir === "asc" ? 1 : -1;
        sortedGroups.sort(([, a], [, b]) => {
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
            if (groupIdx > 0) {
                html += `<tr class="group-spacer"><td colspan="9"></td></tr>`;
            }
            if (group.files.length > 1) {
                html += `<tr class="group-header" data-group-indices="${indices.join(",")}">
                    <td class="col-check"><input type="checkbox" class="group-check" data-group-indices="${indices.join(",")}"></td>
                    <td colspan="8"><span class="group-label">${escHtml(group.label)}</span><span class="group-count">${group.files.length}</span></td>
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

    const matchedCount = filesData.filter((f) => f.series_match && (f.match_score || 0) >= 0.9).length;
    if (matchedCount > 0) {
        btnOrganizeMatched.textContent = t("files.organize_n_matched", { count: matchedCount });
        btnOrganizeMatched.style.display = "inline-flex";
    } else {
        btnOrganizeMatched.style.display = "none";
    }

    btnTriage.style.display = filesData.length > 0 ? "inline-flex" : "none";

    if (tableWrap) tableWrap.scrollTop = scrollTop;
}

// Series search autocomplete
let searchTimeout = null;

fileTbody.addEventListener("input", (e) => {
    if (!e.target.classList.contains("series-search")) return;

    const input = e.target;
    const idx = input.dataset.index;
    const query = input.value.trim();

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
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            if (data.results.length === 0) {
                dropdown.innerHTML = `<div class="dropdown-empty">${t("scan.no_series")}</div>`;
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
    document.querySelectorAll(".group-check").forEach((gc) => {
        gc.checked = selectAll.checked;
    });
    updatePreview();
});

// Group checkbox
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

// "Add to" button
fileTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-add-to");
    if (!btn || btn.disabled) return;

    const idx = parseInt(btn.dataset.index);
    const serName = btn.dataset.series;
    const dest = btn.dataset.dest;
    if (!serName || !dest) return;
    const file = filesData[idx];
    const tomeInput = fileTbody.querySelector(`.tome-input[data-index="${idx}"]`);
    const titleInput = fileTbody.querySelector(`.title-input[data-index="${idx}"]`);
    const tome = tomeInput && tomeInput.value !== "" ? parseInt(tomeInput.value) : null;
    const title = titleInput ? titleInput.value.trim() : "";
    const source = appConfig.source_dir;

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
                files: [{ source: file.name, tome, title }],
            }),
        });
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const r = data.results[0];
        if (r.success) {
            showToast(t("organize.added", { name: r.new_name, series: serName }), "success");
            filesData.splice(idx, 1);
            renderFiles();
        } else if (r.error) {
            showToast(`${file.name}: ${r.error}`, "error");
        }
    } catch {
        showToast(t("organize.error.add"), "error");
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
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            btn.disabled = false;
            btn.textContent = "\u2715";
            return;
        }

        const deletedFile = filesData.splice(idx, 1)[0];
        renderFiles();
        showUndoToast(t("delete.deleted", { name: file.name }), async () => {
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
                showToast(t("delete.restored", { name: deletedFile.name }), "success");
                await scanFiles();
            } else {
                showToast(d.error || t("delete.error.restore"), "error");
            }
        });
    } catch {
        showToast(t("delete.error"), "error");
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
    if (e.target.classList.contains("tome-input") || e.target.classList.contains("title-input")) {
        updatePreview();
    }
});

// Auto-fill series name and destination from selected files
function autoFillFromSelection() {
    const checked = document.querySelectorAll(".file-check:checked");
    if (checked.length === 0) return;

    const matches = new Map();
    const guesses = new Map();

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

    if (matches.size === 1) {
        const m = [...matches.values()][0];
        if (!seriesName.value.trim()) seriesName.value = m.name;
        if (!destination.value) destination.value = m.destination;
    } else if (guesses.size === 1 && !seriesName.value.trim()) {
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
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            if (data.results.length === 0) {
                actionDropdown.innerHTML = `<div class="dropdown-empty">${t("scan.no_series")}</div>`;
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

document.addEventListener("click", (e) => {
    if (!e.target.closest(".action-search-wrap")) {
        actionDropdown.innerHTML = "";
        actionDropdown.classList.remove("open");
    }
});

destination.addEventListener("change", updatePreview);

function getSelectedFiles() {
    const selected = [];
    document.querySelectorAll(".file-check:checked").forEach((cb) => {
        const idx = parseInt(cb.dataset.index);
        const tomeInput = document.querySelector(`.tome-input[data-index="${idx}"]`);
        const titleInput = document.querySelector(`.title-input[data-index="${idx}"]`);
        const tome = tomeInput.value !== "" ? parseInt(tomeInput.value) : null;
        const title = titleInput ? titleInput.value.trim() : "";
        selected.push({
            source: filesData[idx].name,
            tome: tome,
            title: title,
            index: idx,
        });
    });
    return selected;
}

function applyTemplateClient(template, series, tome, ext, title) {
    let result = template;
    result = result.replace("{series}", series);
    result = result.replace("{tome:03d}", tome !== null ? String(tome).padStart(3, "0") : "");
    result = result.replace("{tome:02d}", tome !== null ? String(tome).padStart(2, "0") : "");
    result = result.replace("{tome}", tome !== null ? String(tome) : "");
    result = result.replace("{title}", title || "");
    result = result.replace("{ext}", ext.toLowerCase());
    result = result.replace("{EXT}", ext.toUpperCase());
    if (!title) {
        result = result.replace(/\s*-\s*-/g, " -");
        result = result.replace(/\s*-\s*\./g, ".");
    }
    return result;
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

    let tpl = appConfig.template || "{series} - T{tome:02d}{ext}";
    let tplNoTome = appConfig.template_no_tome || "{series}{ext}";
    const destLower = dest.toLowerCase();
    for (const rule of (appConfig.template_rules || [])) {
        if (rule.filter && destLower.includes(rule.filter.toLowerCase())) {
            tpl = rule.template || tpl;
            tplNoTome = rule.template_no_tome || tplNoTome;
            break;
        }
    }

    previewSection.style.display = "block";
    previewList.innerHTML = selected.map((f) => {
        const ext = "." + f.source.split(".").pop();
        const template = f.tome !== null ? tpl : tplNoTome;
        const newName = applyTemplateClient(template, name, f.tome, ext, f.title);
        const isDup = filesData[f.index] && filesData[f.index].duplicate;
        return `<li>
            <span class="preview-old">${f.source}</span>
            <span class="preview-arrow">&rarr;</span>
            <span class="preview-new">${newName}</span>
            ${isDup ? `<span class="duplicate-preview-warn" title="${t("files.duplicate_title")}">&#x26A0;</span>` : ""}
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
    btnOrganize.textContent = t("action.in_progress");

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
                    title: f.title,
                })),
            }),
        });
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        if (data.warning) {
            const existing = data.existing_files || [];
            const detail = existing.length > 0
                ? `\n\n${t("organize.confirm_existing")}\n- ${existing.slice(0, 10).join("\n- ")}${existing.length > 10 ? `\n${t("organize.confirm_more", { count: existing.length - 10 })}` : ""}`
                : "";
            if (confirm(`${data.warning}${detail}\n\n${t("organize.confirm_continue")}`)) {
                await doOrganize(true);
            }
            return;
        }

        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);

        if (successes.length > 0) {
            showToast(t("organize.success", { count: successes.length, name }), "success");
        }
        if (errors.length > 0) {
            errors.forEach((e) => showToast(`${e.source}: ${e.error}`, "error"));
        }

        await scanFiles();
        seriesName.value = "";
        previewSection.style.display = "none";
    } catch {
        showToast(t("organize.error"), "error");
    } finally {
        btnOrganize.disabled = false;
        btnOrganize.textContent = t("action.btn_organize");
    }
}

btnOrganize.addEventListener("click", () => doOrganize(false));

function showUndoToast(message, onUndo) {
    const toast = document.createElement("div");
    toast.className = "toast success";
    toast.innerHTML = `<span>${escHtml(message)}</span> <button class="btn-undo" type="button">${t("delete.undo")}</button>`;
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

// Refresh files
btnRefreshFiles.addEventListener("click", () => scanFiles());

// Batch organize all auto-matched files
btnOrganizeMatched.addEventListener("click", async () => {
    const matched = filesData.filter((f) => f.series_match && (f.match_score || 0) >= 0.9);
    if (matched.length === 0) return;

    if (!confirm(t("organize.batch_confirm", { count: matched.length }))) return;

    btnOrganizeMatched.disabled = true;
    btnOrganizeMatched.textContent = t("action.in_progress");

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
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);

        if (successes.length > 0) {
            showToast(t("organize.batch_success", { count: successes.length }), "success");
        }
        errors.forEach((e) => showToast(`${e.source}: ${e.error}`, "error"));

        await scanFiles();
    } catch {
        showToast(t("organize.batch_error"), "error");
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

// ─── HISTORY ────────────────────────────────────────────
async function loadHistory() {
    try {
        let url = "/api/history";
        if (historyFilterAction) url += `?action=${encodeURIComponent(historyFilterAction)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        historyData = data.history;
        renderHistory();
    } catch {
        showToast(t("history.error"), "error");
    }
}

function isReversible(h) {
    if (h.action === "organize" || h.action === "organize_batch") return true;
    if (h.action === "fix_naming") return true;
    if (h.action === "convert" && h.deleted_original === false) return true;
    return false;
}

function renderHistory() {
    if (historyData.length === 0) {
        historyTbody.innerHTML = `<tr class="empty-row"><td colspan="5">${t("history.empty")}</td></tr>`;
        return;
    }

    const actionLabels = {
        organize: t("history.action.organize"),
        organize_batch: t("history.action.organize_batch"),
        delete: t("history.action.delete"),
        undelete: t("history.action.undelete"),
        fix_naming: t("history.action.fix_naming"),
        convert: t("history.action.convert"),
        upload: t("history.action.upload"),
        undo_organize: t("history.action.undo_organize"),
        undo_fix_naming: t("history.action.undo_fix_naming"),
        undo_convert: t("history.action.undo_convert"),
        purge_trash: t("history.action.purge_trash"),
    };

    historyTbody.innerHTML = historyData.map((h, i) => {
        const label = actionLabels[h.action] || h.action;
        const ts = h.timestamp.replace("T", " ");
        let detail = "";
        if (h.action === "organize" || h.action === "organize_batch") {
            detail = `${escHtml(h.source || "")} &rarr; ${escHtml(h.new_name || "")}`;
        } else if (h.action === "delete" || h.action === "undelete") {
            detail = escHtml(h.filename || "");
        } else if (h.action === "fix_naming") {
            detail = `${escHtml(h.current || "")} &rarr; ${escHtml(h.expected || "")}`;
        } else if (h.action === "convert") {
            detail = `${escHtml(h.source || "")} &rarr; ${escHtml(h.destination || "")}`;
        } else if (h.action === "upload") {
            detail = escHtml(h.filename || "");
        } else if (h.action === "purge_trash") {
            detail = `${h.deleted_count || 0} fichier(s)`;
        } else if (h.action.startsWith("undo_")) {
            detail = escHtml(h.source || h.deleted || h.current || "");
        }

        const undoBtn = isReversible(h)
            ? `<button class="btn-history-undo" type="button" data-entry-index="${i}">${t("history.undo")}</button>`
            : "";

        return `<tr class="history-row">
            <td class="col-history-time">${escHtml(ts)}</td>
            <td class="col-history-action"><span class="history-action-badge history-action-${h.action}">${escHtml(label)}</span></td>
            <td class="col-history-detail">${detail}</td>
            <td class="col-history-series">${escHtml(h.series || "")}</td>
            <td class="col-history-undo">${undoBtn}</td>
        </tr>`;
    }).join("");
}

historyFilterSelect.addEventListener("change", () => {
    historyFilterAction = historyFilterSelect.value;
    loadHistory();
});

btnRefreshHistory.addEventListener("click", loadHistory);

historyTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-history-undo");
    if (!btn || btn.disabled) return;

    const idx = parseInt(btn.dataset.entryIndex);
    const entry = historyData[idx];
    if (!entry) return;

    if (!confirm(t("history.undo_confirm"))) return;

    btn.disabled = true;
    btn.textContent = "...";

    try {
        const res = await fetch("/api/undo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
            showToast(data.error || t("history.undo_error"), "error");
            return;
        }
        if (data.success) {
            showToast(t("history.undo_success"), "success");
            await loadHistory();
            await scanFiles();
        }
    } catch {
        showToast(t("history.undo_error"), "error");
    } finally {
        btn.disabled = false;
        btn.textContent = t("history.undo");
    }
});

// ─── AUDIT ──────────────────────────────────────────────
async function runAudit() {
    btnRunAudit.disabled = true;
    btnRunAudit.textContent = t("audit.in_progress");
    auditLoader.style.display = "";
    auditSummary.innerHTML = "";
    auditTbody.innerHTML = "";
    auditControls.style.display = "none";
    try {
        const res = await fetch("/api/audit");
        if (!res.ok) throw new Error(res.status);
        auditData = await res.json();
        auditControls.style.display = "flex";
        renderAuditSummary();
        renderAuditTable();
    } catch {
        showToast(t("audit.error"), "error");
    } finally {
        auditLoader.style.display = "none";
        btnRunAudit.disabled = false;
        btnRunAudit.textContent = t("audit.btn.rerun");
    }
}

function renderAuditSummary() {
    const s = auditData.summary;
    auditSummary.innerHTML = `
        <div class="audit-stat"><span class="audit-stat-value">${s.total_series}</span><span class="audit-stat-label">${t("audit.stat.series")}</span></div>
        <div class="audit-stat${s.series_with_gaps > 0 ? " audit-stat-warning" : ""}"><span class="audit-stat-value">${s.series_with_gaps}</span><span class="audit-stat-label">${t("audit.stat.missing_tomes")}</span></div>
        <div class="audit-stat${s.series_with_naming_issues > 0 ? " audit-stat-warning" : ""}"><span class="audit-stat-value">${s.series_with_naming_issues}</span><span class="audit-stat-label">${t("audit.stat.naming")}</span></div>
        <div class="audit-stat"><span class="audit-stat-value">${s.empty_folders}</span><span class="audit-stat-label">${t("audit.stat.empty")}</span></div>
        <div class="audit-stat"><span class="audit-stat-value">${s.single_file_series}</span><span class="audit-stat-label">${t("audit.stat.single")}</span></div>
        <div class="audit-stat${s.duplicate_tomes > 0 ? " audit-stat-warning" : ""}"><span class="audit-stat-value">${s.duplicate_tomes}</span><span class="audit-stat-label">${t("audit.stat.duplicates")}</span></div>
    `;
}

function getFilteredAuditSeries() {
    let series = auditData.series;

    if (auditSearch) {
        const q = auditSearch.toLowerCase();
        series = series.filter((s) => s.series_name.toLowerCase().includes(q));
    }

    if (auditFilter === "gaps") series = series.filter((s) => s.missing_tomes.length > 0);
    else if (auditFilter === "naming") series = series.filter((s) => s.naming_issues.length > 0);
    else if (auditFilter === "empty") series = series.filter((s) => s.is_empty);
    else if (auditFilter === "single") series = series.filter((s) => s.file_count === 1);
    else if (auditFilter === "duplicates") series = series.filter((s) => s.duplicate_tomes.length > 0);
    else if (auditFilter === "issues") series = series.filter((s) => s.has_issues);

    return series;
}

function renderAuditTable() {
    const series = getFilteredAuditSeries();

    if (series.length === 0) {
        auditTbody.innerHTML = `<tr class="empty-row"><td colspan="6">${t("audit.empty")}</td></tr>`;
        return;
    }

    let html = "";
    series.forEach((s, i) => {
        const issues = [];
        if (s.missing_tomes.length) issues.push(`<span class="audit-badge audit-badge-gap">${t("audit.badge.missing", { count: s.missing_tomes.length })}</span>`);
        if (s.naming_issues.length) issues.push(`<span class="audit-badge audit-badge-naming">${t("audit.badge.naming", { count: s.naming_issues.length })}</span>`);
        if (s.duplicate_tomes.length) issues.push(`<span class="audit-badge audit-badge-dup">${t("audit.badge.duplicate", { count: s.duplicate_tomes.length })}</span>`);
        if (s.mixed_extensions) issues.push(`<span class="audit-badge audit-badge-ext">${s.extensions.join(", ")}</span>`);
        if (s.is_empty) issues.push(`<span class="audit-badge audit-badge-empty">${t("audit.badge.empty")}</span>`);
        if (!s.is_empty && s.file_count === 1) issues.push(`<span class="audit-badge audit-badge-single">${t("audit.badge.single")}</span>`);

        const missingDisplay = s.missing_tomes.length > 0
            ? `T${s.missing_tomes.map((t2) => String(t2).padStart(2, "0")).join(", T")}`
            : "";

        html += `<tr class="audit-row${s.has_issues ? " audit-has-issues" : ""}" data-audit-index="${i}">
            <td class="col-audit-expand"><button class="btn-audit-expand" data-audit-index="${i}" type="button">&#9654;</button></td>
            <td class="col-audit-series">${escHtml(s.series_name)}</td>
            <td class="col-audit-dest"><span class="audit-dest-label">${escHtml(s.dest_label)}</span></td>
            <td class="col-audit-count">${s.file_count}</td>
            <td class="col-audit-missing">${missingDisplay}</td>
            <td class="col-audit-issues">${issues.join(" ")}</td>
        </tr>
        <tr class="audit-detail" id="audit-detail-${i}" style="display:none">
            <td colspan="6">
                <div class="audit-detail-content" id="audit-detail-content-${i}"></div>
            </td>
        </tr>`;
    });

    auditTbody.innerHTML = html;
}

function renderAuditDetail(index) {
    const s = getFilteredAuditSeries()[index];
    const container = document.getElementById(`audit-detail-content-${index}`);

    let html = "";

    if (s.naming_issues.length > 0) {
        html += `<div class="audit-detail-section">
            <h4>${t("audit.detail.naming")}</h4>
            <button class="btn-fix-all-naming" data-dest="${escHtml(s.destination)}" data-series="${escHtml(s.series_name)}" type="button">${t("audit.detail.fix_all")}</button>
            <ul class="audit-naming-list">`;
        s.naming_issues.forEach((issue) => {
            html += `<li>
                <span class="preview-old">${highlightDiff(issue.current, issue.expected)}</span>
                <span class="preview-arrow">&rarr;</span>
                <span class="preview-new">${escHtml(issue.expected)}</span>
            </li>`;
        });
        html += `</ul></div>`;
    }

    if (s.missing_tomes.length > 0) {
        html += `<div class="audit-detail-section"><h4>${t("audit.detail.missing")}</h4><p class="audit-missing-list">`;
        html += s.missing_tomes.map((t2) => `<span class="audit-missing-tome">T${String(t2).padStart(2, "0")}</span>`).join(" ");
        html += `</p></div>`;
    }

    if (s.duplicate_tomes.length > 0) {
        html += `<div class="audit-detail-section"><h4>${t("audit.detail.duplicates")}</h4><p>`;
        html += s.duplicate_tomes.map((d) => `T${String(d.tome).padStart(2, "0")} (${d.count}x)`).join(", ");
        html += `</p></div>`;
    }

    html += `<div class="audit-detail-section"><h4>${t("audit.detail.files", { count: s.files.length })}</h4><ul class="audit-file-list">`;
    s.files.forEach((f) => {
        html += `<li><span class="file-name">${escHtml(f.name)}</span> <span class="audit-file-size">${f.size_human}</span></li>`;
    });
    html += `</ul></div>`;

    container.innerHTML = html;
}

// Audit event delegation
auditTbody.addEventListener("click", (e) => {
    const expandBtn = e.target.closest(".btn-audit-expand");
    if (expandBtn) {
        const idx = expandBtn.dataset.auditIndex;
        const detail = document.getElementById(`audit-detail-${idx}`);
        const isOpen = detail.style.display !== "none";
        detail.style.display = isOpen ? "none" : "";
        expandBtn.innerHTML = isOpen ? "&#9654;" : "&#9660;";
        if (!isOpen) renderAuditDetail(parseInt(idx));
        return;
    }

    const fixBtn = e.target.closest(".btn-fix-all-naming");
    if (fixBtn) {
        fixNaming(fixBtn.dataset.dest, fixBtn.dataset.series);
        return;
    }
});

async function fixNaming(dest, seriesNameVal) {
    const s = auditData.series.find((x) => x.destination === dest && x.series_name === seriesNameVal);
    if (!s || !s.naming_issues.length) return;

    const fixes = s.naming_issues.map((issue) => ({
        destination: dest,
        series_name: seriesNameVal,
        current: issue.current,
        expected: issue.expected,
    }));

    try {
        const res = await fetch("/api/audit/fix-naming", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fixes }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);
        if (successes.length > 0) showToast(t("audit.fix.success", { count: successes.length }), "success");
        errors.forEach((err) => showToast(`${err.current}: ${err.error}`, "error"));
        await runAudit();
    } catch {
        showToast(t("audit.fix.error"), "error");
    }
}

auditFilterSelect.addEventListener("change", () => {
    auditFilter = auditFilterSelect.value;
    renderAuditTable();
});

auditSearchInput.addEventListener("input", () => {
    auditSearch = auditSearchInput.value.trim();
    renderAuditTable();
});

btnRunAudit.addEventListener("click", runAudit);

// ─── CONVERT CBR → CBZ ─────────────────────────────────

let convertSeriesFolders = [];

async function loadSeriesFolders(query) {
    try {
        const url = query
            ? `/api/series-folders?q=${encodeURIComponent(query)}`
            : "/api/series-folders";
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.folders || [];
    } catch {
        return [];
    }
}

function renderConvertSuggestions(folders, query) {
    if (folders.length === 0 && !query) {
        // Fallback: show destinations
        if (appConfig.destinations.length > 0) {
            convertPathSuggestions.innerHTML = appConfig.destinations
                .map((d) => `<div class="convert-suggestion-item" data-path="${escHtml(d)}"><span class="convert-sugg-name">${escHtml(d)}</span></div>`)
                .join("");
            convertPathSuggestions.style.display = "block";
        } else {
            convertPathSuggestions.style.display = "none";
        }
        return;
    }
    if (folders.length === 0) {
        // Also show matching destinations as fallback
        const dests = appConfig.destinations.filter((d) => d.toLowerCase().includes(query.toLowerCase()));
        if (dests.length > 0) {
            convertPathSuggestions.innerHTML = dests
                .map((d) => `<div class="convert-suggestion-item" data-path="${escHtml(d)}"><span class="convert-sugg-name">${escHtml(d)}</span></div>`)
                .join("");
            convertPathSuggestions.style.display = "block";
        } else {
            convertPathSuggestions.style.display = "none";
        }
        return;
    }
    convertPathSuggestions.innerHTML = folders
        .slice(0, 50)
        .map((f) => `<div class="convert-suggestion-item" data-path="${escHtml(f.path)}"><span class="convert-sugg-name">${escHtml(f.name)}</span> <span class="convert-sugg-dest">${escHtml(f.dest_label)}</span></div>`)
        .join("");
    convertPathSuggestions.style.display = "block";
}

let convertSuggTimeout = null;

convertPathInput.addEventListener("input", () => {
    const val = convertPathInput.value.trim();
    clearTimeout(convertSuggTimeout);
    if (!val) {
        renderConvertSuggestions([], "");
        return;
    }
    convertSuggTimeout = setTimeout(async () => {
        const folders = await loadSeriesFolders(val);
        renderConvertSuggestions(folders, val);
    }, 200);
});

convertPathInput.addEventListener("focus", () => {
    const val = convertPathInput.value.trim();
    if (!val) {
        renderConvertSuggestions([], "");
    } else {
        clearTimeout(convertSuggTimeout);
        convertSuggTimeout = setTimeout(async () => {
            const folders = await loadSeriesFolders(val);
            renderConvertSuggestions(folders, val);
        }, 200);
    }
});

convertPathSuggestions.addEventListener("click", (e) => {
    const item = e.target.closest(".convert-suggestion-item");
    if (item) {
        convertPathInput.value = item.dataset.path;
        convertPathSuggestions.style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".convert-path-input-wrap")) {
        convertPathSuggestions.style.display = "none";
    }
});

convertJpegQuality.addEventListener("input", () => {
    convertQualityValue.textContent = convertJpegQuality.value;
});

async function scanCbr() {
    const scanPath = convertPathInput.value.trim();
    if (!scanPath) {
        showToast(t("convert.error.path_required"), "error");
        return;
    }

    btnScanCbr.disabled = true;
    btnScanCbr.textContent = t("convert.btn.scanning");
    try {
        const res = await fetch(`/api/scan-cbr?path=${encodeURIComponent(scanPath)}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        if (data.error) {
            showToast(data.error, "error");
            convertData = [];
        } else {
            convertData = data.groups;
        }
        renderConvertTable();
        // Show PDF options if any PDF files were found
        const hasPdf = convertData.some((g) => g.files.some((f) => f.format === "pdf"));
        convertPdfOptions.style.display = hasPdf ? "flex" : "none";
    } catch {
        showToast(t("convert.error.scan"), "error");
    } finally {
        btnScanCbr.disabled = false;
        btnScanCbr.textContent = t("convert.btn.scan");
    }
}

function renderConvertTable() {
    if (convertData.length === 0) {
        convertTbody.innerHTML = `<tr class="empty-row"><td colspan="5">${t("convert.no_cbr")}</td></tr>`;
        btnConvert.disabled = true;
        return;
    }

    let html = "";
    let fileIndex = 0;
    convertData.forEach((group) => {
        html += `<tr class="convert-group-row"><td colspan="5"><strong>${escHtml(group.series_name)}</strong> <span class="text-muted">(${t("convert.files_label", { count: group.files.length })})</span></td></tr>`;
        group.files.forEach((f) => {
            const disabled = f.has_cbz ? "disabled" : "";
            const rowClass = f.has_cbz ? "convert-row convert-row-exists" : "convert-row";
            const status = f.has_cbz ? `<span class="convert-status-exists">${t("convert.cbz_exists")}</span>` : (f.status || "");
            const tome = f.tome != null ? `T${String(f.tome).padStart(2, "0")}` : "-";
            const formatBadge = f.format === "pdf"
                ? `<span class="convert-format-badge convert-format-pdf">PDF</span>`
                : `<span class="convert-format-badge convert-format-cbr">CBR</span>`;
            html += `<tr class="${rowClass}">
                <td class="col-check"><input type="checkbox" class="convert-check" data-path="${escHtml(f.path)}" ${disabled}></td>
                <td>${escHtml(f.name)} ${formatBadge}</td>
                <td>${tome}</td>
                <td>${f.size_human}</td>
                <td>${status}</td>
            </tr>`;
            fileIndex++;
        });
    });
    convertTbody.innerHTML = html;
    updateConvertButton();
}

function getConvertChecked() {
    return Array.from(convertTbody.querySelectorAll(".convert-check:checked:not(:disabled)"));
}

function updateConvertButton() {
    const checked = getConvertChecked();
    btnConvert.disabled = checked.length === 0;
    btnConvert.textContent = checked.length > 0
        ? t("convert.btn.convert_n", { count: checked.length })
        : t("convert.btn.convert");
}

convertTbody.addEventListener("change", updateConvertButton);

convertSelectAll.addEventListener("change", () => {
    const checks = convertTbody.querySelectorAll(".convert-check:not(:disabled)");
    checks.forEach((c) => (c.checked = convertSelectAll.checked));
    updateConvertButton();
});

function setConvertRowStatus(path, html, cls) {
    const checkbox = convertTbody.querySelector(`.convert-check[data-path="${CSS.escape(path)}"]`);
    if (!checkbox) return;
    const row = checkbox.closest("tr");
    if (!row) return;
    const statusCell = row.querySelector("td:last-child");
    if (statusCell) statusCell.innerHTML = html;
    if (cls) row.className = cls;
}

async function convertSelected() {
    const checked = getConvertChecked();
    if (checked.length === 0) return;

    const items = checked.map((c) => ({ path: c.dataset.path }));
    const deleteOriginal = convertDeleteOriginal.checked;
    const total = items.length;

    convertCancelled = false;
    btnConvert.disabled = true;
    btnConvert.style.display = "none";
    btnCancelConvert.style.display = "inline-block";
    btnCancelConvert.disabled = false;
    btnCancelConvert.textContent = t("convert.btn.cancel");
    convertProgress.style.display = "block";
    convertTbody.querySelectorAll(".convert-check").forEach((c) => c.disabled = true);
    convertSelectAll.disabled = true;

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < total; i++) {
        if (convertCancelled) break;

        const item = items[i];
        const filename = item.path.split("/").pop();
        convertProgressText.textContent = t("convert.progress_n", { current: i + 1, total, name: filename });

        setConvertRowStatus(item.path, `<span class="convert-status-progress">${t("convert.progress")}</span>`, "convert-row");

        try {
            const res = await fetch("/api/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: [item],
                    delete_original: deleteOriginal,
                    dpi: parseInt(convertDpi.value),
                    image_format: "jpeg",
                    jpeg_quality: parseInt(convertJpegQuality.value),
                }),
            });
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();

            if (data.error) {
                setConvertRowStatus(item.path, `<span class="convert-status-error">${escHtml(data.error)}</span>`, "convert-row convert-row-error");
                errorCount++;
            } else {
                const r = data.results[0];
                if (r && r.success) {
                    const statusText = r.verified
                        ? t("convert.status.verified", { count: r.files_count })
                        : t("convert.status.ok");
                    setConvertRowStatus(item.path, `<span class="convert-status-ok">${statusText}</span>`, "convert-row convert-row-exists");
                    successCount++;
                } else if (r && r.error) {
                    setConvertRowStatus(item.path, `<span class="convert-status-error" title="${escHtml(r.error)}">${escHtml(r.error)}</span>`, "convert-row convert-row-error");
                    errorCount++;
                }
            }
        } catch {
            setConvertRowStatus(item.path, `<span class="convert-status-error">${t("convert.error")}</span>`, "convert-row convert-row-error");
            errorCount++;
        }
    }

    convertProgress.style.display = "none";
    btnCancelConvert.style.display = "none";
    btnConvert.style.display = "";
    btnConvert.disabled = false;
    convertSelectAll.disabled = false;

    if (convertCancelled) {
        showToast(t("convert.cancelled", { done: successCount + errorCount, total }), "success");
    } else if (successCount > 0) {
        showToast(t("convert.success", { count: successCount }), "success");
    }
    if (errorCount > 0) {
        showToast(t("convert.errors_count", { count: errorCount }), "error");
    }

    updateConvertButton();
}

btnScanCbr.addEventListener("click", scanCbr);
btnConvert.addEventListener("click", convertSelected);
btnCancelConvert.addEventListener("click", () => {
    convertCancelled = true;
    btnCancelConvert.disabled = true;
    btnCancelConvert.textContent = t("convert.cancelling");
});

// ─── DASHBOARD ──────────────────────────────────────────
const dashboardTab = document.querySelector('.nav-tab[data-view="dashboard"]');
const dashboardView = document.getElementById("view-dashboard");
let dashboardLoaded = false;

function applyDashboardToggle() {
    const enabled = !!appConfig.dashboard_enabled;
    dashboardTab.style.display = enabled ? "" : "none";
    if (!enabled) {
        // If dashboard is currently visible, switch to files
        if (dashboardTab.classList.contains("active")) {
            dashboardTab.classList.remove("active");
            dashboardView.style.display = "none";
            const filesTab = document.querySelector('.nav-tab[data-view="files"]');
            filesTab.classList.add("active");
            document.getElementById("view-files").style.display = "";
        }
    }
}

async function loadDashboard() {
    if (dashboardLoaded) return;
    const statsEl = document.getElementById("dashboard-stats");
    const destBars = document.getElementById("dash-dest-bars");
    const formatBars = document.getElementById("dash-format-bars");

    try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        document.getElementById("dash-series").textContent = fmt(data.total_series);
        document.getElementById("dash-volumes").textContent = fmt(data.total_volumes);
        document.getElementById("dash-size").textContent = data.total_size_human;
        document.getElementById("dash-activity").textContent = fmt(data.recent_activity);

        // Destination bars
        if (data.by_destination.length === 0) {
            destBars.innerHTML = `<p class="dashboard-empty">${t("dashboard.empty")}</p>`;
        } else {
            const maxVol = Math.max(...data.by_destination.map((d) => d.volumes), 1);
            destBars.innerHTML = data.by_destination.map((d) => {
                const pct = Math.round((d.volumes / maxVol) * 100);
                return `<div class="dashboard-bar-row">
                    <span class="dashboard-bar-label" title="${escHtml(d.path)}">${escHtml(d.label)}</span>
                    <div class="dashboard-bar-track"><div class="dashboard-bar-fill" style="width:${pct}%"></div></div>
                    <span class="dashboard-bar-value">${d.series} ${t("dashboard.series").toLowerCase()}</span>
                    <span class="dashboard-bar-sub">${d.size_human}</span>
                </div>`;
            }).join("");
        }

        // Format bars
        if (data.by_format.length === 0) {
            formatBars.innerHTML = `<p class="dashboard-empty">${t("dashboard.empty")}</p>`;
        } else {
            const maxFmt = Math.max(...data.by_format.map((f) => f.count), 1);
            formatBars.innerHTML = data.by_format.map((f) => {
                const pct = Math.round((f.count / maxFmt) * 100);
                return `<div class="dashboard-bar-row">
                    <span class="dashboard-bar-label">${escHtml(f.ext)}</span>
                    <div class="dashboard-bar-track"><div class="dashboard-bar-fill" style="width:${pct}%"></div></div>
                    <span class="dashboard-bar-value">${f.count}</span>
                </div>`;
            }).join("");
        }

        dashboardLoaded = true;
    } catch {
        // Silent fail, stats stay at "-"
    }
}

// ─── TRIAGE MODE ────────────────────────────────────────

function openTriage() {
    triageFiles = getDisplayFiles();
    if (triageFiles.length === 0) {
        showToast(t("triage.no_files"), "error");
        return;
    }
    triageIndex = 0;
    triageOpen = true;

    // Populate destination select
    triageDestination.innerHTML = `<option value="">${t("action.choose")}</option>`;
    (appConfig.destinations || []).forEach((dest) => {
        const label = dest.split("/").pop();
        const opt = document.createElement("option");
        opt.value = dest;
        opt.textContent = label;
        triageDestination.appendChild(opt);
    });

    renderTriageFile();
    triageOverlay.style.display = "block";
}

function closeTriage() {
    triageOpen = false;
    triageOverlay.style.display = "none";
    triageDropdown.innerHTML = "";
    triageDropdown.classList.remove("open");
}

function renderTriageFile() {
    if (triageIndex < 0 || triageIndex >= triageFiles.length) {
        closeTriage();
        showToast(t("triage.complete"), "success");
        return;
    }

    const { file: f } = triageFiles[triageIndex];

    // Counter
    triageCounter.textContent = `${triageIndex + 1} / ${triageFiles.length}`;

    // File info
    triageFilename.textContent = f.name;
    triageFileSize.textContent = f.size_human;
    triageFileExt.textContent = f.extension;

    // Detection
    triageSeriesGuess.textContent = f.series_guess || t("files.no_series");
    const score = f.match_score || 0;
    const pct = Math.round(score * 100);
    if (score >= 0.9) {
        triageConfidence.innerHTML = `<span class="conf-badge conf-high" title="${t("files.match_pct", { pct })}">&#10003;</span>`;
    } else if (score >= 0.6) {
        triageConfidence.innerHTML = `<span class="conf-badge conf-suggest" title="${t("files.suggestion_pct", { pct })}">?</span>`;
    } else {
        triageConfidence.innerHTML = `<span class="conf-badge conf-none" title="${t("files.no_match")}">&#x2015;</span>`;
    }

    // Pre-fill form from match
    if (f.series_match) {
        triageSeriesInput.value = f.series_match.name;
        triageDestination.value = f.series_match.destination;
    } else {
        triageSeriesInput.value = f.series_guess || "";
        triageDestination.value = "";
    }
    triageTome.value = f.tome !== null && f.tome !== undefined ? f.tome : "";
    triageTitle.value = "";

    // Close any open dropdown
    triageDropdown.innerHTML = "";
    triageDropdown.classList.remove("open");

    updateTriagePreview();
    triageSeriesInput.focus();
}

function updateTriagePreview() {
    const series = triageSeriesInput.value.trim();
    const dest = triageDestination.value;
    if (!series || !dest) {
        triagePreview.innerHTML = "";
        return;
    }

    const { file: f } = triageFiles[triageIndex];
    const tome = triageTome.value !== "" ? parseInt(triageTome.value) : null;
    const title = triageTitle.value.trim();
    const ext = f.extension;

    let tpl = appConfig.template || "{series} - T{tome:02d}{ext}";
    let tplNoTome = appConfig.template_no_tome || "{series}{ext}";
    const destLower = dest.toLowerCase();
    for (const rule of (appConfig.template_rules || [])) {
        if (rule.filter && destLower.includes(rule.filter.toLowerCase())) {
            tpl = rule.template || tpl;
            tplNoTome = rule.template_no_tome || tplNoTome;
            break;
        }
    }

    const template = tome !== null ? tpl : tplNoTome;
    const newName = applyTemplateClient(template, series, tome, ext, title);
    triagePreview.innerHTML = `<span class="triage-preview-label">&rarr;</span> ${escHtml(newName)}`;
}

async function triageOrganize() {
    const { file: f, index: dataIndex } = triageFiles[triageIndex];
    const series = triageSeriesInput.value.trim();
    const dest = triageDestination.value;
    const tome = triageTome.value !== "" ? parseInt(triageTome.value) : null;
    const title = triageTitle.value.trim();

    if (!series || !dest) {
        showToast(t("triage.error.incomplete"), "error");
        return;
    }

    btnTriageOrganize.disabled = true;

    try {
        const res = await fetch("/api/organize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                series_name: series,
                destination: dest,
                source_dir: appConfig.source_dir,
                force: true,
                files: [{ source: f.name, tome, title }],
            }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const r = data.results[0];
        if (r.success) {
            showToast(t("organize.added", { name: r.new_name, series }), "success");
            filesData.splice(dataIndex, 1);
            triageFiles = getDisplayFiles();
            if (triageIndex >= triageFiles.length) triageIndex = triageFiles.length - 1;
            if (triageFiles.length === 0) {
                closeTriage();
                renderFiles();
                showToast(t("triage.complete"), "success");
                return;
            }
            renderTriageFile();
            renderFiles();
        } else if (r.error) {
            showToast(`${f.name}: ${r.error}`, "error");
        }
    } catch {
        showToast(t("organize.error"), "error");
    } finally {
        btnTriageOrganize.disabled = false;
    }
}

async function triageDelete() {
    const { file: f, index: dataIndex } = triageFiles[triageIndex];

    try {
        const res = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_dir: appConfig.source_dir,
                filename: f.name,
            }),
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        filesData.splice(dataIndex, 1);
        triageFiles = getDisplayFiles();
        if (triageIndex >= triageFiles.length) triageIndex = triageFiles.length - 1;
        if (triageFiles.length === 0) {
            closeTriage();
            renderFiles();
            return;
        }
        renderTriageFile();
        renderFiles();
        showToast(t("delete.deleted", { name: f.name }), "success");
    } catch {
        showToast(t("delete.error"), "error");
    }
}

// Triage autocomplete
triageSeriesInput.addEventListener("input", () => {
    updateTriagePreview();
    const query = triageSeriesInput.value.trim();
    clearTimeout(triageSearchTimeout);

    if (query.length < 2) {
        triageDropdown.innerHTML = "";
        triageDropdown.classList.remove("open");
        return;
    }

    triageSearchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search-series?q=${encodeURIComponent(query)}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.results.length === 0) {
                triageDropdown.innerHTML = `<div class="dropdown-empty">${t("scan.no_series")}</div>`;
            } else {
                triageDropdown.innerHTML = data.results.slice(0, 30).map((r) =>
                    `<div class="dropdown-item" data-name="${escHtml(r.name)}" data-dest="${escHtml(r.destination)}">
                        <span class="dropdown-name">${escHtml(r.name)}</span>
                        <span class="dropdown-label">${escHtml(r.dest_label)}</span>
                    </div>`
                ).join("");
            }
            triageDropdown.classList.add("open");
        } catch {
            triageDropdown.innerHTML = "";
            triageDropdown.classList.remove("open");
        }
    }, 200);
});

// Triage dropdown click
triageDropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;
    triageSeriesInput.value = item.dataset.name;
    triageDestination.value = item.dataset.dest;
    triageDropdown.innerHTML = "";
    triageDropdown.classList.remove("open");
    updateTriagePreview();
});

// Triage dropdown keyboard
triageSeriesInput.addEventListener("keydown", (e) => {
    if (!triageDropdown.classList.contains("open")) {
        if (e.key === "Enter") {
            e.preventDefault();
            triageOrganize();
        }
        return;
    }
    const items = triageDropdown.querySelectorAll(".dropdown-item");
    if (items.length === 0) return;

    const active = triageDropdown.querySelector(".dropdown-item.active");
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
        if (active) active.click();
        else if (items.length > 0) items[0].click();
    } else if (e.key === "Escape") {
        e.preventDefault();
        triageDropdown.innerHTML = "";
        triageDropdown.classList.remove("open");
    }
});

// Triage form change listeners
triageDestination.addEventListener("change", updateTriagePreview);
triageTome.addEventListener("input", updateTriagePreview);
triageTitle.addEventListener("input", updateTriagePreview);

// Triage button events
btnTriage.addEventListener("click", openTriage);
btnTriageClose.addEventListener("click", closeTriage);
btnTriageOrganize.addEventListener("click", triageOrganize);
btnTriageSkip.addEventListener("click", () => {
    if (triageIndex < triageFiles.length - 1) {
        triageIndex++;
        renderTriageFile();
    }
});
btnTriagePrev.addEventListener("click", () => {
    if (triageIndex > 0) {
        triageIndex--;
        renderTriageFile();
    }
});
btnTriageDelete.addEventListener("click", triageDelete);

// Global triage keyboard
document.addEventListener("keydown", (e) => {
    if (!triageOpen) return;
    const inInput = ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName);

    if (e.key === "Escape") {
        e.preventDefault();
        closeTriage();
        return;
    }

    if (e.key === "Enter" && !inInput) {
        e.preventDefault();
        triageOrganize();
        return;
    }

    if (e.key === "ArrowRight" && !inInput) {
        e.preventDefault();
        if (triageIndex < triageFiles.length - 1) {
            triageIndex++;
            renderTriageFile();
        }
        return;
    }

    if (e.key === "ArrowLeft" && !inInput) {
        e.preventDefault();
        if (triageIndex > 0) {
            triageIndex--;
            renderTriageFile();
        }
        return;
    }

    if (e.key === "Delete" && !inInput) {
        e.preventDefault();
        triageDelete();
        return;
    }
});

// ─── IMPORT BUTTON & FILE PICKER ────────────────────────

btnImportFiles.addEventListener("click", () => {
    fileInputHidden.accept = (appConfig.extensions || [".cbr", ".cbz", ".pdf"]).join(",");
    fileInputHidden.click();
});

fileInputHidden.addEventListener("change", async () => {
    const files = [...fileInputHidden.files];
    fileInputHidden.value = "";
    if (files.length === 0) return;

    const allowedExts = (appConfig.extensions || [".cbr", ".cbz", ".pdf"]).map((x) => x.toLowerCase());
    const validFiles = [];
    const rejected = [];

    for (const f of files) {
        const ext = "." + f.name.split(".").pop().toLowerCase();
        if (allowedExts.includes(ext)) {
            validFiles.push(f);
        } else {
            rejected.push(f.name);
        }
    }

    if (rejected.length > 0) {
        showToast(t("upload.rejected", { count: rejected.length, exts: allowedExts.join(", ") }), "error");
    }
    if (validFiles.length === 0) return;
    await uploadFiles(validFiles);
});

// ─── DRAG & DROP UPLOAD ─────────────────────────────────

document.body.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadInProgress) return;
    dropOverlay.style.display = "block";
});

document.body.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
});

dropOverlay.addEventListener("dragleave", (e) => {
    if (e.target === dropOverlay) {
        dropOverlay.style.display = "none";
    }
});

dropOverlay.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.style.display = "none";
    if (uploadInProgress) return;

    const files = [...e.dataTransfer.files];
    if (files.length === 0) return;

    const allowedExts = (appConfig.extensions || [".cbr", ".cbz", ".pdf"]).map((x) => x.toLowerCase());
    const validFiles = [];
    const rejected = [];

    for (const f of files) {
        const ext = "." + f.name.split(".").pop().toLowerCase();
        if (allowedExts.includes(ext)) {
            validFiles.push(f);
        } else {
            rejected.push(f.name);
        }
    }

    if (rejected.length > 0) {
        showToast(t("upload.rejected", { count: rejected.length, exts: allowedExts.join(", ") }), "error");
    }

    if (validFiles.length === 0) return;
    await uploadFiles(validFiles);
});

async function uploadFiles(files) {
    uploadInProgress = true;
    showToast(t("upload.uploading", { count: files.length }), "success");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const successes = data.results.filter((r) => r.success);
        const errors = data.results.filter((r) => r.error);

        if (successes.length > 0) {
            showToast(t("upload.success", { count: successes.length }), "success");
        }
        errors.forEach((err) => showToast(`${err.name}: ${err.error}`, "error"));

        await scanFiles();
    } catch {
        showToast(t("upload.error"), "error");
    } finally {
        uploadInProgress = false;
    }
}

// ─── TRASH MANAGEMENT ──────────────────────────────────

async function loadTrash() {
    try {
        const res = await fetch("/api/trash");
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        trashData = data.files;
        updateTrashBadge(data.count);
        trashInfo.textContent = data.count > 0
            ? t("trash.info", { count: data.count, size: data.total_size_human })
            : "";
        btnPurgeTrash.disabled = data.count === 0;
        renderTrashTable();
    } catch {
        showToast(t("trash.error.load"), "error");
    }
}

function updateTrashBadge(count) {
    if (count > 0) {
        trashBadge.textContent = count > 99 ? "99+" : count;
        trashBadge.style.display = "inline-flex";
    } else {
        trashBadge.style.display = "none";
    }
}

function renderTrashTable() {
    if (trashData.length === 0) {
        trashTbody.innerHTML = `<tr class="empty-row"><td colspan="5">${t("trash.empty")}</td></tr>`;
        btnRestoreSelected.disabled = true;
        btnDeleteSelected.disabled = true;
        return;
    }

    trashTbody.innerHTML = trashData.map((f, i) => {
        const ts = f.deleted_at.replace("T", " ");
        return `<tr class="trash-row">
            <td class="col-check"><input type="checkbox" class="trash-check" data-index="${i}"></td>
            <td class="col-trash-name"><span class="file-name">${escHtml(f.name)}</span></td>
            <td>${f.size_human}</td>
            <td class="col-trash-date">${escHtml(ts)}</td>
            <td class="col-trash-actions">
                <button class="btn-trash-restore" data-index="${i}" type="button">${t("trash.btn.restore")}</button>
                <button class="btn-trash-delete" data-index="${i}" type="button">&times;</button>
            </td>
        </tr>`;
    }).join("");

    trashSelectAll.checked = false;
    updateTrashSelection();
}

function updateTrashSelection() {
    const checked = trashTbody.querySelectorAll(".trash-check:checked");
    btnRestoreSelected.disabled = checked.length === 0;
    btnDeleteSelected.disabled = checked.length === 0;
    if (checked.length > 0) {
        btnRestoreSelected.textContent = t("trash.btn.restore_n", { count: checked.length });
        btnDeleteSelected.textContent = t("trash.btn.delete_n", { count: checked.length });
    } else {
        btnRestoreSelected.textContent = t("trash.btn.restore_selected");
        btnDeleteSelected.textContent = t("trash.btn.delete_selected");
    }
}

trashSelectAll.addEventListener("change", () => {
    trashTbody.querySelectorAll(".trash-check").forEach((c) => (c.checked = trashSelectAll.checked));
    updateTrashSelection();
});

trashTbody.addEventListener("change", updateTrashSelection);

trashTbody.addEventListener("click", async (e) => {
    const restoreBtn = e.target.closest(".btn-trash-restore");
    if (restoreBtn) {
        const idx = parseInt(restoreBtn.dataset.index);
        const file = trashData[idx];
        restoreBtn.disabled = true;
        try {
            const res = await fetch("/api/trash/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filenames: [file.name] }),
            });
            const data = await res.json();
            if (data.results[0]?.success) {
                showToast(t("trash.restored", { name: file.name }), "success");
                await loadTrash();
            } else {
                showToast(data.results[0]?.error || t("trash.error.restore"), "error");
            }
        } catch {
            showToast(t("trash.error.restore"), "error");
        }
        return;
    }

    const deleteBtn = e.target.closest(".btn-trash-delete");
    if (deleteBtn) {
        const idx = parseInt(deleteBtn.dataset.index);
        const file = trashData[idx];
        if (!confirm(t("trash.confirm_delete_one", { name: file.name }))) return;
        deleteBtn.disabled = true;
        try {
            const res = await fetch("/api/trash/purge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filenames: [file.name] }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(t("trash.deleted_permanent", { name: file.name }), "success");
                await loadTrash();
            }
        } catch {
            showToast(t("trash.error.delete"), "error");
        }
    }
});

btnRestoreSelected.addEventListener("click", async () => {
    const checked = Array.from(trashTbody.querySelectorAll(".trash-check:checked"));
    const filenames = checked.map((c) => trashData[parseInt(c.dataset.index)].name);
    if (filenames.length === 0) return;

    btnRestoreSelected.disabled = true;
    try {
        const res = await fetch("/api/trash/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filenames }),
        });
        const data = await res.json();
        const successes = data.results.filter((r) => r.success);
        if (successes.length > 0) {
            showToast(t("trash.restored_n", { count: successes.length }), "success");
        }
        data.results.filter((r) => r.error).forEach((r) => showToast(`${r.name}: ${r.error}`, "error"));
        await loadTrash();
    } catch {
        showToast(t("trash.error.restore"), "error");
    }
});

btnDeleteSelected.addEventListener("click", async () => {
    const checked = Array.from(trashTbody.querySelectorAll(".trash-check:checked"));
    const filenames = checked.map((c) => trashData[parseInt(c.dataset.index)].name);
    if (filenames.length === 0) return;
    if (!confirm(t("trash.confirm_delete_n", { count: filenames.length }))) return;

    btnDeleteSelected.disabled = true;
    try {
        const res = await fetch("/api/trash/purge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filenames }),
        });
        const data = await res.json();
        if (data.success) {
            showToast(t("trash.purged_n", { count: data.deleted }), "success");
        }
        await loadTrash();
    } catch {
        showToast(t("trash.error.delete"), "error");
    }
});

btnPurgeTrash.addEventListener("click", async () => {
    if (!confirm(t("trash.confirm_purge_all"))) return;
    btnPurgeTrash.disabled = true;
    try {
        const res = await fetch("/api/trash/purge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filenames: [] }),
        });
        const data = await res.json();
        if (data.success) {
            showToast(t("trash.purged_all", { count: data.deleted }), "success");
        }
        await loadTrash();
    } catch {
        showToast(t("trash.error.delete"), "error");
    }
});

btnRefreshTrash.addEventListener("click", loadTrash);

// ─── INIT ──────────────────────────────────────────────
async function init() {
    await loadConfig();
    populateDestinations();
    applyDashboardToggle();
    if (appConfig.dashboard_enabled) {
        loadDashboard();
    } else {
        // Default to files view
        dashboardTab.classList.remove("active");
        dashboardView.style.display = "none";
        const filesTab = document.querySelector('.nav-tab[data-view="files"]');
        filesTab.classList.add("active");
        document.getElementById("view-files").style.display = "";
    }
    scanFiles();
    fetch("/api/trash").then((r) => r.json()).then((d) => updateTrashBadge(d.count)).catch(() => {});
}

init();
