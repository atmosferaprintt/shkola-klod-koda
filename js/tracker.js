/* ТРЕКЕР МЕСЯЦА: логика всех разделов. Данные из course.js, прогресс из store.js */

const LBL = ["не пробовал","учусь","умею"];

/* ---------- КАЛЕНДАРЬ ---------- */
function buildCal(){
  let html = "";
  COURSE.weeks.forEach(w=>{
    html += '<div class="wk"><b>Неделя '+w.n+'</b><span>'+w.title+'</span><i></i><span id="wp'+w.n+'"></span></div>';
    COURSE.days.filter(d=>d.w===w.n).forEach(d=>{
      html += '<div class="cell" data-id="'+d.id+'"><div class="badge"></div><div class="n">'+d.num+'</div>'+
        '<div class="t">'+d.title+'</div><div class="p"><i style="width:0%"></i></div></div>';
    });
  });
  const cal = document.getElementById("cal");
  cal.innerHTML = html;
  cal.querySelectorAll(".cell").forEach(c=> c.onclick = ()=> openDay(c.dataset.id));
}

function paint(){
  const total = Store.totalPct(), cur = Store.currentDay(), sc = Store.skillCounts();
  document.getElementById("bigPct").innerHTML = total + '<small>%</small>';
  document.getElementById("heroT").textContent = "День " + cur.num + ": " + cur.title;
  document.getElementById("heroP").textContent = cur.lead;
  document.getElementById("tDone").textContent = COURSE.days.filter(d=>Store.dayStats(d).pct===100).length;
  document.getElementById("tStreak").textContent = Store.streak();
  document.getElementById("tHours").textContent = COURSE.days.filter(d=>Store.dayStats(d).steps>0).length;
  document.getElementById("tSkills").textContent = sc.can;
  document.getElementById("tLearn").textContent = sc.learn;
  COURSE.weeks.forEach(w=>{ const e = document.getElementById("wp"+w.n); if(e) e.textContent = Store.weekPct(w.n)+"%"; });
  COURSE.days.forEach(d=>{
    const st = Store.dayStats(d), el = document.querySelector('.cell[data-id="'+d.id+'"]');
    if(!el) return;
    el.className = "cell" + (st.pct===100 ? " full" : st.pct>66 ? " f3" : st.pct>33 ? " f2" : st.pct>0 ? " f1" : "") + (d.id===cur.id ? " today" : "");
    el.querySelector(".p i").style.width = st.pct + "%";
    el.querySelector(".badge").textContent = d.id===cur.id ? "сегодня" : (st.pct===100 ? "✓" : "");
  });
  document.querySelectorAll("[data-skill]").forEach(b=>{
    const v = Store.skillVal(b.dataset.day, +b.dataset.skill);
    b.dataset.v = v; b.textContent = LBL[v];
  });
  paintSkillTiles();
}

/* ---------- ШТОРКА ДНЯ ---------- */
function openDay(id){
  const d = COURSE.days.find(x=>x.id===id);
  document.getElementById("shN").textContent = d.num;
  document.getElementById("shT").textContent = d.title;
  document.getElementById("shL").textContent = d.lead + " · 1 час";
  document.getElementById("shB").innerHTML =
    '<h4 class="lbl">Что надо понять</h4><div class="learn">'+
      d.learn.map(t=>'<div><b>'+t.t+'</b><span>'+t.d+'</span></div>').join("")+'</div>'+
    '<h4 class="lbl">Практика: '+d.practice.title+'</h4>'+
      d.practice.steps.map((s,i)=>'<div class="step'+(Store.stepOn(d.id,i)?' on':'')+'" data-i="'+i+'">'+
        '<div class="bx">'+(Store.stepOn(d.id,i)?'✓':'')+'</div><span>'+s+'</span></div>').join("")+
    '<textarea placeholder="Как прошёл день: что получилось, где застрял">'+Store.note(d.id)+'</textarea>'+
    '<h4 class="lbl">Приём с GPT</h4><div class="gpt"><b>сегодня в GPT</b>'+d.gpt+'</div>'+
    '<h4 class="lbl">Навыки дня</h4>'+
      d.skills.map((s,i)=>'<div class="sk"><p>'+s+'</p><button data-day="'+d.id+'" data-skill="'+i+'" data-v="'+Store.skillVal(d.id,i)+'">'+LBL[Store.skillVal(d.id,i)]+'</button></div>').join("");

  document.querySelectorAll("#shB .step").forEach(el=> el.onclick = ()=>{
    const on = Store.toggleStep(d.id,+el.dataset.i);
    el.classList.toggle("on",on); el.querySelector(".bx").textContent = on?"✓":"";
    paint();
  });
  bindSkills("#shB");
  document.querySelector("#shB textarea").oninput = e=> Store.setNote(d.id, e.target.value);
  document.getElementById("sheet").classList.add("on");
  document.getElementById("veil").classList.add("on");
}
function closeSheet(){
  document.getElementById("sheet").classList.remove("on");
  document.getElementById("veil").classList.remove("on");
}
function bindSkills(scope){
  document.querySelectorAll(scope+" [data-skill]").forEach(b=> b.onclick = ()=>{
    const v = Store.cycleSkill(b.dataset.day, +b.dataset.skill);
    b.dataset.v = v; b.textContent = LBL[v];
    paint();
  });
}

/* ---------- НАВЫКИ ---------- */
function buildSkills(){
  document.getElementById("skills").innerHTML =
    '<div class="tiles">'+
      '<div class="tile"><b id="kCan">0</b><span>умею</span></div>'+
      '<div class="tile hot"><b id="kLearn">0</b><span>учусь, нужен разбор</span></div>'+
      '<div class="tile"><b id="kNo">0</b><span>не пробовал</span></div>'+
    '</div>'+
    COURSE.weeks.map(w=>
      '<div class="skgroup"><h3><span>Неделя '+w.n+' · '+w.title+'</span><i></i></h3>'+
      COURSE.days.filter(d=>d.w===w.n).map(d=>
        '<div class="skday"><em>День '+d.num+' · '+d.title+'</em>'+
        d.skills.map((s,i)=>'<div class="sk"><p>'+s+'</p><button data-day="'+d.id+'" data-skill="'+i+'" data-v="0">не пробовал</button></div>').join("")+
        '</div>').join("")+
      '</div>').join("");
  bindSkills("#skills");
}
function paintSkillTiles(){
  const sc = Store.skillCounts();
  const set = (id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set("kCan",sc.can); set("kLearn",sc.learn); set("kNo",sc.no);
}

/* ---------- GPT ---------- */
function buildGpt(){
  document.getElementById("gpt").innerHTML = COURSE.gptkit.map(c=>
    '<div style="margin-bottom:30px"><div class="grouphead"><span>'+c.cat+'</span><i></i></div>'+
    (c.note ? '<p style="font-size:12.5px;color:var(--dim);margin-bottom:14px;max-width:760px">'+c.note+'</p>' : '')+
    c.items.map(it=>
      '<div class="pcard"><b>'+it.n+'</b>'+
      (it.d ? '<div class="d">'+it.d+'</div>' : '')+
      (it.p ? '<pre>'+it.p+'</pre><button class="btn acc copy" data-copy="'+encodeURIComponent(it.p)+'">Скопировать промт</button>' : '')+
      '</div>').join("")+
    '</div>').join("");
  document.querySelectorAll(".copy").forEach(b=> b.onclick = ()=>{
    navigator.clipboard.writeText(decodeURIComponent(b.dataset.copy));
    const old = b.textContent; b.textContent = "Скопировано"; setTimeout(()=> b.textContent = old, 1400);
  });
}

/* ---------- РЕСУРСЫ ---------- */
function buildRes(){
  document.getElementById("res").innerHTML = COURSE.resources.map(c=>
    '<div class="grouphead"><span>'+c.cat+'</span><i></i></div><div class="cards">'+
    c.items.map(r=>'<a class="rc" href="'+r.u+'" target="_blank" rel="noopener"><b>'+r.n+'</b>'+
      '<div class="u">'+r.u.replace(/^https?:\/\//,"")+'</div><p>'+r.d+'</p></a>').join("")+
    '</div>').join("");
}

/* ---------- СЛОВАРЬ ---------- */
function buildGloss(f){
  const q = (f||"").toLowerCase().trim();
  const list = COURSE.glossary.filter(g=> !q || g.g.toLowerCase().includes(q) || g.d.toLowerCase().includes(q));
  document.getElementById("gloss").innerHTML = list.length
    ? '<div class="cards">'+list.map(g=>'<div class="gterm"><b>'+g.g+'</b><span>'+g.d+'</span></div>').join("")+'</div>'
    : '<div class="empty">Ничего не нашлось. Попробуй другое слово.</div>';
}

/* ---------- ОТЧЁТ ---------- */
function reportText(){
  const who = Store.state.student || "ученик";
  let out = "ОТЧЁТ ПО КУРСУ КЛОД-КОД\nУченик: "+who+"\nПрогресс: "+Store.totalPct()+"% · день "+Store.currentDay().num+" из 30 · серия "+Store.streak()+"\n\n";
  COURSE.weeks.forEach(w=>{
    out += "НЕДЕЛЯ "+w.n+" "+w.title+" — "+Store.weekPct(w.n)+"%\n";
    COURSE.days.filter(d=>d.w===w.n).forEach(d=>{
      const st = Store.dayStats(d);
      if(!st.pct) return;
      out += "  "+d.num+" "+d.title+" — "+st.pct+"% (практика "+st.steps+"/"+d.practice.steps.length+")\n";
      const note = Store.note(d.id).trim();
      if(note) out += "     заметка: "+note.replace(/\n/g," ")+"\n";
    });
  });
  const stuck = [];
  COURSE.days.forEach(d=> d.skills.forEach((s,i)=>{ if(Store.skillVal(d.id,i)===1) stuck.push("день "+d.num+": "+s); }));
  if(stuck.length) out += "\nВ РАБОТЕ, НУЖЕН РАЗБОР:\n"+stuck.map(x=>"- "+x).join("\n")+"\n";
  return out;
}
function buildReport(){
  document.getElementById("reportBox").innerHTML = '<pre>'+reportText()+'</pre>';
}

/* ---------- ВКЛАДКИ ---------- */
function go(name){
  document.querySelectorAll("section").forEach(s=> s.classList.toggle("on", s.id === "v-"+name));
  document.querySelectorAll("nav button").forEach(b=> b.classList.toggle("on", b.dataset.go === name));
  if(name === "report") buildReport();
  window.scrollTo({top:0});
}

/* ---------- ВХОД ---------- */
function showApp(){
  document.getElementById("gate").classList.add("off");
  buildSkills(); paint(); buildReport();
}
async function tryLogin(code){
  const err = document.getElementById("codeErr");
  err.textContent = "";
  if(!Cloud.on()){
    err.textContent = "База пока не подключена. Занимайся без кода, прогресс сохранится в браузере.";
    return;
  }
  try{
    const row = await Cloud.login(code);
    if(!row){ err.textContent = "Код не найден. Проверь раскладку и пробелы."; return; }
    Sync.code = code.trim().toUpperCase();
    localStorage.setItem("klod-code", Sync.code);
    if(row.state && Object.keys(row.state).length) Store.state = row.state;
    if(row.name && !Store.state.student) Store.state.student = row.name;
    Store.save();
    document.getElementById("who").value = Store.state.student || "";
    document.getElementById("btnExit").style.display = "";
    Sync.setStatus("на связи с базой", "ok");
    showApp();
  }catch(e){
    err.textContent = "Не получилось связаться с базой. Проверь интернет.";
  }
}

/* ---------- СТАРТ ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  buildCal(); buildSkills(); buildGpt(); buildRes(); buildGloss(""); paint();

  const gate = document.getElementById("gate");
  if(!Cloud.on()){
    gate.classList.add("off");
  }else if(Sync.code){
    tryLogin(Sync.code);
  }
  document.getElementById("codeBtn").onclick = ()=> tryLogin(document.getElementById("codeInput").value);
  document.getElementById("codeInput").addEventListener("keydown", e=>{ if(e.key==="Enter") tryLogin(e.target.value); });
  document.getElementById("localBtn").onclick = ()=>{
    gate.classList.add("off");
    Sync.setStatus("прогресс только в этом браузере", "");
  };
  document.getElementById("btnExit").onclick = ()=>{
    if(!confirm("Выйти? Прогресс уже сохранён в базе.")) return;
    localStorage.removeItem("klod-code");
    localStorage.removeItem("shkola-klod-koda-v2");
    location.reload();
  };

  document.querySelectorAll("nav button").forEach(b=> b.onclick = ()=> go(b.dataset.go));
  document.getElementById("shClose").onclick = closeSheet;
  document.getElementById("veil").onclick = closeSheet;
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeSheet(); });
  document.getElementById("ctaBtn").onclick = ()=> openDay(Store.currentDay().id);
  document.getElementById("gSearch").oninput = e=> buildGloss(e.target.value);

  const who = document.getElementById("who");
  who.value = Store.state.student || "";
  who.oninput = e=>{ Store.state.student = e.target.value; Store.save(); };

  document.getElementById("btnCopy").onclick = ()=>{
    navigator.clipboard.writeText(reportText()).then(
      ()=> alert("Отчёт скопирован. Вставь его в переписку с учителем."),
      ()=> alert(reportText())
    );
  };
  document.getElementById("btnSave").onclick = ()=>{
    const blob = new Blob([JSON.stringify(Store.state,null,2)],{type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "progress-klod-kod.json"; a.click();
  };
  document.getElementById("fileLoad").onchange = e=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      try{
        Store.state = JSON.parse(r.result); Store.save();
        buildSkills(); paint(); paintSkillTiles(); buildReport();
        document.getElementById("who").value = Store.state.student || "";
        alert("Прогресс загружен.");
      }catch(err){ alert("Файл не читается."); }
    };
    r.readAsText(f);
  };
  document.getElementById("btnReset").onclick = ()=>{
    if(confirm("Стереть весь прогресс? Отменить будет нельзя.")){
      Store.state = { student:"", steps:{}, skills:{}, notes:{} }; Store.save();
      buildSkills(); paint(); paintSkillTiles(); buildReport();
      document.getElementById("who").value = "";
    }
  };
});
