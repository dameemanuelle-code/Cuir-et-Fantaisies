// =========================
// MENU MOBILE
// =========================
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");

function openNav() {
  mainNav.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
}

function closeNav() {
  mainNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}

function toggleNav() {
  const isOpen = mainNav.classList.contains("open");
  isOpen ? closeNav() : openNav();
}

if (navToggle && mainNav) {
  // état ARIA initial
  navToggle.setAttribute("aria-expanded", "false");

  navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    toggleNav();
  });

  // Fermer quand on clique sur un lien
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  // Fermer si clic en dehors du menu / bouton
  document.addEventListener("click", (e) => {
    const clickedInsideNav = mainNav.contains(e.target);
    const clickedToggle = navToggle.contains(e.target);
    if (!clickedInsideNav && !clickedToggle) closeNav();
  });

  // Fermer quand on repasse en desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeNav();
  });
}

// =========================
// FADE-IN DES SECTIONS
// =========================
const sections = document.querySelectorAll(".section");

if (sections.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        entry.target.classList.remove("pre-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => {
    section.classList.add("pre-visible");
    observer.observe(section);
  });
}
