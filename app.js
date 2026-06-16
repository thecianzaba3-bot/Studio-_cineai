// Studio CinéAI — app.js

const STATE = {
  mode: 'simple',
  engines: { veo3: true, runway: true, kling: true, pika: false, sora: false },
  scenes: [],
  mediaFiles: [],
  keys: {}
};

// ── Navigation ──────────────────────────────────────────────
function sw(name, el) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
}

function setMode(el, mode) {
  STATE.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ── API Modal ────────────────────────────────────────────────
function openApiModal() {
  loadKeys();
  document.getElementById('api-modal').classList.add('open');
}
function closeModal() {
  document.getElementById('api-modal').classList.remove('open');
}
function saveKeys() {
  const veo = document.getElementById('veo3-key').value.trim();
  const run = document.getElementById('runway-key').value.trim();
  const kl  = document.getElementById('kling-key').value.trim();
  if (veo) localStorage.setItem('key_veo3', veo);
  if (run) localStorage.setItem('key_runway', run);
  if (kl)  localStorage.setItem('key_kling', kl);
  STATE.keys = { veo3: veo, runway: run, kling: kl };
  updateApiStatus();
  closeModal();
  notify('✅ Clés API sauvegardées !');
}
function loadKeys() {
  document.getElementById('veo3-key').value   = localStorage.getItem('key_veo3') || '';
  document.getElementById('runway-key').value = localStorage.getItem('key_runway') || '';
  document.getElementById('kling-key').value  = localStorage.getItem('key_kling') || '';
}
function updateApiStatus() {
  const keys = {
    veo3:   localStorage.getItem('key_veo3'),
    runway: localStorage.getItem('key_runway'),
    kling:  localStorage.getItem('key_kling')
  };
  const set = k => k && k.length > 4;
  const el = (id, txt, ok) => {
    const e = document.getElementById(id);
    if (e) { e.textContent = txt; e.style.color = ok ? '#5ec269' : '#9896b8'; }
  };
  el('veo-status-txt',    set(keys.veo3)   ? '✅ Configurée' : '❌ Non configurée', set(keys.veo3));
  el('runway-status-txt', set(keys.runway) ? '✅ Configurée' : '❌ Non configurée', set(keys.runway));
  el('kling-status-txt',  set(keys.kling)  ? '✅ Configurée' : '❌ Non configurée', set(keys.kling));
}

// ── Engines ──────────────────────────────────────────────────
function toggleEngine(el) {
  const engine = el.dataset.engine;
  const isBlue = engine === 'veo3';
  const selCls = isBlue ? 'sel-blue' : 'sel';
  const active = el.classList.contains('sel') || el.classList.contains('sel-blue');
  el.classList.remove('sel', 'sel-blue');
  if (!active) {
    el.classList.add(selCls);
    el.querySelector('.engine-check').textContent = '✓';
    STATE.engines[engine] = true;
  } else {
    el.querySelector('.engine-check').textContent = '';
    STATE.engines[engine] = false;
  }
  updateGenEngine();
}
function updateGenEngine() {
  const sel = document.getElementById('gen-engine');
  if (!sel) return;
  const active = Object.entries(STATE.engines).filter(([,v])=>v).map(([k])=>k);
  if (active.length && sel.value && !STATE.engines[sel.value]) {
    sel.value = active[0];
    updateGenBtn();
  }
}

// ── Scénario ─────────────────────────────────────────────────
async function generateScenario() {
  const title    = document.getElementById('film-title').value || 'Mon film';
  const synopsis = document.getElementById('film-synopsis').value || 'Un film captivant';
  const genre    = document.getElementById('film-genre').value;
  const duration = document.getElementById('film-duration').value;

  const result = document.getElementById('scenario-result');
  result.innerHTML = `<div class="card"><div style="color:var(--text2);font-size:13px;text-align:center;padding:16px">✨ Génération du scénario en cours...</div></div>`;

  const key = localStorage.getItem('key_anthropic') || '';
  const scenes = buildScenes(title, synopsis, genre, duration);
  STATE.scenes = scenes;

  result.innerHTML = renderScenario(title, scenes);
  document.getElementById('scene-count').textContent = scenes.length;
  document.getElementById('duration-est').textContent = estimateDuration(scenes);
  renderScenesList();
  notify('✅ Scénario généré — ' + scenes.length + ' scènes !');
}

function buildScenes(title, synopsis, genre, duration) {
  const n = duration.includes('1–3') ? 3 : duration.includes('5–10') ? 5 : 7;
  const engines = ['veo3','runway','kling','veo3','runway','kling','veo3'];
  const baseScenes = [
    { name: 'Ouverture', desc: 'Plan d\'ouverture établissant le monde et l\'atmosphère.' },
    { name: 'Introduction du protagoniste', desc: 'Présentation du personnage principal dans son environnement.' },
    { name: 'Élément déclencheur', desc: 'L\'événement qui lance l\'action principale.' },
    { name: 'Confrontation', desc: 'Premier obstacle majeur pour le protagoniste.' },
    { name: 'Point culminant', desc: 'La scène de tension maximale du film.' },
    { name: 'Révélation', desc: 'La vérité éclate et change tout.' },
    { name: 'Épilogue', desc: 'Résolution et clôture émotionnelle.' }
  ];
  return baseScenes.slice(0, n).map((s, i) => ({
    ...s, id: i + 1, engine: engines[i], status: 'wait',
    prompt: `${genre} — ${s.name} pour "${title}": ${s.desc} ${synopsis.slice(0, 80)}`
  }));
}

function estimateDuration(scenes) {
  const sec = scenes.length * 70;
  return sec >= 60 ? Math.round(sec/60) + ' min' : sec + 's';
}

function renderScenario(title, scenes) {
  return `
  <div class="card">
    <div class="card-title">📖 ${title} <span class="badge badge-ai" style="margin-left:auto">${scenes.length} scènes</span></div>
    ${scenes.map(s => `
    <div class="scene-card">
      <div class="scene-header">
        <div class="scene-num">${s.id}</div>
        <div class="scene-title">${s.name}</div>
        <span class="scene-engine ${s.engine === 'veo3' ? 'e-veo' : s.engine === 'runway' ? 'e-runway' : 'e-kling'}">${s.engine === 'veo3' ? 'Veo 3' : s.engine === 'runway' ? 'Runway' : 'Kling'}</span>
      </div>
      <div class="scene-desc">${s.desc}</div>
    </div>`).join('')}
  </div>`;
}

function renderScenesList() {
  const el = document.getElementById('scenes-list');
  if (!STATE.scenes.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text2);text-align:center;padding:16px">Créez d\'abord un scénario</div>';
    return;
  }
  el.innerHTML = STATE.scenes.map(s => `
  <div class="scene-card">
    <div class="scene-header">
      <div class="scene-num">${s.id}</div>
      <div class="scene-title">${s.name}</div>
      <span class="scene-engine ${s.engine === 'veo3' ? 'e-veo' : s.engine === 'runway' ? 'e-runway' : 'e-kling'}">${s.engine === 'veo3' ? 'Veo 3' : s.engine === 'runway' ? 'Runway' : 'Kling'}</span>
    </div>
    <div class="scene-desc">${s.desc}</div>
    <div class="scene-status">
      <div class="${s.status === 'done' ? 'dot-done' : s.status === 'prog' ? 'dot-prog' : 'dot-wait'}"></div>
      <span style="font-size:11px;color:var(--text2)">${s.status === 'done' ? 'Générée' : s.status === 'prog' ? 'En cours...' : 'En attente'}</span>
      ${s.status === 'wait' ? `<button onclick="generateScene(${s.id-1})" style="margin-left:auto;background:var(--purple-bg);border:0.5px solid var(--purple2);color:var(--purple);border-radius:6px;padding:3px 9px;font-size:11px;cursor:pointer">Générer</button>` : ''}
    </div>
    ${s.status === 'prog' ? `<div class="progress-bar" style="margin-top:6px"><div class="progress-fill" id="scene-bar-${s.id}" style="width:30%"></div></div>` : ''}
  </div>`).join('');
}

// ── Génération vidéo ─────────────────────────────────────────
let genTimer = null;
function updateGenBtn() {
  const eng = document.getElementById('gen-engine');
  const btn = document.getElementById('gen-btn');
  if (!eng || !btn) return;
  const labels = { veo3: '🌐 Générer avec Veo 3', runway: '🪄 Générer avec Runway', kling: '🌊 Générer avec Kling', pika: '🔮 Générer avec Pika', sora: '🎯 Générer avec Sora' };
  btn.textContent = labels[eng.value] || '⚡ Générer';
  const isBlue = ['veo3'].includes(eng.value);
  btn.className = 'btn ' + (isBlue ? 'btn-blue' : 'btn-purple');
  document.getElementById('audio-option').style.display = eng.value === 'veo3' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  updateApiStatus();
  updateGenBtn();
  document.getElementById('gen-engine').addEventListener('change', updateGenBtn);
  loadMediaList();
});

const veoMsgs = [
  'Initialisation du moteur Google DeepMind...',
  'Analyse sémantique du prompt...',
  'Génération du plan caméra...',
  'Rendu des éléments physiques...',
  'Synthèse audio native IA...',
  'Assemblage 8K final...',
  'Optimisation et compression...',
  'Vidéo prête !'
];

function startGeneration() {
  const prompt = document.getElementById('gen-prompt').value.trim();
  if (!prompt) { notify('⚠️ Ajoutez une description de scène'); return; }
  const engine = document.getElementById('gen-engine').value;
  const res = document.getElementById('gen-res').value;
  const dur = document.getElementById('gen-dur').value;

  document.getElementById('gen-progress').style.display = 'block';
  document.getElementById('gen-result').style.display = 'none';
  document.getElementById('gen-btn').disabled = true;

  let p = 0, msgIdx = 0;
  if (genTimer) clearInterval(genTimer);
  genTimer = setInterval(() => {
    p = Math.min(100, p + (engine === 'veo3' ? 1 : 1.5));
    const pct = Math.round(p);
    document.getElementById('gen-bar').style.width = pct + '%';
    document.getElementById('gen-pct').textContent = pct + '%';
    const idx = Math.min(veoMsgs.length - 1, Math.floor(p / 14));
    if (idx !== msgIdx) { msgIdx = idx; document.getElementById('gen-status-txt').textContent = engine === 'veo3' ? veoMsgs[idx] : 'Génération en cours...'; }
    if (p >= 100) {
      clearInterval(genTimer);
      document.getElementById('gen-btn').disabled = false;
      const names = { veo3: 'Veo 3', runway: 'Runway ML', kling: 'Kling AI', pika: 'Pika Labs', sora: 'Sora' };
      document.getElementById('gen-result-info').textContent = `${res} · ${dur} · ${names[engine]} · Audio ${engine === 'veo3' ? 'inclus' : 'non inclus'}`;
      document.getElementById('gen-result').style.display = 'block';
      notify('✅ Vidéo générée avec ' + names[engine]);
    }
  }, engine === 'veo3' ? 80 : 55);
}

function generateScene(idx) {
  if (!STATE.scenes[idx]) return;
  STATE.scenes[idx].status = 'prog';
  renderScenesList();
  let p = 0;
  const bar = document.getElementById('scene-bar-' + (idx + 1));
  const iv = setInterval(() => {
    p = Math.min(100, p + 2);
    if (bar) bar.style.width = p + '%';
    if (p >= 100) {
      clearInterval(iv);
      STATE.scenes[idx].status = 'done';
      renderScenesList();
      notify('✅ Scène ' + (idx + 1) + ' générée !');
    }
  }, 60);
}

function addToTimeline() {
  notify('✅ Vidéo ajoutée à la timeline !');
  sw('montage', document.querySelectorAll('.nav-item')[4]);
}

// ── Fichiers ─────────────────────────────────────────────────
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('hover');
  handleFiles(e.dataTransfer.files);
}

function handleFiles(files) {
  if (!files || !files.length) return;
  Array.from(files).forEach(f => {
    STATE.mediaFiles.push({ name: f.name, size: f.size, type: getFileType(f), url: URL.createObjectURL(f) });
  });
  saveMediaList();
  renderMediaList();
  document.getElementById('transform-card').style.display = 'block';
  notify('✅ ' + files.length + ' fichier(s) importé(s)');
}

function getFileType(f) {
  if (f.type.startsWith('image/')) return 'photo';
  if (f.type.startsWith('video/')) return 'video';
  if (f.type.startsWith('audio/')) return 'audio';
  return 'doc';
}

function renderMediaList() {
  const el = document.getElementById('media-list');
  const icons = { photo: '🖼️', video: '🎬', audio: '🎵', doc: '📄' };
  const badge = document.getElementById('media-count-badge');
  if (badge) badge.textContent = STATE.mediaFiles.length + ' fichier' + (STATE.mediaFiles.length > 1 ? 's' : '');
  if (!STATE.mediaFiles.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text2);text-align:center;padding:16px">Aucun fichier importé</div>';
    return;
  }
  el.innerHTML = STATE.mediaFiles.map((f, i) => `
  <div class="media-item">
    <div class="media-thumb" style="background:var(--bg2)">${icons[f.type]}</div>
    <div class="media-info">
      <div class="media-name">${f.name}</div>
      <div class="media-meta">${f.type.toUpperCase()} · ${formatSize(f.size)}</div>
    </div>
    <button class="icon-btn" onclick="removeMedia(${i})">🗑️</button>
  </div>`).join('');
}

function removeMedia(i) {
  STATE.mediaFiles.splice(i, 1);
  saveMediaList();
  renderMediaList();
  if (!STATE.mediaFiles.length) document.getElementById('transform-card').style.display = 'none';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
  return (bytes / 1048576).toFixed(1) + ' Mo';
}

function saveMediaList() {
  try {
    const toSave = STATE.mediaFiles.map(f => ({ name: f.name, size: f.size, type: f.type }));
    localStorage.setItem('media_files', JSON.stringify(toSave));
  } catch(e) {}
}

function loadMediaList() {
  try {
    const saved = JSON.parse(localStorage.getItem('media_files') || '[]');
    STATE.mediaFiles = saved;
    renderMediaList();
    if (saved.length) document.getElementById('transform-card').style.display = 'block';
  } catch(e) {}
}

// ── Transform ────────────────────────────────────────────────
let transformTimer = null;
function transformFile() {
  const prompt = document.getElementById('transform-prompt').value;
  if (!STATE.mediaFiles.length) { notify('⚠️ Importez d\'abord un fichier'); return; }
  document.getElementById('transform-progress').style.display = 'block';
  let p = 0;
  const msgs = ['Analyse du fichier...', 'Génération IA en cours...', 'Rendu vidéo...', 'Finalisation...'];
  let mi = 0;
  if (transformTimer) clearInterval(transformTimer);
  transformTimer = setInterval(() => {
    p = Math.min(100, p + 2);
    document.getElementById('transform-bar').style.width = p + '%';
    document.getElementById('transform-pct').textContent = Math.round(p) + '%';
    const ni = Math.min(msgs.length - 1, Math.floor(p / 26));
    if (ni !== mi) { mi = ni; document.getElementById('transform-status').textContent = msgs[ni]; }
    if (p >= 100) {
      clearInterval(transformTimer);
      notify('✅ Transformation terminée ! Vidéo prête.');
    }
  }, 70);
}

// ── Sous-titres ──────────────────────────────────────────────
function generateSubtitles() {
  const subs = [
    { time: '00:03', text: 'Un monde où les frontières du réel s\'effacent.' },
    { time: '00:09', text: 'Et si la musique pouvait tout changer ?' },
    { time: '00:15', text: 'Paris, 2087. La nuit ne dort jamais.' },
    { time: '00:22', text: 'Marcus Léon, détective hors du commun.' },
    { time: '00:29', text: 'Sur la piste d\'une fréquence qui efface les mémoires.' }
  ];
  document.getElementById('subtitles-editor').style.display = 'block';
  document.getElementById('subtitles-list').innerHTML = subs.map((s, i) => `
  <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:0.5px solid var(--border)">
    <span style="font-size:12px;color:var(--purple);font-weight:700;min-width:38px">${s.time}</span>
    <input type="text" value="${s.text}" style="flex:1;font-size:12px" id="sub-${i}">
  </div>`).join('');
  notify('✅ Sous-titres générés !');
}

// ── Export ───────────────────────────────────────────────────
function selExport(el) {
  document.querySelectorAll('.export-item').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
}

let exportTimer = null;
function startExport() {
  const title = document.getElementById('export-title').value || 'MonFilm';
  document.getElementById('export-progress').style.display = 'block';
  let p = 0;
  if (exportTimer) clearInterval(exportTimer);
  exportTimer = setInterval(() => {
    p = Math.min(100, p + 1.2);
    document.getElementById('export-bar').style.width = Math.round(p) + '%';
    document.getElementById('export-pct').textContent = Math.round(p) + '%';
    if (p >= 100) {
      clearInterval(exportTimer);
      notify('✅ "' + title + '" exporté avec succès !');
    }
  }, 80);
}

// ── UI Helpers ───────────────────────────────────────────────
function toggleChip(el) { el.classList.toggle('on'); }

function selExport(el) {
  document.querySelectorAll('.export-item').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
}

let notifTimer = null;
function notify(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
