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

// Projects modal logic

(function () {
  const modalMap = {
    trading: document.getElementById('modal-trading'),
    engie: document.getElementById('modal-engie'),
  };

  const openModal = (modal) => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  const closeAllModals = () => {
    Object.values(modalMap).forEach((modal) => {
      if (modal) closeModal(modal);
    });
  };

  // Attach click handlers to project cards
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => {
      const projectKey = card.getAttribute('data-project');
      const modal = modalMap[projectKey];
      if (modal) openModal(modal);
    });
  });

  // Close modal when clicking backdrop or close button
  Object.values(modalMap).forEach((modal) => {
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop');
    const closeBtn = modal.querySelector('.modal-close');

    backdrop?.addEventListener('click', () => closeModal(modal));
    closeBtn?.addEventListener('click', () => closeModal(modal));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
})();