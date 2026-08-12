let mode = "purpose";

const purposeOrder = [
  "Боль и температура",
  "Аллергия",
  "Дыхательные пути",
  "ЖКТ",
  "Инфекции",
  "Мочевыводящие пути",
  "Сердце и сосуды",
  "Нервная система и мышцы",
  "Антисептики и обработка",
  "Перевязка и расходники"
];

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + "T23:59:59");
  return isNaN(d) ? null : d;
}
function statusOf(m) {
  const exp = parseDate(m.expiry_iso);
  if (!exp) return "unknown";
  const now = new Date();
  now.setHours(0,0,0,0);
  const days = (exp - now) / 86400000;
  if (days < 0) return "expired";
  if (days <= 90) return "soon";
  return "good";
}
function statusText(s) {
  return {expired:"Просрочен", soon:"Скоро истекает", good:"Годен", unknown:"Уточнить"}[s];
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function initFilters() {
  const locs=[...new Set(meds.map(m=>m.location))].sort((a,b)=>a.localeCompare(b,"ru"));
  document.getElementById("locationFilter").innerHTML += locs.map(x=>`<option>${esc(x)}</option>`).join("");
}
function summary() {
  const st = meds.map(statusOf);
  total.textContent=meds.length;
  expired.textContent=st.filter(x=>x==="expired").length;
  soon.textContent=st.filter(x=>x==="soon").length;
  unknown.textContent=st.filter(x=>x==="unknown").length;

  const expiredNames = meds.filter(m=>statusOf(m)==="expired").map(m=>m.name);
  const soonNames = meds.filter(m=>statusOf(m)==="soon").map(m=>m.name);
  let html="";
  if(expiredNames.length) html += `<div class="alert"><b>Убрать из аптечки:</b> ${expiredNames.map(esc).join(", ")}.</div>`;
  if(soonNames.length) html += `<div class="alert" style="border-left-color:#b47a09"><b>Проверить в ближайшее время:</b> ${soonNames.map(esc).join(", ")}.</div>`;
  html += `<div class="alert" style="border-left-color:#666"><b>Нужно уточнить:</b> срок Кетонал ДУО; концентрацию и срок хлоргексидина; срок перекиси; сроки стерильности шприцев; при желании — точный вариант Гевискона и производителя детского парацетамола.</div>`;
  alerts.innerHTML=html;
}
function card(m) {
  const st=statusOf(m);
  const badNote = st==="expired" ? " badnote" : "";
  return `<article class="card">
    <div class="card-head">
      <div><div class="name">${esc(m.name)}</div><div class="dose">${esc(m.dose)}</div></div>
      <span class="badge ${st}">${statusText(st)}</span>
    </div>
    <div class="grid">
      <div class="field"><span class="label">Действующее вещество</span>${esc(m.active)}</div>
      <div class="field"><span class="label">Срок</span>${esc(m.expiry)}</div>
      <div class="field"><span class="label">Для чего</span>${esc(m.purpose)}</div>
      <div class="field"><span class="label">Где лежит</span>${esc(m.location)}</div>
    </div>
    <div class="mech"><span class="label">Механизм / группа</span><b>${esc(m.mechanism_group)}</b><br>${esc(m.mechanism)}</div>
    ${m.note ? `<div class="note${badNote}">${esc(m.note)}</div>` : ""}
    <div class="actions">${m.instruction ? `<a class="link" href="${esc(m.instruction)}" target="_blank" rel="noopener">Открыть инструкцию ↗</a>` : `<span class="nolink">Для расходного материала лекарственная инструкция не требуется.</span>`}</div>
  </article>`;
}
function render() {
  const q=search.value.trim().toLowerCase();
  const loc=locationFilter.value;
  const sf=statusFilter.value;
  let items=meds.filter(m=>{
    const hay=[m.name,m.dose,m.active,m.purpose,m.purpose_group,m.mechanism_group,m.mechanism,m.location,m.expiry,m.note].join(" ").toLowerCase();
    return (!q || hay.includes(q)) && (!loc || m.location===loc) && (!sf || statusOf(m)===sf);
  });

  items.sort((a,b)=>a.name.localeCompare(b.name,"ru"));

  const key=mode==="purpose"?"purpose_group":"mechanism_group";
  const groups={};
  items.forEach(m => (groups[m[key]] ??= []).push(m));

  let names=Object.keys(groups);
  if (mode === "purpose") {
    names.sort((a,b)=>{
      const ai = purposeOrder.indexOf(a);
      const bi = purposeOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b,"ru");
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  } else {
    names.sort((a,b)=>a.localeCompare(b,"ru"));
  }

  if(!names.length) {content.innerHTML='<div class="empty">Ничего не найдено.</div>'; return;}
  content.innerHTML = names.map(g => `<section class="group"><h2 class="group-title">${esc(g)}</h2><div class="cards">${groups[g].map(card).join("")}</div></section>`).join("");
}
purposeBtn.onclick=()=>{mode="purpose";purposeBtn.classList.add("active");mechanismBtn.classList.remove("active");render();};
mechanismBtn.onclick=()=>{mode="mechanism";mechanismBtn.classList.add("active");purposeBtn.classList.remove("active");render();};
search.oninput=render; locationFilter.onchange=render; statusFilter.onchange=render;
initFilters(); summary(); render();
