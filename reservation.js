// ====== Google Form ======
const FORM_BASE =

"https://docs.google.com/forms/d/e/1FAIpQLSdvaqRy2nDmMKOrVVC4Vn0al-Hg6zuMT703LRofp9lGYy9cSw/viewform?usp=header";
const FIELDS = {
  dom: "entry.1948465557",
  date: "entry.1537833412",
  slot: "entry.1709299398",
  duration: "entry.246626838",
  name: "entry.1416411362",
  email: "entry.443720472",
  message: "entry.995574164"
};

// ====== DOM ======
const domSelect = document.getElementById("dominatrice");
const dateInput = document.getElementById("date");
const slotSelect = document.getElementById("slot");
const slotPills = document.getElementById("slotPills");
const slotHint = document.getElementById("slotHint");

const durationSelect = document.getElementById("duration");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");

const calendarEl = document.getElementById("calendar");
const calendarHint = document.getElementById("calendarHint");

// Expose pour le bouton
window.sendForm = sendForm;

// ====== Utils ======
function pad(n){ return String(n).padStart(2, "0"); }
function toISODate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function midLocalDateFromISO(iso){ return new Date(iso + "T12:00:00"); } // évite bugs timezone

function getISOWeek(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const DOW = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// ====== Règles disponibilités (best-effort) ======
function computeAvailableSlots(dominatrice, date){
  if (!dominatrice || !date) return [];

  const day = date.getDay(); // 0 dim ... 6 sam
  const isWeekend = (day === 0 || day === 6);
  const isWeekday = !isWeekend;

  if (dominatrice === "Lady Zaphir") {
    // lundi(1) à jeudi(4) soir uniquement
    if (day >= 1 && day <= 4) return ["Soir"];
    return [];
  }

  if (dominatrice === "Dame Émanuelle") {
    const week = getISOWeek(date);
    const eveningWeek = (week % 2 === 0); // semaines paires -> soir dispo

    if (isWeekday) {
      const slots = ["AM", "PM"];
      if (eveningWeek) slots.push("Soir");
      return slots;
    }

    // week-end : "une partie" => PM + parfois soir
    const slots = ["PM"];
    if (eveningWeek) slots.push("Soir");
    return slots;
  }

  return [];
}

// ====== Slots UI ======
function setSlotOptions(slots){
  slotSelect.innerHTML = "";

  if (!slots.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Aucun créneau disponible";
    slotSelect.appendChild(opt);
    slotSelect.value = "";
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choisir un créneau";
  slotSelect.appendChild(placeholder);

  for (const s of slots) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    slotSelect.appendChild(opt);
  }
}

function renderPills(slots){
  slotPills.innerHTML = "";
  if (!slots.length) return;

  const current = slotSelect.value;

  for (const s of slots) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (current === s ? " active" : "");
    btn.textContent = s;

    btn.addEventListener("click", () => {
      slotSelect.value = s;
      renderPills(slots);
    });

    slotPills.appendChild(btn);
  }
}

function updateSlotHint(dom, date, slots){
  if (!dom) {
    slotHint.textContent = "Choisissez d’abord une dominatrice.";
    return;
  }
  if (!date) {
    slotHint.textContent = "Choisissez une date (calendrier) pour afficher les créneaux.";
    return;
  }
  if (!slots.length) {
    slotHint.textContent = "Aucun créneau disponible pour cette date.";
    return;
  }

  if (dom === "Lady Zaphir") {
    slotHint.textContent = "Lady Zaphir : lundi à jeudi — soir uniquement.";
    return;
  }

  const week = getISOWeek(date);
  const eveningWeek = (week % 2 === 0);
  slotHint.textContent = eveningWeek
    ? "Dame Émanuelle : AM/PM en semaine + soir (semaine alternée). Week-end : PM + parfois soir."
    : "Dame Émanuelle : AM/PM en semaine. Week-end : PM (soir non disponible cette semaine).";
}

function refreshAvailability(){
  const dom = domSelect.value;
  const iso = dateInput.value;

  if (!dom || !iso) {
    setSlotOptions([]);
    slotPills.innerHTML = "";
    updateSlotHint(dom, iso ? midLocalDateFromISO(iso) : null, []);
    return;
  }

  const d = midLocalDateFromISO(iso);
  const slots = computeAvailableSlots(dom, d);

  setSlotOptions(slots);
  renderPills(slots);
  updateSlotHint(dom, d, slots);
}

// ====== Calendrier visuel (14 jours) ======
let selectedISO = "";

function renderCalendar(){
  calendarEl.innerHTML = "";

  const dom = domSelect.value;
  const today = new Date();
  today.setHours(12,0,0,0);

  const daysToShow = 14;

  for (let i = 0; i < daysToShow; i++){
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = toISODate(d);
    const slots = computeAvailableSlots(dom, d);
    const hasSlots = slots.length > 0;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day" + (hasSlots ? "" : " disabled") + (iso === selectedISO ? " selected" : "");

    btn.setAttribute("data-iso", iso);

    btn.innerHTML = `
      <div class="day-top">
        <div class="day-num">${d.getDate()}</div>
        <div class="day-dow">${DOW[d.getDay()]}</div>
      </div>
      <div class="day-badges">
        ${hasSlots ? slots.map(s => `<span class="badge">${s}</span>`).join("") : `<span class="badge">Indispo</span>`}
      </div>
    `;

    if (hasSlots) {
      btn.addEventListener("click", () => {
        selectedISO = iso;
        dateInput.value = iso;
        renderCalendar();      // refresh selection
        refreshAvailability(); // refresh slots
      });
    }

    calendarEl.appendChild(btn);
  }

  // Hint calendrier
  if (!dom) {
    calendarHint.textContent = "Choisissez une dominatrice pour afficher les jours disponibles.";
  } else {
    calendarHint.textContent = "Cliquez un jour disponible pour le sélectionner (les jours grisés sont indisponibles).";
  }
}

// ====== Submit Google Form ======
function sendForm(){
  if (!domSelect.value) return alert("Veuillez choisir une dominatrice.");
  if (!dateInput.value) return alert("Veuillez choisir une date.");
  if (!slotSelect.value) return alert("Veuillez choisir un créneau.");
  if (!nameInput.value.trim()) return alert("Veuillez entrer votre nom.");
  if (!emailInput.value.trim()) return alert("Veuillez entrer votre email.");

  const params = new URLSearchParams();
  params.set(FIELDS.dom, domSelect.value);
  params.set(FIELDS.date, dateInput.value);
  params.set(FIELDS.slot, slotSelect.value);
  params.set(FIELDS.duration, durationSelect.value);
  params.set(FIELDS.name, nameInput.value.trim());
  params.set(FIELDS.email, emailInput.value.trim());
  params.set(FIELDS.message, messageInput.value.trim());

  const url = `${FORM_BASE}&${params.toString()}`;
  window.open(url, "_blank");
}

// ====== Init ======
(function init(){
  // date min = aujourd’hui
  const now = new Date();
  now.setHours(12,0,0,0);
  dateInput.min = toISODate(now);

  domSelect.addEventListener("change", () => {
    // reset selection date quand on change de dom
    selectedISO = dateInput.value || "";
    renderCalendar();
    refreshAvailability();
  });

  dateInput.addEventListener("change", () => {
    selectedISO = dateInput.value || "";
    renderCalendar();
    refreshAvailability();
  });

  slotSelect.addEventListener("change", () => {
    const dom = domSelect.value;
    const iso = dateInput.value;
    if (!dom || !iso) return;
    const slots = computeAvailableSlots(dom, midLocalDateFromISO(iso));
    renderPills(slots);
  });

  selectedISO = dateInput.value || "";
  renderCalendar();
  refreshAvailability();
})();
