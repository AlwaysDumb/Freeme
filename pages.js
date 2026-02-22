// FreeMe — Page Renderers
const Pages = (() => {
  const moodEmoji = ['😔','😕','😐','🙂','😊'];
  const moodWords = ['קשה מאוד','קשה','בסדר','טוב','מצוין'];
  const TRIGGERS = ['בדידות','שעמום','לחץ','עייפות','חרדה','כעס','עצב','תסכול','זמן פנוי','לילה','עבודה','מריבה','אחר'];
  const DURATIONS = ['דקות','~שעה','כמה שעות','לא יודע'];

  function formatDate(iso) {
    const d = new Date(iso), now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `לפני ${diff||1} דק׳`;
    if (diff < 1440) return `לפני ${Math.floor(diff/60)} שע׳`;
    if (diff < 2880) return 'אתמול';
    return d.toLocaleDateString('he-IL',{day:'numeric',month:'short'});
  }

  function moodPips(n) {
    return Array.from({length:5},(_,i)=>`<div class="mood-pip ${i<n?'on':''}"></div>`).join('');
  }

  function entryCard(e) {
    const desc = e.description || (e.type==='relapse'?'נפילה מתועדת':e.type==='win'?'ניצחון':'צ׳ק-אין');
    const tags = (e.triggers||[]).slice(0,3).map(t=>`<span class="etag">${t}</span>`).join('');
    return `
      <button class="entry-card" onclick="App.viewEntry('${e.id}')">
        <div class="entry-bar ${e.type}"></div>
        <div class="entry-content">
          <div class="entry-hdr">
            <span class="entry-type ${e.type}">${e.type==='checkin'?"צ׳ק-אין":e.type==='relapse'?'נפילה':'ניצחון'}</span>
            <span class="entry-date">${formatDate(e.createdAt)}</span>
          </div>
          <div class="entry-desc">${desc}</div>
          ${e.mood?`<div class="entry-mood">${moodPips(e.mood)}</div>`:''}
          ${tags?`<div class="entry-tags">${tags}</div>`:''}
        </div>
      </button>`;
  }

  function moodChartSVG(moodData) {
    if (!moodData||moodData.length<2) return `<div style="text-align:center;color:var(--t3);font-size:.8rem;padding:20px 0">צריך לפחות 2 רשומות עם מצב רוח</div>`;
    const W=300,H=96,pl=6,pr=6,pt=6,pb=14;
    const cw=W-pl-pr, ch=H-pt-pb, n=moodData.length;
    const xs=moodData.map((_,i)=>pl+(i/(n-1))*cw);
    const ys=moodData.map(d=>pt+ch-((d.mood-1)/4)*ch);
    const path=xs.map((x,i)=>`${i===0?'M':'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const area=`${path} L${xs[n-1].toFixed(1)},${(H-pb).toFixed(1)} L${xs[0].toFixed(1)},${(H-pb).toFixed(1)} Z`;
    const grids=[1,2,3,4,5].map(v=>{const y=pt+ch-((v-1)/4)*ch;return `<line x1="${pl}" y1="${y.toFixed(1)}" x2="${(W-pr).toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--bdr)" stroke-width="1"/>`;}).join('');
    const circles=xs.map((x,i)=>{const c=moodData[i].type==='relapse'?'var(--red)':moodData[i].type==='win'?'var(--green)':'var(--blue)';return `<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3.5" fill="${c}" stroke="var(--bg-2)" stroke-width="1.5"/>`;}).join('');
    const labelIdxs=[0,Math.floor(n/2),n-1].filter((v,i,a)=>a.indexOf(v)===i);
    const labels=labelIdxs.map(i=>`<text x="${xs[i].toFixed(1)}" y="${H}" text-anchor="middle" fill="var(--t3)" font-size="7.5">${new Date(moodData[i].date).toLocaleDateString('he-IL',{day:'numeric',month:'numeric'})}</text>`).join('');
    return `<div class="mood-chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="mood-chart-svg">
      <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--gold)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/></linearGradient></defs>
      ${grids}<path d="${area}" fill="url(#mg)"/>
      <path d="${path}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}${labels}</svg></div>`;
  }

  // ── DASHBOARD ────────────────────────────
  const dashboard = {
    render() {
      const p = Storage.getProfile();
      const stats = Storage.getStats();
      const entries = Storage.getEntries().slice(0,3);
      const h = new Date().getHours();
      const greet = h<5?'לילה טוב':h<12?'בוקר טוב':h<18?'צהריים טובים':'ערב טוב';
      let sinceHtml='';
      if (stats.daysSince!==null) {
        const s=stats.daysSince;
        sinceHtml=`<div class="dash-since">מאז הפעם האחרונה: <span class="since-val">${s===0?'היום':s===1?'אתמול':s+' ימים'}</span></div>`;
      }
      const recent = entries.length
        ? entries.map(e=>entryCard(e)).join('')
        : `<div class="empty-state" style="padding:28px 20px"><div class="es-icon">📓</div><div class="es-desc" style="margin-bottom:0">עדיין אין רשומות. רשום את הרשומה הראשונה שלך.</div></div>`;
      return `
        <div class="page" id="page-dashboard">
          <div class="dash-hero">
            <div class="dash-greeting">${greet},</div>
            <div class="dash-name"><em>${p.name||'חבר'}</em></div>
            <div class="dash-date">${new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'})}</div>
            ${sinceHtml}
          </div>
          <div class="mood-checkin">
            <div class="section-label">איך אתה מרגיש עכשיו?</div>
            <div class="mood-btns">
              ${moodEmoji.map((e,i)=>`<button class="mood-btn" data-mood="${i+1}" onclick="Pages.dashboard.logMood(${i+1})"><span>${e}</span><span class="mood-word">${moodWords[i]}</span></button>`).join('')}
            </div>
          </div>
          <div class="insight-card">
            <div class="insight-hdr"><span class="insight-icon">✨</span><span class="insight-lbl">תובנה יומית</span></div>
            <div class="insight-txt loading" id="insight-txt">טוען תובנה...</div>
            <button class="insight-refresh" onclick="Pages.dashboard.loadInsight()">↻ רענן</button>
          </div>
          <div class="quick-stats">
            <div class="stat-card"><div class="stat-val">${stats.totalEntries}</div><div class="stat-lbl">רשומות</div></div>
            <div class="stat-card"><div class="stat-val">${stats.totalWins}</div><div class="stat-lbl">ניצחונות</div></div>
            <div class="stat-card"><div class="stat-val">${stats.longestFree||0}</div><div class="stat-lbl">רצף ארוך (ימים)</div></div>
          </div>
          <div class="section-hdr">
            <span class="section-hdr-txt">רשומות אחרונות</span>
            <button class="section-hdr-link" onclick="App.nav('journal')">הכל</button>
          </div>
          <div class="entry-list">${recent}</div>
          <div class="spacer"></div>
        </div>`;
    },
    afterRender() { this.loadInsight(); },
    logMood(mood) {
      document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('sel',parseInt(b.dataset.mood)===mood));
      Storage.addEntry({type:'checkin',mood,description:`צ׳ק-אין מהיר — ${moodWords[mood-1]}`,triggers:[]});
      App.toast(`${moodEmoji[mood-1]} נשמר`,'ok');
    },
    async loadInsight() {
      const el=document.getElementById('insight-txt');
      if(!el)return;
      el.className='insight-txt loading'; el.textContent='טוען תובנה...';
      try { const t=await Gemini.getDailyInsight(); el.className='insight-txt'; el.textContent=t; }
      catch(e){ el.textContent='לא הצלחתי לטעון תובנה.'; }
    }
  };

  // ── JOURNAL ──────────────────────────────
  const journal = {
    filter:'all',
    render() {
      const all=Storage.getEntries();
      const filtered=this.filter==='all'?all:all.filter(e=>e.type===this.filter);
      const filterBtns=[['all','הכל'],['checkin',"צ׳ק-אין"],['relapse','נפילות'],['win','ניצחונות']].map(([f,l])=>
        `<button class="ttag ${this.filter===f?'sel':''}" onclick="Pages.journal.setFilter('${f}')">${l}</button>`).join('');
      const list = filtered.length
        ? filtered.map(e=>entryCard(e)).join('')
        : `<div class="empty-state"><div class="es-icon">${this.filter==='all'?'📓':'🔍'}</div><div class="es-title">${this.filter==='all'?'עדיין ריק':'אין רשומות'}</div><div class="es-desc">${this.filter==='all'?'התחל לתעד את המסע שלך.':'אין רשומות מסוג זה.'}</div>${this.filter==='all'?`<button class="btn btn-pri" onclick="App.showEntryForm()">+ רשומה ראשונה</button>`:''}</div>`;
      return `
        <div class="page" id="page-journal">
          <div class="page-header">
            <span class="page-title">יומן</span>
            <button class="header-icon-btn" onclick="App.showEntryForm()">＋</button>
          </div>
          <div style="padding:12px 16px 8px"><div class="trig-tags">${filterBtns}</div></div>
          <div class="entry-list">${list}</div>
          <div class="spacer"></div>
        </div>
        <button class="jfab" onclick="App.showEntryForm()">+ רשומה חדשה</button>`;
    },
    afterRender(){},
    setFilter(f){this.filter=f;App.nav('journal');}
  };

  // ── INSIGHTS ─────────────────────────────
  const insights = {
    render() {
      const s=Storage.getStats();
      const {triggerCount,moodData,hourDist,totalEntries,totalRelapses,totalWins,longestFree,daysSince}=s;
      if(!totalEntries) return `<div class="page"><div class="page-header"><span class="page-title">תובנות</span></div><div class="empty-state"><div class="es-icon">📊</div><div class="es-title">עדיין אין נתונים</div><div class="es-desc">התחל לרשום ביומן ותובנות יופיעו כאן.</div></div></div>`;
      const ds=daysSince!==null?(daysSince===0?'היום':daysSince===1?'אתמול':daysSince+' ימים'):null;
      const sorted=Object.entries(triggerCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
      const maxC=sorted[0]?.[1]||1;
      const maxH=Math.max(...hourDist,1);
      const hmCells=Array.from({length:24},(_,i)=>`<div class="hcell" data-l="${Math.ceil((hourDist[i]/maxH)*3)||0}" title="${i}:00">${i}</div>`).join('');
      return `
        <div class="page" id="page-insights">
          <div class="page-header"><span class="page-title">תובנות</span></div>
          <div class="ins-summary">
            <div class="isc"><div class="isc-val" style="color:var(--t1)">${totalEntries}</div><div class="isc-lbl">רשומות ביומן</div></div>
            <div class="isc"><div class="isc-val" style="color:var(--green)">${totalWins}</div><div class="isc-lbl">ניצחונות</div></div>
            <div class="isc"><div class="isc-val" style="color:var(--red)">${totalRelapses}</div><div class="isc-lbl">נפילות</div></div>
            <div class="isc"><div class="isc-val">${longestFree||0}</div><div class="isc-lbl">רצף נקי ארוך</div>${ds?`<div class="isc-sub">עכשיו: ${ds}</div>`:''}</div>
          </div>
          ${moodData.length>=2?`<div class="chart-card"><div class="chart-title">מגמת מצב רוח</div>${moodChartSVG(moodData)}<div style="display:flex;gap:10px;margin-top:10px;justify-content:flex-end"><span style="font-size:.62rem;color:var(--blue)">⬤ צ׳ק-אין</span><span style="font-size:.62rem;color:var(--green)">⬤ ניצחון</span><span style="font-size:.62rem;color:var(--red)">⬤ נפילה</span></div></div>`:''}
          ${sorted.length?`<div class="chart-card"><div class="chart-title">טריגרים נפוצים</div>${sorted.map(([t,c])=>`<div class="bar-row"><div class="bar-lbl">${t}</div><div class="bar-track"><div class="bar-fill" style="width:${(c/maxC*100).toFixed(0)}%"></div></div><div class="bar-count">${c}</div></div>`).join('')}</div>`:''}
          ${totalRelapses>0?`<div class="chart-card"><div class="chart-title">שעות סיכון — נפילות לפי שעה</div><div class="hour-hm" style="grid-template-columns:repeat(24,1fr)">${hmCells}</div><div style="display:flex;gap:6px;margin-top:8px;align-items:center"><span style="font-size:.6rem;color:var(--t3)">נמוך</span><div style="width:9px;height:9px;border-radius:2px;background:rgba(232,168,50,.22)"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(232,168,50,.5)"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(224,84,84,.7)"></div><span style="font-size:.6rem;color:var(--t3)">גבוה</span></div></div>`:''}
          <div class="analysis-card">
            <div class="insight-hdr"><span class="insight-icon">🧠</span><span class="insight-lbl">ניתוח AI</span></div>
            <div id="analysis-txt" class="analysis-txt" style="color:var(--t3);font-style:italic">לחץ לניתוח דפוסים אישי...</div>
            <button class="btn btn-sec btn-full mt8" id="analysis-btn" onclick="Pages.insights.loadAnalysis()">🔍 נתח את הדפוסים שלי</button>
          </div>
          <div class="spacer"></div>
        </div>`;
    },
    afterRender(){
      setTimeout(()=>document.querySelectorAll('.bar-fill').forEach(b=>{const w=b.style.width;b.style.width='0';setTimeout(()=>b.style.width=w,60)}),100);
    },
    async loadAnalysis(){
      const btn=document.getElementById('analysis-btn'),txt=document.getElementById('analysis-txt');
      if(!btn||!txt)return;
      btn.disabled=true;btn.textContent='מנתח...';
      txt.textContent='מנתח דפוסים...';txt.style.color='var(--t3)';txt.style.fontStyle='italic';
      try{const r=await Gemini.analyzePatterns();txt.textContent=r;txt.style.color='var(--t1)';txt.style.fontStyle='normal';btn.textContent='↻ נתח מחדש';btn.disabled=false;}
      catch(e){txt.textContent='שגיאה. בדוק חיבור.';btn.disabled=false;btn.textContent='נסה שוב';}
    }
  };

  // ── TOOLBOX ──────────────────────────────
  const toolbox = {
    render() {
      const p=Storage.getProfile();
      const contacts=p.emergencyContacts||[];
      const techniques=[
        {icon:'🌊',title:'גלישת דחף (Urge Surfing)',steps:['שים לב לדחף — אבל אל תפעל לפיו','דמיין שהדחף הוא גל שעולה ואז יורד','נשום עמוק. הגל יחלוף תוך 15–20 דקות','הישאר עם התחושה מבלי לפעול — אתה חזק ממנה']},
        {icon:'🛑',title:'HALT — מה אני באמת צריך?',steps:['האם אני רעב? (Hungry) — אכול משהו','האם אני עייף? (Tired) — נוח','האם אני בודד? (Lonely) — התקשר למישהו','האם אני כועס? (Angry) — שחרר בבטחה']},
        {icon:'⏱️',title:'כלל ה-15 דקות',steps:['אל תגיד "לא לעולם" — זה מתיש','אמור: "אחכה 15 דקות בלבד"','הסח את הדעת: מים, אוויר, תנועה','לרוב הדחף יחלוף. אם לא — עוד 15 דקות']},
        {icon:'🖐️',title:'5-4-3-2-1 עיגון',steps:['ראה: 5 דברים סביבך','גע: 4 דברים שאתה יכול לגעת','שמע: 3 דברים שאתה שומע','הרח: 2 דברים שאתה מריח','טעם: 1 דבר שאתה יכול לטעום']},
        {icon:'📍',title:'שנה מיקום מיידית',steps:['קום מהמקום שבו אתה — עכשיו','לך לחדר אחר, לחצר, לרחוב','שנה סביבה = שנה מצב מנטלי','שלח הודעה לחבר, בקש שיתקשר']},
        {icon:'✍️',title:'כתוב לפני שאתה פועל',steps:['לפני כל דבר, פתח את היומן','כתוב: מה אתה מרגיש? מה גרם לזה?','מה יקרה אם תפעל? ואם לא?','לעתים קרובות הכתיבה עצמה מפיגה את הדחף']}
      ];
      return `
        <div class="page" id="page-toolbox">
          <div class="page-header"><span class="page-title">ארגז כלים</span></div>
          <div class="tb-section" style="margin-top:16px">
            <div class="section-label">פעולות מהירות</div>
            <div class="tool-grid">
              <button class="tool-card" onclick="App.showBreathing()"><div class="tc-icon">🌬️</div><div class="tc-name">תרגיל נשימה</div><div class="tc-desc">4-7-8 להרגעה מיידית</div></button>
              <button class="tool-card" onclick="Pages.toolbox.grounding()"><div class="tc-icon">🖐️</div><div class="tc-name">עיגון חושים</div><div class="tc-desc">5-4-3-2-1 לחזרה להווה</div></button>
              <button class="tool-card" onclick="App.showSOS()"><div class="tc-icon">🆘</div><div class="tc-name">SOS</div><div class="tc-desc">עזרה מיידית</div></button>
              <button class="tool-card" onclick="App.nav('chat')"><div class="tc-icon">💬</div><div class="tc-name">שוחח עם AI</div><div class="tc-desc">מאמן אישי זמין תמיד</div></button>
            </div>
          </div>
          <div class="tb-section">
            <div class="section-label">טכניקות התמודדות</div>
            ${techniques.map((t,i)=>`
              <div class="tech-card" id="tc${i}">
                <button class="tech-hdr" onclick="Pages.toolbox.toggle(${i})">
                  <div class="tech-hdr-left"><span class="tech-icon">${t.icon}</span><span class="tech-title">${t.title}</span></div>
                  <span class="tech-arrow">▼</span>
                </button>
                <div class="tech-body">
                  ${t.steps.map((s,j)=>`<div class="tech-step"><div class="step-n">${j+1}</div><div>${s}</div></div>`).join('')}
                </div>
              </div>`).join('')}
          </div>
          <div class="tb-section">
            <div class="section-label">אנשי קשר לחירום</div>
            ${contacts.length?contacts.map(c=>`<div class="contact-card"><div class="contact-avatar">👤</div><div><div class="contact-name">${c.name}</div><div class="contact-phone" dir="ltr">${c.phone}</div></div><a href="tel:${c.phone}" class="contact-call">📞</a></div>`).join(''):`<div style="font-size:.85rem;color:var(--t3);text-align:center;padding:16px">הוסף אנשי קשר בפרופיל שלך</div>`}
            <button class="btn btn-sec btn-full mt8" onclick="App.nav('profile')">✏️ ערוך אנשי קשר</button>
          </div>
          <div class="spacer"></div>
        </div>`;
    },
    afterRender(){},
    toggle(i){document.getElementById('tc'+i)?.classList.toggle('open');},
    grounding(){
      App.showModalSimple('עיגון 5-4-3-2-1',`
        <p style="color:var(--t2);line-height:1.7;margin-bottom:14px">תרגיל זה מחזיר אותך להווה. עבור לאט על כל שלב:</p>
        ${['👁️ ראה: 5 דברים שאתה רואה','✋ גע: 4 דברים שאתה יכול לגעת','👂 שמע: 3 דברים שאתה שומע','👃 הרח: 2 דברים שאתה מריח','👅 טעם: דבר אחד שאתה יכול לטעום'].map((s,i)=>`<div style="display:flex;gap:12px;margin-bottom:12px;align-items:center"><div style="width:26px;height:26px;border-radius:50%;background:var(--gold-d);color:var(--gold-t);font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${5-i}</div><div style="font-size:.87rem;color:var(--t1)">${s}</div></div>`).join('')}
        <div style="background:var(--bg-3);border-radius:var(--r2);padding:12px;font-size:.82rem;color:var(--t2);line-height:1.65;margin-top:4px">קח זמן עם כל שלב. הנשימה היא המפתח. הדחף יחלוף.</div>
        <button class="btn btn-pri btn-full mt8" onclick="closeModal('entry-modal')">סגור</button>
      `);
    }
  };

  // ── CHAT ─────────────────────────────────
  const chat = {
    render() {
      const history=Storage.getChatHistory();
      let msgs='';
      if(!history.length){
        msgs=`<div class="chat-bubble ai">שלום! אני כאן לעזור לך במסע שלך. ספר לי איך אתה מרגיש היום, שאל אותי שאלה, או פשוט דבר איתי. אני לא שופט — רק תומך. 💛</div>`;
      } else {
        let lastDay='';
        msgs=history.map(m=>{
          const d=new Date(m.ts),day=d.toLocaleDateString('he-IL');
          const div=day!==lastDay?(lastDay=day,`<div class="chat-day">${day}</div>`):'';
          return `${div}<div class="chat-bubble ${m.role==='user'?'user':'ai'}">${m.content.replace(/\n/g,'<br>')}</div>`;
        }).join('');
      }
      return `
        <div class="page" id="page-chat">
          <div class="page-header">
            <span class="page-title">💬 מאמן AI</span>
            <button class="header-icon-btn" onclick="Pages.chat.clear()" title="נקה">🗑️</button>
          </div>
          <div class="chat-msgs" id="chat-msgs">${msgs}</div>
        </div>
        <div class="chat-input-bar">
          <textarea class="chat-input" id="chat-input" placeholder="כתוב כאן..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,110)+'px';document.getElementById('chat-send').disabled=!this.value.trim()" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Pages.chat.send()}"></textarea>
          <button class="chat-send" id="chat-send" disabled onclick="Pages.chat.send()">➤</button>
        </div>`;
    },
    afterRender(){const m=document.getElementById('chat-msgs');if(m)m.scrollTop=m.scrollHeight;},
    async send(){
      const inp=document.getElementById('chat-input'),btn=document.getElementById('chat-send'),msgs=document.getElementById('chat-msgs');
      if(!inp||!msgs)return;
      const text=inp.value.trim();if(!text)return;
      inp.value='';inp.style.height='auto';if(btn)btn.disabled=true;
      msgs.innerHTML+=`<div class="chat-bubble user">${text.replace(/\n/g,'<br>')}</div>`;
      Storage.addChatMessage('user',text);
      msgs.innerHTML+=`<div class="chat-bubble typing ai" id="typing-ind"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
      msgs.scrollTop=msgs.scrollHeight;
      try{
        const history=Storage.getChatHistory().slice(-20);
        const reply=await Gemini.chat(text,history.slice(0,-1));
        document.getElementById('typing-ind')?.remove();
        msgs.innerHTML+=`<div class="chat-bubble ai">${reply.replace(/\n/g,'<br>')}</div>`;
        Storage.addChatMessage('assistant',reply);
      } catch(e){
        document.getElementById('typing-ind')?.remove();
        msgs.innerHTML+=`<div class="chat-bubble ai">שגיאה. בדוק חיבור לרשת.</div>`;
      }
      msgs.scrollTop=msgs.scrollHeight;if(btn)btn.disabled=false;
    },
    clear(){App.confirm('לנקות את השיחה?','ההיסטוריה תימחק',()=>{Storage.clearChatHistory();App.nav('chat');});}
  };

  // ── PROFILE ──────────────────────────────
  const profile = {
    render() {
      const p=Storage.getProfile();
      const joined=new Date(p.joinedAt||Date.now()).toLocaleDateString('he-IL',{year:'numeric',month:'long',day:'numeric'});
      return `
        <div class="page" id="page-profile">
          <div class="page-header"><span class="page-title">פרופיל</span></div>
          <div class="prof-hdr">
            <div class="prof-avatar">🌱</div>
            <div class="prof-dname">${p.name||'אנונימי'}</div>
            <div class="prof-since">מ: ${joined}</div>
          </div>
          <div class="prof-section">
            <div class="section-label">פרטים אישיים</div>
            <button class="srow" onclick="App.editProfileField('name','שם','${(p.name||'').replace(/'/g,"\\'")}')">
              <div class="srow-icon">👤</div><div class="srow-content"><div class="srow-label">שם</div><div class="srow-val">${p.name||'לא הוגדר'}</div></div><div class="srow-arrow">›</div>
            </button>
            <button class="srow" onclick="App.editWhy()">
              <div class="srow-icon">💡</div><div class="srow-content"><div class="srow-label">למה אני עושה את זה</div><div class="srow-val">${(p.why||'').slice(0,40)||'לא הוגדר'}</div></div><div class="srow-arrow">›</div>
            </button>
          </div>
          <div class="prof-section">
            <div class="section-label">הטריגרים שלי</div>
            <button class="srow" onclick="App.editTags('triggers','הטריגרים שלי')">
              <div class="srow-icon">⚡</div><div class="srow-content"><div class="srow-label">טריגרים</div><div class="srow-val">${(p.triggers||[]).join(', ')||'לא הוגדרו'}</div></div><div class="srow-arrow">›</div>
            </button>
          </div>
          <div class="prof-section">
            <div class="section-label">אסטרטגיות</div>
            <button class="srow" onclick="App.editTags('helpingStrategies','מה עוזר לי')">
              <div class="srow-icon">✅</div><div class="srow-content"><div class="srow-label">מה עוזר לי</div><div class="srow-val">${(p.helpingStrategies||[]).join(', ')||'לא הוגדר'}</div></div><div class="srow-arrow">›</div>
            </button>
            <button class="srow" onclick="App.editTags('notHelpingStrategies','מה לא עוזר')">
              <div class="srow-icon">❌</div><div class="srow-content"><div class="srow-label">מה לא עוזר</div><div class="srow-val">${(p.notHelpingStrategies||[]).join(', ')||'לא הוגדר'}</div></div><div class="srow-arrow">›</div>
            </button>
          </div>
          <div class="prof-section">
            <div class="section-label">אנשי קשר לחירום</div>
            <button class="srow" onclick="App.editContacts()">
              <div class="srow-icon">📞</div><div class="srow-content"><div class="srow-label">אנשי קשר</div><div class="srow-val">${(p.emergencyContacts||[]).map(c=>c.name).join(', ')||'לא הוגדרו'}</div></div><div class="srow-arrow">›</div>
            </button>
          </div>
          <div class="prof-section">
            <div class="section-label">AI וייצוא</div>
            <button class="srow" onclick="App.editApiKey()">
              <div class="srow-icon">🔑</div><div class="srow-content"><div class="srow-label">Gemini API Key</div><div class="srow-val">${p.geminiKey?'מוגדר ✓':'לא הוגדר'}</div></div><div class="srow-arrow">›</div>
            </button>
            <button class="srow" onclick="App.exportData()">
              <div class="srow-icon">📤</div><div class="srow-content"><div class="srow-label">ייצוא נתונים</div></div><div class="srow-arrow">›</div>
            </button>
          </div>
          <div class="spacer"></div>
        </div>`;
    },
    afterRender(){}
  };

  return {dashboard,journal,insights,toolbox,chat,profile,moodEmoji,moodWords,TRIGGERS,DURATIONS,entryCard,formatDate};
})();
