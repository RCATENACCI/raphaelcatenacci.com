// js/main.js

// Exemple : ajouter une classe "scrolled" au header quand on scroll
const header = document.querySelector('.site-header');

if (header) {
  const onScroll = () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll);
  onScroll();
}

// Tu pourras ajouter ici d’autres interactions si besoin
// (menu mobile, animations légères, etc.)