// FreeMe — Gemini AI Layer
const Gemini = (() => {
  const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  function buildContext() {
    const p = Storage.getProfile();
    const stats = Storage.getStats();
    const recent = Storage.getEntries().slice(0, 8);
    return `אתה מאמן תמיכה אישי, אמפתי ולא שיפוטי, לאדם שמתמודד עם התמכרות לפורנוגרפיה.

פילוסופיה: שיפור עצמי ולמידה מתמדת. ההתמודדות היא תהליך של צמיחה, לא מרוץ. אין "נפילה" — יש רגעים להתמודד ורגעים להתחזק.

פרופיל:
- שם: ${p.name||'לא צוין'}
- למה עושה את זה: ${p.why||'לא צוין'}
- טריגרים עיקריים: ${(p.triggers||[]).join(', ')||'לא צוין'}
- מה עוזר: ${(p.helpingStrategies||[]).join(', ')||'לא צוין'}
- מה לא עוזר: ${(p.notHelpingStrategies||[]).join(', ')||'לא צוין'}

נתונים:
- סה"כ רשומות: ${stats.totalEntries}
- נפילות מתועדות: ${stats.totalRelapses}
- ניצחונות: ${stats.totalWins}
${stats.daysSince!==null?`- ימים מאז הפעם האחרונה: ${stats.daysSince}`:'- טרם תועדה נפילה'}

אחרון:
${recent.map(e=>`[${new Date(e.createdAt).toLocaleDateString('he-IL')}] ${e.type}, מצב רוח ${e.mood||'?'}/5, ${(e.triggers||[]).join(',')}, "${(e.description||'').slice(0,50)}"`).join('\n')}

כללים: ענה בעברית. לא שיפוטי. פרקטי — הצע פעולה קונקרטית אחת. לא ארוך מדי. לא להזכיר ספירת ימים כמדד הצלחה.`;
  }
  
  async function call(messages) {
    const key = Storage.getApiKey();
    const res = await fetch(`${URL}?key=${key}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        contents: messages,
        generationConfig: {maxOutputTokens: 700, temperature: 0.82}
      })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.[0]?.text || 'לא קיבלתי תגובה.';
  }
  
  function wrap(ctx, history, userMsg) {
    const msgs = [
      {role:'user', parts:[{text: ctx}]},
      {role:'model', parts:[{text:'מובן. אני כאן לתמוך בך ללא שיפוט.'}]},
      ...history.slice(-14).map(m=>({role:m.role==='user'?'user':'model', parts:[{text:m.content}]})),
      {role:'user', parts:[{text:userMsg}]}
    ];
    return msgs;
  }
  
  return {
    async chat(userMsg, history=[]) {
      return call(wrap(buildContext(), history, userMsg));
    },
    
    async getDailyInsight() {
      return call(wrap(buildContext(), [], 'תן לי תובנה קצרה ומחזקת לתחילת היום — שתי עד שלוש משפטים. משהו שיעזור לי להתמודד טוב יותר היום.'));
    },
    
    async analyzePatterns() {
      return call(wrap(buildContext(), [], 'בהתבסס על הרשומות שלי, מה הדפוסים שאתה רואה? מה הטריגרים הנפוצים, מתי הסיכון גבוה, ומה כדאי שאשים לב אליו? תן ניתוח מפורט ומועיל.'));
    },
    
    async handleSOS(feeling) {
      return call(wrap(buildContext(), [], `אני במצב קשה עכשיו. ${feeling?`אני מרגיש: ${feeling}.`:''} עזור לי לעבור את הרגע הזה. תן הדרכה מיידית, קצרה ומעשית — עד 3 משפטים.`));
    },
    
    async reflectOnEntry(entry) {
      return call(wrap(buildContext(), [], `זה עתה רשמתי ביומן — סוג: ${entry.type}, מצב רוח: ${entry.mood}/5, טריגרים: ${(entry.triggers||[]).join(', ')||'לא'}. ${entry.description||''}. תגיב בצורה קצרה ותומכת — עד 3 משפטים.`));
    }
  };
})();
