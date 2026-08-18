/* СВЯЗЬ С БАЗОЙ ДАННЫХ.
   Прямой доступ к таблицам закрыт, всё идёт через три функции на стороне базы:
   student_login, student_save, teacher_list. */

const Cloud = {
  on(){ return !!(window.SUPA && SUPA.url && SUPA.key); },

  async call(fn, body){
    const r = await fetch(SUPA.url.replace(/\/$/,"") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "apikey": SUPA.key, "Authorization": "Bearer " + SUPA.key, "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if(!r.ok) throw new Error("Ошибка связи с базой: " + r.status);
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  },

  async login(code){
    const rows = await this.call("student_login", { p_code: code.trim().toUpperCase() });
    return Array.isArray(rows) ? rows[0] : rows;
  },
  async save(code, state){
    return this.call("student_save", { p_code: code.trim().toUpperCase(), p_state: state });
  },
  async teacherList(pin){
    return this.call("teacher_list", { p_pin: pin.trim() });
  },
  async teacherAdd(pin, name, code){
    return this.call("teacher_add_student", { p_pin: pin.trim(), p_name: name.trim(), p_code: code.trim().toUpperCase() });
  }
};

window.Cloud = Cloud;

/* СИНХРОНИЗАЦИЯ: копим изменения и отправляем пачкой, чтобы не дёргать базу на каждый клик */
const Sync = {
  code: localStorage.getItem("klod-code") || "",
  timer: null,
  setStatus(text, cls){
    const el = document.getElementById("syncState");
    if(!el) return;
    el.textContent = text;
    el.className = "sync " + (cls || "");
  },
  schedule(){
    if(!Cloud.on() || !this.code) return;
    clearTimeout(this.timer);
    this.setStatus("сохраняю...", "wait");
    this.timer = setTimeout(()=> this.flush(), 1200);
  },
  async flush(){
    if(!Cloud.on() || !this.code) return;
    try{
      await Cloud.save(this.code, Store.state);
      const t = new Date();
      this.setStatus("сохранено в " + String(t.getHours()).padStart(2,"0") + ":" + String(t.getMinutes()).padStart(2,"0"), "ok");
    }catch(e){
      this.setStatus("нет связи, прогресс в браузере", "bad");
    }
  }
};

window.Sync = Sync;
