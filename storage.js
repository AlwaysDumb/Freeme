// FreeMe — Storage Layer
const Storage = (() => {
  const KEY = 'AIzaSyCTBUBep6mifoxAyb5OmyYSxuU9NC3MwZs';
  const g = (k,d=null)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):d}catch{return d}};
  const s = (k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.error(e)}};
  
  return {
    getProfile(){ return g('fm_profile',{name:'',why:'',triggers:[],helpingStrategies:[],notHelpingStrategies:[],emergencyContacts:[],geminiKey:KEY,onboardingDone:false,joinedAt:new Date().toISOString()}) },
    setProfile(d){ s('fm_profile',d) },
    updateProfile(p){ this.setProfile({...this.getProfile(),...p}) },
    getApiKey(){ return this.getProfile().geminiKey||KEY },
    
    getEntries(){ return g('fm_entries',[]) },
    addEntry(entry){
      const entries=this.getEntries();
      const ne={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),createdAt:new Date().toISOString(),...entry};
      entries.unshift(ne); s('fm_entries',entries); return ne;
    },
    updateEntry(id,p){ const e=this.getEntries(); const i=e.findIndex(x=>x.id===id); if(i!==-1){e[i]={...e[i],...p}; s('fm_entries',e)} },
    deleteEntry(id){ s('fm_entries',this.getEntries().filter(e=>e.id!==id)) },
    getEntry(id){ return this.getEntries().find(e=>e.id===id)||null },
    
    getChatHistory(){ return g('fm_chat',[]) },
    addChatMessage(role,content){
      const h=this.getChatHistory();
      h.push({role,content,ts:new Date().toISOString()});
      if(h.length>80)h.splice(0,h.length-80);
      s('fm_chat',h);
    },
    clearChatHistory(){ s('fm_chat',[]) },
    
    getRelapses(){ return this.getEntries().filter(e=>e.type==='relapse') },
    getLastRelapse(){ const r=this.getRelapses(); return r.length?r[0]:null },
    getDaysSince(){
      const l=this.getLastRelapse();
      if(!l)return null;
      return Math.floor((Date.now()-new Date(l.createdAt))/86400000);
    },
    
    getStats(){
      const entries=this.getEntries();
      const relapses=entries.filter(e=>e.type==='relapse');
      const wins=entries.filter(e=>e.type==='win');
      
      const triggerCount={};
      entries.forEach(e=>(e.triggers||[]).forEach(t=>{triggerCount[t]=(triggerCount[t]||0)+1}));
      
      const moodData=entries.filter(e=>e.mood).slice(0,30).reverse().map(e=>({date:e.createdAt,mood:e.mood,type:e.type}));
      
      const hourDist=new Array(24).fill(0);
      relapses.forEach(r=>{hourDist[new Date(r.createdAt).getHours()]++});
      
      const relapseDates=relapses.map(r=>new Date(r.createdAt)).sort((a,b)=>a-b);
      const freePeriods=[];
      for(let i=1;i<relapseDates.length;i++){
        freePeriods.push({start:relapseDates[i-1],end:relapseDates[i],days:Math.floor((relapseDates[i]-relapseDates[i-1])/86400000)});
      }
      const longestFree=freePeriods.length?Math.max(...freePeriods.map(p=>p.days)):this.getDaysSince()||0;
      
      return {totalEntries:entries.length,totalRelapses:relapses.length,totalWins:wins.length,daysSince:this.getDaysSince(),triggerCount,moodData,hourDist,freePeriods,longestFree};
    }
  };
})();
