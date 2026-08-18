/* Общее хранилище прогресса для всех концепций интерфейса. Данные курса берутся из course.js */

const STORE_KEY = "shkola-klod-koda-v2";

const Store = {
  state: (()=>{ try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || null; }catch(e){ return null; } })()
         || { student:"", steps:{}, skills:{}, notes:{} },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); if(window.Sync) Sync.schedule(); },

  stepOn(id,i){ return !!this.state.steps[id+"-"+i]; },
  toggleStep(id,i){ const k=id+"-"+i; this.state.steps[k] = !this.state.steps[k]; this.save(); return !!this.state.steps[k]; },
  skillVal(id,i){ return this.state.skills[id+"-s"+i] || 0; },
  cycleSkill(id,i){ const k=id+"-s"+i; this.state.skills[k] = ((this.state.skills[k]||0)+1)%3; this.save(); return this.state.skills[k]; },
  note(id){ return this.state.notes[id] || ""; },
  setNote(id,v){ this.state.notes[id]=v; this.save(); },

  dayStats(d){
    const total = d.practice.steps.length + d.skills.length;
    let s=0, k=0;
    d.practice.steps.forEach((_,i)=>{ if(this.stepOn(d.id,i)) s++; });
    d.skills.forEach((_,i)=>{ if(this.skillVal(d.id,i)===2) k++; });
    return { pct: total ? Math.round((s+k)/total*100) : 0, steps:s, skills:k, done: s===d.practice.steps.length && k===d.skills.length };
  },
  totalPct(){ const a = COURSE.days.map(d=>this.dayStats(d)); return Math.round(a.reduce((x,y)=>x+y.pct,0)/a.length); },
  weekPct(n){ const a = COURSE.days.filter(d=>d.w===n).map(d=>this.dayStats(d)); return Math.round(a.reduce((x,y)=>x+y.pct,0)/a.length); },
  currentDay(){ return COURSE.days.find(d=>this.dayStats(d).pct<100) || COURSE.days[COURSE.days.length-1]; },
  streak(){ let n=0; for(const d of COURSE.days){ if(this.dayStats(d).pct===100) n++; else break; } return n; },
  skillCounts(){ let c=[0,0,0]; COURSE.days.forEach(d=>d.skills.forEach((_,i)=> c[this.skillVal(d.id,i)]++)); return {no:c[0], learn:c[1], can:c[2]}; }
};
