// FreeMe — Main App Controller
const App = (() => {
  let currentPage = 'dashboard';
  let breathingTimer = null;
  let breathingPhase = 0;
  let breathingCount = 0;

  // ── Init ─────────────────────────────────
  function init() {
    const profile = Storage.getProfile();
    if (!profile.onboardingDone) {
      showOnboarding();
    } else {
      showApp();
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }

  function showApp() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('app').style.display = '';
    nav(currentPage);
  }

  // ── Navigation ───────────────────────────
  function nav(page) {
    currentPage = page;
    const content = document.getElementById('main-content');
    const pageMap = {
      dashboard: Pages.dashboard,
      journal:   Pages.journal,
      insights:  Pages.insights,
      toolbox:   Pages.toolbox,
      chat:      Pages.chat,
      profile:   Pages.profile
    };

    const renderer = pageMap[page];
    if (!renderer) return;

    content.innerHTML = renderer.render();
    renderer.afterRender();

    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    content.scrollTop = 0;
  }

  // ── SOS ──────────────────────────────────
  function showSOS() {
    document.getElementById('sos-overlay').classList.remove('hidden');
  }

  function hideSOS() {
    document.getElementById('sos-overlay').classList.add('hidden');
  }

  // ── Breathing ────────────────────────────
  function showBreathing() {
    hideSOS();
    document.getElementById('breathing-screen').style.display = 'flex';
    startBreathingCycle();
  }

  function stopBreathing() {
    document.getElementById('breathing-screen').style.display = 'none';
    if (breathingTimer) { clearInterval(breathingTimer); breathingTimer = null; }
    breathingPhase = 0; breathingCount = 0;
  }

  const BREATH_PHASES = [
    { label: 'שאף', seconds: 4, instruction: 'שאף לאט דרך האף...' },
    { label: 'החזק', seconds: 7, instruction: 'החזק את האוויר...' },
    { label: 'נשוף', seconds: 8, instruction: 'נשוף לאט דרך הפה...' }
  ];

  function startBreathingCycle() {
    breathingPhase = 0;
    breathingCount = 0;
    runBreathPhase();
  }

  function runBreathPhase() {
    const phase = BREATH_PHASES[breathingPhase];
    const countEl = document.getElementById('breath-count');
    const phaseEl = document.getElementById('breath-phase');
    const instrEl = document.getElementById('breath-instr');
    if (!countEl) return;

    phaseEl.textContent = phase.label;
    instrEl.textContent = phase.instruction;
    breathingCount = phase.seconds;
    countEl.textContent = breathingCount;

    if (breathingTimer) clearInterval(breathingTimer);
    breathingTimer = setInterval(() => {
      breathingCount--;
      if (countEl) countEl.textContent = breathingCount;
      if (breathingCount <= 0) {
        clearInterval(breathingTimer);
        breathingPhase = (breathingPhase + 1) % BREATH_PHASES.length;
        setTimeout(runBreathPhase, 400);
      }
    }, 1000);
  }

  // ── Entry Form ───────────────────────────
  function showEntryForm(prefillType) {
    const modal = document.getElementById('entry-modal');
    modal.querySelector('.modal-body').innerHTML = buildEntryForm(prefillType);
    openModal('entry-modal');
    if (prefillType) selectEntryType(prefillType);
  }

  function buildEntryForm(prefillType) {
    const moods = Pages.moodEmoji;
    const moodWords = Pages.moodWords;
    return `
      <div class="form-group">
        <div class="form-label">סוג הרשומה</div>
        <div class="type-sel">
          <button class="tsel-btn ${prefillType==='checkin'?'sel checkin':''}" data-type="checkin" onclick="selectEntryType('checkin')">
            <span class="tsel-emoji">📝</span><span>צ'ק-אין</span>
          </button>
          <button class="tsel-btn ${prefillType==='relapse'?'sel relapse':''}" data-type="relapse" onclick="selectEntryType('relapse')">
            <span class="tsel-emoji">⚠️</span><span>נפילה</span>
          </button>
          <button class="tsel-btn ${prefillType==='win'?'sel win':''}" data-type="win" onclick="selectEntryType('win')">
            <span class="tsel-emoji">🏆</span><span>ניצחון</span>
          </button>
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">מצב רוח עכשיו</div>
        <div class="mood-scale" id="mood-scale">
          ${moods.map((e,i)=>`<button class="ms-btn" data-mood="${i+1}" onclick="selectMood(${i+1})" title="${moodWords[i]}">${e}</button>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">טריגרים — מה גרם לזה?</div>
        <div class="trig-tags" id="trig-tags">
          ${Pages.TRIGGERS.map(t=>`<button class="ttag" data-trigger="${t}" onclick="toggleTrigger('${t}')">${t}</button>`).join('')}
        </div>
      </div>

      <div class="relapse-extra" id="relapse-extra">
        <div class="form-group">
          <div class="form-label">כמה זמן נמשך?</div>
          <div class="dur-opts" id="dur-opts">
            ${Pages.DURATIONS.map(d=>`<button class="dur-btn" data-dur="${d}" onclick="selectDuration('${d}')">${d}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <div class="form-label">מה יכול היה לעזור לי לעצור?</div>
          <textarea class="form-textarea" id="what-couldve-helped" placeholder="חשוב על זה בכנות..."></textarea>
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">תיאור חופשי</div>
        <textarea class="form-textarea" id="entry-desc" placeholder="איך היה? מה קרה לפני? מה אתה מרגיש?"></textarea>
      </div>

      <div class="form-group">
        <div class="form-label">מה עשיתי / אמרתי לעצמי</div>
        <input class="form-input" id="entry-coping" placeholder="כלי התמודדות שהשתמשתי בו...">
      </div>

      <button class="btn btn-pri btn-full" onclick="App.saveEntry()">💾 שמור רשומה</button>
      <div class="divider"></div>
      <button class="btn btn-ghost btn-full" onclick="closeModal('entry-modal')">ביטול</button>
    `;
  }

  function saveEntry() {
    const typeBtn = document.querySelector('.tsel-btn.sel');
    const moodBtn = document.querySelector('.ms-btn.sel');
    const triggers = Array.from(document.querySelectorAll('.ttag.sel')).map(b=>b.dataset.trigger);
    const durBtn = document.querySelector('.dur-btn.sel');

    if (!typeBtn) { toast('בחר סוג רשומה', 'err'); return; }

    const entry = {
      type: typeBtn.dataset.type,
      mood: moodBtn ? parseInt(moodBtn.dataset.mood) : null,
      triggers,
      description: document.getElementById('entry-desc')?.value.trim() || '',
      copingUsed: document.getElementById('entry-coping')?.value.trim() || '',
    };

    if (entry.type === 'relapse') {
      entry.relapseDuration = durBtn?.dataset.dur || '';
      entry.whatCouldHelp = document.getElementById('what-couldve-helped')?.value.trim() || '';
    }

    const saved = Storage.addEntry(entry);
    closeModal('entry-modal');
    toast('רשומה נשמרה ✓', 'ok');
    nav(currentPage);

    // Get AI reflection async
    Gemini.reflectOnEntry(entry).then(reply => {
      if (reply) toast('💬 AI: ' + reply.slice(0,60) + '...', 'ok');
    }).catch(()=>{});
  }

  // ── View Entry ────────────────────────────
  function viewEntry(id) {
    const entry = Storage.getEntry(id);
    if (!entry) return;
    const typeLabel = {checkin:"צ'ק-אין", relapse:'נפילה', win:'ניצחון'}[entry.type];
    const typeColor = {checkin:'var(--blue)', relapse:'var(--red)', win:'var(--green)'}[entry.type];
    const mood = entry.mood ? Pages.moodEmoji[entry.mood-1] + ' ' + Pages.moodWords[entry.mood-1] : '—';
    const triggers = (entry.triggers||[]).join(', ') || '—';

    const body = `
      <div style="margin-bottom:16px">
        <span style="font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${typeColor}">${typeLabel}</span>
        <div style="font-size:.78rem;color:var(--t3);margin-top:3px">${new Date(entry.createdAt).toLocaleString('he-IL')}</div>
      </div>
      ${entry.description?`<div style="font-size:.9rem;color:var(--t1);line-height:1.7;margin-bottom:16px">${entry.description}</div>`:'' }
      <div class="divider"></div>
      <div style="display:grid;gap:10px;margin-bottom:16px">
        <div><div style="font-size:.7rem;color:var(--t3);margin-bottom:2px">מצב רוח</div><div style="font-size:.9rem">${mood}</div></div>
        <div><div style="font-size:.7rem;color:var(--t3);margin-bottom:2px">טריגרים</div><div style="font-size:.9rem;color:var(--t1)">${triggers}</div></div>
        ${entry.copingUsed?`<div><div style="font-size:.7rem;color:var(--t3);margin-bottom:2px">כלי התמודדות</div><div style="font-size:.9rem;color:var(--t1)">${entry.copingUsed}</div></div>`:''}
        ${entry.type==='relapse'&&entry.relapseDuration?`<div><div style="font-size:.7rem;color:var(--t3);margin-bottom:2px">משך</div><div style="font-size:.9rem;color:var(--t1)">${entry.relapseDuration}</div></div>`:''}
        ${entry.whatCouldHelp?`<div><div style="font-size:.7rem;color:var(--t3);margin-bottom:2px">מה יכול היה לעזור</div><div style="font-size:.9rem;color:var(--t1)">${entry.whatCouldHelp}</div></div>`:''}
      </div>
      <button class="btn btn-dng btn-full" onclick="App.deleteEntry('${id}')">🗑️ מחק רשומה</button>
    `;

    const modal = document.getElementById('entry-modal');
    modal.querySelector('.modal-title').textContent = typeLabel;
    modal.querySelector('.modal-body').innerHTML = body;
    openModal('entry-modal');
  }

  function deleteEntry(id) {
    confirm('למחוק את הרשומה?', 'פעולה זו אינה ניתנת לביטול', () => {
      Storage.deleteEntry(id);
      closeModal('entry-modal');
      toast('נמחק', 'ok');
      nav(currentPage);
    });
  }

  // ── SOS Chat ─────────────────────────────
  async function sosChatAI() {
    hideSOS();
    nav('chat');
    setTimeout(async () => {
      const feeling = document.querySelector('#sos-feeling')?.value || '';
      const msgs = document.getElementById('chat-msgs');
      if (!msgs) return;
      msgs.innerHTML += `<div class="chat-bubble user">אני במצב קשה עכשיו ומצטרך עזרה.</div>`;
      msgs.innerHTML += `<div class="chat-bubble typing ai" id="typing-sos"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
      msgs.scrollTop = msgs.scrollHeight;
      try {
        const reply = await Gemini.handleSOS(feeling);
        document.getElementById('typing-sos')?.remove();
        msgs.innerHTML += `<div class="chat-bubble ai">${reply.replace(/\n/g,'<br>')}</div>`;
        Storage.addChatMessage('assistant', reply);
        msgs.scrollTop = msgs.scrollHeight;
      } catch(e) {
        document.getElementById('typing-sos')?.remove();
      }
    }, 300);
  }

  // ── Modals ───────────────────────────────
  function openModal(id) {
    document.getElementById(id)?.classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  function showModalSimple(title, bodyHtml) {
    const m = document.getElementById('entry-modal');
    m.querySelector('.modal-title').textContent = title;
    m.querySelector('.modal-body').innerHTML = bodyHtml;
    openModal('entry-modal');
  }

  // ── Profile Editing ───────────────────────
  function editProfileField(field, label, current) {
    showModalSimple(`ערוך: ${label}`, `
      <div class="form-group">
        <div class="form-label">${label}</div>
        <input class="form-input" id="pf-input" value="${current||''}" placeholder="${label}">
      </div>
      <button class="btn btn-pri btn-full" onclick="App.saveProfileField('${field}',document.getElementById('pf-input').value)">שמור</button>
    `);
    setTimeout(() => document.getElementById('pf-input')?.focus(), 200);
  }

  function saveProfileField(field, value) {
    Storage.updateProfile({ [field]: value.trim() });
    closeModal('entry-modal');
    toast('נשמר ✓', 'ok');
    nav('profile');
  }

  function editWhy() {
    const p = Storage.getProfile();
    showModalSimple('למה אני עושה את זה', `
      <div class="form-group">
        <div class="form-label">הסיבה האמיתית שלי</div>
        <textarea class="form-textarea" id="why-input" placeholder="מה מוביל אותי לשינוי? מה אני רוצה להרוויח מזה?">${p.why||''}</textarea>
        <div class="form-hint">זה יוצג ל-AI כדי לתמוך בך טוב יותר</div>
      </div>
      <button class="btn btn-pri btn-full" onclick="App.saveProfileField('why',document.getElementById('why-input').value)">שמור</button>
    `);
    setTimeout(() => document.getElementById('why-input')?.focus(), 200);
  }

  function editTags(field, label) {
    const p = Storage.getProfile();
    const current = p[field] || [];
    const renderTags = () => current.map((t,i) => `
      <div class="tw-tag">
        <span>${t}</span>
        <button class="tw-rem" onclick="App._removeTag('${field}',${i})">×</button>
      </div>`).join('');

    showModalSimple(label, `
      <div class="form-group">
        <div class="tags-display" id="tags-display">${renderTags()}</div>
        <div class="tw-input-row">
          <input class="form-input" id="tag-input" placeholder="הוסף פריט..." onkeydown="if(event.key==='Enter'){App._addTag('${field}');event.preventDefault()}">
          <button class="btn btn-sec" onclick="App._addTag('${field}')">+</button>
        </div>
      </div>
      <button class="btn btn-pri btn-full" onclick="closeModal('entry-modal');App.nav('profile')">סגור</button>
    `);
    setTimeout(() => document.getElementById('tag-input')?.focus(), 200);
  }

  function _addTag(field) {
    const inp = document.getElementById('tag-input');
    const val = inp?.value.trim();
    if (!val) return;
    const p = Storage.getProfile();
    const arr = [...(p[field]||[]), val];
    Storage.updateProfile({ [field]: arr });
    inp.value = '';
    const disp = document.getElementById('tags-display');
    if (disp) disp.innerHTML = arr.map((t,i)=>`<div class="tw-tag"><span>${t}</span><button class="tw-rem" onclick="App._removeTag('${field}',${i})">×</button></div>`).join('');
  }

  function _removeTag(field, idx) {
    const p = Storage.getProfile();
    const arr = [...(p[field]||[])];
    arr.splice(idx,1);
    Storage.updateProfile({ [field]: arr });
    const disp = document.getElementById('tags-display');
    if (disp) disp.innerHTML = arr.map((t,i)=>`<div class="tw-tag"><span>${t}</span><button class="tw-rem" onclick="App._removeTag('${field}',${i})">×</button></div>`).join('');
  }

  function editContacts() {
    const p = Storage.getProfile();
    const contacts = p.emergencyContacts || [];

    const renderContacts = () => contacts.map((c,i) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--bg-3);padding:10px 14px;border-radius:var(--r2)">
        <div style="flex:1">
          <div style="font-size:.87rem;font-weight:500">${c.name}</div>
          <div style="font-size:.75rem;color:var(--t3)" dir="ltr">${c.phone}</div>
        </div>
        <button onclick="App._removeContact(${i})" style="color:var(--red);font-size:1.1rem">×</button>
      </div>`).join('');

    showModalSimple('אנשי קשר לחירום', `
      <div id="contacts-list">${renderContacts()}</div>
      <div style="display:grid;gap:8px;margin-top:14px">
        <input class="form-input" id="c-name" placeholder="שם">
        <input class="form-input" id="c-phone" placeholder="מספר טלפון" type="tel" dir="ltr">
        <button class="btn btn-sec" onclick="App._addContact()">+ הוסף</button>
      </div>
      <div class="divider"></div>
      <button class="btn btn-pri btn-full" onclick="closeModal('entry-modal');App.nav('profile')">סגור</button>
    `);
  }

  function _addContact() {
    const name = document.getElementById('c-name')?.value.trim();
    const phone = document.getElementById('c-phone')?.value.trim();
    if (!name || !phone) { toast('מלא שם וטלפון', 'err'); return; }
    const p = Storage.getProfile();
    const contacts = [...(p.emergencyContacts||[]), {name, phone}];
    Storage.updateProfile({ emergencyContacts: contacts });
    document.getElementById('c-name').value = '';
    document.getElementById('c-phone').value = '';
    const list = document.getElementById('contacts-list');
    if (list) list.innerHTML = contacts.map((c,i)=>`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--bg-3);padding:10px 14px;border-radius:var(--r2)">
        <div style="flex:1"><div style="font-size:.87rem;font-weight:500">${c.name}</div><div style="font-size:.75rem;color:var(--t3)" dir="ltr">${c.phone}</div></div>
        <button onclick="App._removeContact(${i})" style="color:var(--red);font-size:1.1rem">×</button>
      </div>`).join('');
  }

  function _removeContact(idx) {
    const p = Storage.getProfile();
    const contacts = [...(p.emergencyContacts||[])];
    contacts.splice(idx, 1);
    Storage.updateProfile({ emergencyContacts: contacts });
    const list = document.getElementById('contacts-list');
    if (list) list.innerHTML = contacts.map((c,i)=>`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--bg-3);padding:10px 14px;border-radius:var(--r2)">
        <div style="flex:1"><div style="font-size:.87rem;font-weight:500">${c.name}</div><div style="font-size:.75rem;color:var(--t3)" dir="ltr">${c.phone}</div></div>
        <button onclick="App._removeContact(${i})" style="color:var(--red);font-size:1.1rem">×</button>
      </div>`).join('');
  }

  function editApiKey() {
    const p = Storage.getProfile();
    showModalSimple('Gemini API Key', `
      <div class="form-group">
        <div class="form-label">API Key</div>
        <input class="form-input" id="api-key-input" value="${p.geminiKey||''}" placeholder="AIza..." dir="ltr">
        <div class="form-hint">ניתן לקבל חינם ב-aistudio.google.com</div>
      </div>
      <button class="btn btn-pri btn-full" onclick="App.saveProfileField('geminiKey',document.getElementById('api-key-input').value)">שמור</button>
    `);
    setTimeout(() => document.getElementById('api-key-input')?.focus(), 200);
  }

  // ── Export ────────────────────────────────
  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      entries: Storage.getEntries(),
      stats: Storage.getStats()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `freeme-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('נתונים יוצאו ✓', 'ok');
  }

  // ── Onboarding ────────────────────────────
  let obStep = 0;
  const OB_STEPS = 4;

  function showOnboarding() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('onboarding-screen').style.display = 'flex';
    obStep = 0;
    updateOnboarding();
  }

  function updateOnboarding() {
    document.querySelectorAll('.ob-step').forEach((el,i) => {
      el.classList.toggle('active', i === obStep);
    });
    document.querySelectorAll('.pdot').forEach((el,i) => {
      el.classList.toggle('active', i === obStep);
    });
  }

  function nextOBStep() {
    if (obStep === 0) {
      const name = document.getElementById('ob-name')?.value.trim();
      if (!name) { toast('הכנס שם כלשהו', 'err'); return; }
      Storage.updateProfile({ name });
    }
    if (obStep === 1) {
      const why = document.getElementById('ob-why')?.value.trim();
      Storage.updateProfile({ why: why || '' });
    }
    if (obStep === 2) {
      const triggers = Array.from(document.querySelectorAll('.ob-trigger.sel')).map(b=>b.dataset.t);
      Storage.updateProfile({ triggers });
    }
    if (obStep === 3) {
      const helps = document.getElementById('ob-helps')?.value.trim();
      const key = document.getElementById('ob-key')?.value.trim();
      Storage.updateProfile({
        helpingStrategies: helps ? helps.split('\n').filter(Boolean) : [],
        geminiKey: key || Storage.DEFAULT_API_KEY,
        onboardingDone: true
      });
      finishOnboarding();
      return;
    }
    obStep++;
    updateOnboarding();
  }

  function prevOBStep() {
    if (obStep > 0) { obStep--; updateOnboarding(); }
  }

  function finishOnboarding() {
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
    showApp();
    toast('ברוך הבא! 🌱', 'ok');
  }

  // ── Toast ─────────────────────────────────
  let toastTimer = null;
  function toast(msg, type='') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type} show`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  // ── Confirm ───────────────────────────────
  function confirm(title, desc, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-desc').textContent = desc;
    document.getElementById('confirm-ok').onclick = () => {
      document.getElementById('confirm-dlg').classList.remove('open');
      onConfirm();
    };
    document.getElementById('confirm-cancel').onclick = () => {
      document.getElementById('confirm-dlg').classList.remove('open');
    };
    document.getElementById('confirm-dlg').classList.add('open');
  }

  return {
    init, nav, showApp, showSOS, hideSOS,
    showBreathing, stopBreathing,
    showEntryForm, saveEntry, viewEntry, deleteEntry,
    sosChatAI, openModal, closeModal, showModalSimple,
    editProfileField, saveProfileField, editWhy, editTags,
    _addTag, _removeTag, editContacts, _addContact, _removeContact,
    editApiKey, exportData,
    showOnboarding, nextOBStep, prevOBStep,
    toast, confirm
  };
})();

// ── Global helpers (called from inline HTML) ──────────────
function selectEntryType(type) {
  document.querySelectorAll('.tsel-btn').forEach(b => {
    b.className = `tsel-btn ${b.dataset.type===type?'sel '+type:''}`;
  });
  const extra = document.getElementById('relapse-extra');
  if (extra) extra.classList.toggle('vis', type==='relapse');
}

function selectMood(n) {
  document.querySelectorAll('.ms-btn').forEach(b => {
    b.classList.toggle('sel', parseInt(b.dataset.mood)===n);
  });
}

function toggleTrigger(t) {
  const btn = document.querySelector(`.ttag[data-trigger="${t}"]`);
  if (btn) btn.classList.toggle('sel');
}

function selectDuration(d) {
  document.querySelectorAll('.dur-btn').forEach(b => {
    b.classList.toggle('sel', b.dataset.dur===d);
  });
}

function closeModal(id) { App.closeModal(id); }

window.addEventListener('DOMContentLoaded', () => App.init());
