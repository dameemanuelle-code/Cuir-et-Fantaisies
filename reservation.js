/* Page de réservation premium -> ouvre ton Google Form pré-rempli */

const FORM_VIEW_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdvaqRy2nDmMKOrVVC4Vn0al-Hg6zuMT703LRofp9lGYy9cSw/viewform";

// Mapping exact depuis ton lien pré-rempli
const ENTRY = {
  dom: "entry.1948465557",      // Dominatrice
  date: "entry.1537833412",     // Date
  slot: "entry.1709299398",     // Créneau (Am/Pm/Soirée)
  duration: "entry.246626838",  // Durée
  name: "entry.1416411362",     // Nom
  contact: "entry.443720472",   // Coordonnées
  details: "entry.995574164"    // Détails
};

const $ = (id) => document.getElementById(id);

const domEl = $("dom");
const dateEl = $("date");
const slotEl = $("slot");
const durationEl = $("duration");
const nameEl = $("name");
const contactEl = $("contact");
const detailsEl = $("details");

const eveningToggleLine = $("eveningToggleLine");
const eveningWeekEl = $("eveningWeek");

const domHint = $("domHint");
const dateHint = $("dateHint");
const slotHint = $("slotHint");

// Règles dispo (selon ce que tu m’as dit)
function dayOfWeek(dateStr){
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay(); // 0=dim,1=lun,...6=sam
}
const isWeekend = (dow) => dow === 0 || dow === 6;     // dim/sam
const isMonToThu = (dow) => dow >= 1 && dow <= 4;      // lun-jeu
const isWeekday  = (dow) => dow >= 1 && dow <= 5;      // lun-ven

function setOptions(select, options, placeholder="Sélectionner"){
  select.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  select.appendChild(ph);
  options.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

function computeAvailability(){
  const dom = domEl.value;
  const date = dateEl.value;

  domHint.textContent = "";
  dateHint.textContent = "";
  slotHint.textContent = "";

  if(!dom){
    setOptions(slotEl, [], "Choisir une dominatrice d’abord");
    eveningToggleLine.style.display = "none";
    eveningWeekEl.checked = false;
    return;
  }

  if(dom === "Dame Émanuelle"){
    eveningToggleLine.style.display = "flex"; // soirs 1 semaine sur 2
    domHint.textContent = "Dame Émanuelle : semaine AM/PM, week-ends PM et parfois soirée.";
  } else if(dom === "Lady Zaphir"){
    eveningToggleLine.style.display = "none";
    eveningWeekEl.checked = false;
    domHint.textContent = "Lady Zaphir : du lundi au jeudi soir.";
  } else {
    // Les deux
    eveningToggleLine.style.display = "flex";
    domHint.textContent = "Les deux : options combinées selon la date.";
  }

  if(!date){
    setOptions(slotEl, [], "Choisir une date d’abord");
    return;
  }

  const dow = dayOfWeek(date);
  let allowed = [];

  if(dom === "Lady Zaphir"){
    if(isMonToThu(dow)){
      allowed = ["Soirée"];
      dateHint.textContent = "Lady Zaphir est disponible ce jour-là (soir).";
    } else {
      allowed = [];
      dateHint.textContent = "Lady Zaphir : uniquement lun-jeu en soirée.";
    }
  }

  if(dom === "Dame Émanuelle"){
    if(isWeekday(dow)){
      allowed = ["Am", "Pm"];
      if(eveningWeekEl.checked) allowed.push("Soirée");
      dateHint.textContent = eveningWeekEl.checked
        ? "Dame Émanuelle : AM/PM + soirée cette semaine."
        : "Dame Émanuelle : AM/PM en semaine (soirée selon semaine).";
    } else if(isWeekend(dow)){
      allowed = ["Pm"];
      if(eveningWeekEl.checked) allowed.push("Soirée");
      dateHint.textContent = eveningWeekEl.checked
        ? "Dame Émanuelle : week-end PM + soirée (selon semaine)."
        : "Dame Émanuelle : week-end PM (soirée selon semaine).";
    }
  }

  if(dom === "Les deux"){
    // Combinaison :
    // - Lady Zaphir: lun-jeu soir
    // - Dame Émanuelle: semaine AM/PM (+soir toggle), week-end PM (+soir toggle)
    const forZaphir = isMonToThu(dow) ? ["Soirée"] : [];
    const forEma = isWeekday(dow) ? ["Am","Pm"] : (isWeekend(dow) ? ["Pm"] : []);
    if(eveningWeekEl.checked) forEma.push("Soirée");

    // Union
    allowed = Array.from(new Set([...forZaphir, ...forEma]));
    dateHint.textContent = "Disponibilités combinées pour cette date.";
  }

  if(allowed.length === 0){
    setOptions(slotEl, [], "Aucun créneau disponible");
    slotHint.textContent = "Choisis une autre date ou une autre dominatrice.";
  } else {
    setOptions(slotEl, allowed, "Sélectionner");
  }
}

domEl.addEventListener("change", computeAvailability);
dateEl.addEventListener("change", computeAvailability);
eveningWeekEl.addEventListener("change", computeAvailability);

// Empêcher dates passées
(function initDateMin(){
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth()+1).padStart(2,"0");
  const dd = String(now.getDate()).padStart(2,"0");
  dateEl.min = `${yyyy}-${mm}-${dd}`;
})();

$("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const dom = domEl.value;
  const date = dateEl.value;
  const slot = slotEl.value;
  const duration = durationEl.value;
  const name = nameEl.value.trim();
  const contact = contactEl.value.trim();
  const details = detailsEl.value.trim();

  if(!dom || !date || !slot || !duration || !name || !contact){
    alert("Merci de compléter tous les champs requis.");
    return;
  }

  const params = new URLSearchParams();
  params.set(ENTRY.dom, dom);
  params.set(ENTRY.date, date);
  params.set(ENTRY.slot, slot);
  params.set(ENTRY.duration, duration);
  params.set(ENTRY.name, name);
  params.set(ENTRY.contact, contact);
  params.set(ENTRY.details, details);

  const finalUrl = `${FORM_VIEW_URL}?usp=pp_url&${params.toString()}`;
  window.open(finalUrl, "_blank", "noopener,noreferrer");
});

// Init
computeAvailability();
