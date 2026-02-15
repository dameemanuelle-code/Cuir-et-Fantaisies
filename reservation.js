/* ========= CONFIG GOOGLE FORM =========
1) Mets l'URL "formResponse" ici (voir instructions plus bas)
2) Mets les entry IDs (entry.xxxxx) correspondant à chaque champ
====================================== */

const GOOGLE_FORM = {
  formResponseUrl: "PASTE_YOUR_FORM_RESPONSE_URL_HERE",
  // Exemple: https://docs.google.com/forms/d/e/XXXXX/formResponse

  fields: {
    dom: "entry.1111111111",
    date: "entry.2222222222",
    slot: "entry.3333333333",
    duration: "entry.4444444444",
    name: "entry.5555555555",
    email: "entry.6666666666",
    message: "entry.7777777777"
  }
};

// Créneaux (tu peux ajuster les heures ici)
const SLOTS = {
  AM: ["09:30 – 11:30", "11:45 – 13:15"],
  PM: ["13:30 – 15:30", "15:45 – 17:45"],
  EVE: ["18:30 – 20:30", "20:45 – 22:45"]
};

const $ = (id) => document.getElementById(id);
const domEl = $("dom");
const dateEl = $("date");
const slotEl = $("slot");
const eveningToggleLine = $("eveningToggleLine");
const eveningWeekEl = $("eveningWeek");
const dateHint = $("dateHint");
const slotHint = $("slotHint");

function dayOfWeek(dateStr){
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay(); // 0=dim,1=lun,...6=sam
}

function isWeekend(dow){ return dow === 0 || dow === 6; } // dim/sam
function isMonToThu(dow){ return dow >= 1 && dow <= 4; } // lun-jeu
function isWeekday(dow){ return dow >= 1 && dow <= 5; } // lun-ven

function setOptions(select, options, placeholder="Sélectionner"){
  select.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  select.appendChild(ph);

  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  });
}

function computeAvailability(){
  const dom = domEl.value;
  const date = dateEl.value;

  slotHint.textContent = "";
  dateHint.textContent = "";

  if(!dom || !date){
    setOptions(slotEl, [], "Choisir une date d’abord");
    return;
  }

  const dow = dayOfWeek(date);

  // Toggle "semaine avec soirs" uniquement pour Dame Émanuelle
  if(dom === "Dame Émanuelle"){
    eveningToggleLine.style.display = "flex";
  } else {
    eveningToggleLine.style.display = "none";
    eveningWeekEl.checked = false;
  }

  let slots = [];

  if(dom === "Lady Zaphir"){
    // Lady Zaphir: lundi -> jeudi soir
    if(isMonToThu(dow)){
      slots = [...SLOTS.EVE];
      dateHint.textContent = "Lady Zaphir : soirées du lundi au jeudi.";
    } else {
      dateHint.textContent = "Lady Zaphir : disponible uniquement du lundi au jeudi soir.";
    }
  }

  if(dom === "Dame Émanuelle"){
    // Dame Émanuelle : semaine AM & PM
    // soirs occasionnels 1 semaine sur deux (toggle)
    // week-ends : PM + soir (si toggle on pour le soir)
    if(isWeekday(dow)){
      slots = [...SLOTS.AM, ...SLOTS.PM];
      if(eveningWeekEl.checked){
        slots = [...slots, ...SLOTS.EVE];
        dateHint.textContent = "Dame Émanuelle : AM/PM en semaine + soirs cette semaine.";
      } else {
        dateHint.textContent = "Dame Émanuelle : AM/PM en semaine (soirs selon semaine).";
      }
    } else if(isWeekend(dow)){
      slots = [...SLOTS.PM];
      if(eveningWeekEl.checked){
        slots = [...slots, ...SLOTS.EVE];
        dateHint.textContent = "Dame Émanuelle : week-end PM + soirs (selon semaine).";
      } else {
        dateHint.textContent = "Dame Émanuelle : week-end PM (soirs selon semaine).";
      }
    }
  }

  if(slots.length === 0){
    setOptions(slotEl, [], "Aucun créneau disponible");
    slotHint.textContent = "Choisissez une autre date, ou une autre dominatrice.";
  } else {
    setOptions(slotEl, slots, "Sélectionner un créneau");
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

// Submit -> ouvre Google Form prérempli
$("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();

  // Vérif config
  if(GOOGLE_FORM.formResponseUrl.includes("PASTE_YOUR")){
    alert("Ajoute d’abord ton lien Google Form (formResponse) dans reservation.js");
    return;
  }

  const payload = {
    dom: domEl.value,
    date: dateEl.value,
    slot: slotEl.value,
    duration: $("duration").value,
    name: $("name").value,
    email: $("email").value,
    message: $("msg").value || ""
  };

  // Vérif
  if(!payload.dom || !payload.date || !payload.slot || !payload.name || !payload.email){
    alert("Merci de compléter tous les champs requis.");
    return;
  }

  const params = new URLSearchParams();
  params.set(GOOGLE_FORM.fields.dom, payload.dom);
  params.set(GOOGLE_FORM.fields.date, payload.date);
  params.set(GOOGLE_FORM.fields.slot, payload.slot);
  params.set(GOOGLE_FORM.fields.duration, payload.duration);
  params.set(GOOGLE_FORM.fields.name, payload.name);
  params.set(GOOGLE_FORM.fields.email, payload.email);
  params.set(GOOGLE_FORM.fields.message, payload.message);

  // Astuce: on ouvre la version "viewform" pré-remplie (meilleure UX)
  // On convertit formResponse -> viewform
  const viewUrl = GOOGLE_FORM.formResponseUrl.replace("/formResponse", "/viewform");
  const finalUrl = `${viewUrl}?${params.toString()}`;

  window.open(finalUrl, "_blank", "noopener,noreferrer");
});
