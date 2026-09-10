// js/main.js
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


/* --------------------------------------------------
Hero background: Brownian paths + trading candles
-------------------------------------------------- */

(() => {
  const canvas = document.getElementById("hero-market-canvas");

  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const hero = canvas.closest(".hero-section");
  const context = canvas.getContext("2d");

  const colors = {
    burgundy: "#4a0718",
    burgundySoft: "rgba(74, 7, 24, 0.30)",
    burgundyFaint: "rgba(74, 7, 24, 0.12)",
    cream: "#f4f0e8",
    creamSoft: "rgba(244, 240, 232, 0.88)",
    white: "#ffffff",
    blue : "#07416a"
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let candles = [];
  let brownianPaths = [];
  let animationFrameId = null;
  let lastTime = 0;
  let marketOffset = 0;
  let nextCandleTimer = 0;
  const BROWNIAN_DRAW_DURATION = 8000; // 8 secondes
  const BROWNIAN_STAGGER = 180; // léger décalage entre les lignes
  let brownianStartTime = null;

  const random = (min, max) => Math.random() * (max - min) + min;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const randomNormal = () => {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const resizeCanvas = () => {
    const rect = hero.getBoundingClientRect();

    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    createMarketSeries();
    createBrownianPaths();
  };

  const createCandle = (previousClose = height * 0.57) => {
    const bodySize = random(9, 33);
    const direction = Math.random() > 0.48 ? 1 : -1;

    const open = clamp(previousClose, height * 0.24, height * 0.82);
    const close = clamp(
      open + direction * bodySize,
      height * 0.18,
      height * 0.88
    );

    const high = clamp(
      Math.max(open, close) + random(6, 25),
      height * 0.1,
      height * 0.92
    );

    const low = clamp(
      Math.min(open, close) - random(6, 25),
      height * 0.1,
      height * 0.92
    );

    return { open, close, high, low };
  };

  const createMarketSeries = () => {
    const candleGap = Math.max(15, Math.min(23, width / 55));
    const count = Math.ceil(width / candleGap) + 15;

    candles = [];
    let lastClose = height * random(0.42, 0.66);

    for (let index = 0; index < count; index += 1) {
      const candle = createCandle(lastClose);
      candles.push(candle);
      lastClose = candle.close;
    }
  };

  const createBrownianPaths = () => {
  const pathCount = width < 760 ? 5 : 10;
  const pointCount = Math.max(80, Math.floor(width / 10));

  // Toutes les trajectoires commencent près de ce niveau.
  const commonStartY = height * random(0.46, 0.54);

  brownianPaths = Array.from({ length: pathCount }, (_, pathIndex) => {
    const points = [];

    // Départ volontairement très resserré : ±1,8 % de la hauteur du canvas.
    let y = commonStartY + random(-height * 0.018, height * 0.018);

    // Chaque trajectoire reçoit un biais propre.
    // Il crée une divergence progressive entre les scénarios.
    const driftBias = random(-0.72, 0.72);

    for (let index = 0; index <= pointCount; index += 1) {
      const progress = index / pointCount;

      /*
       * La volatilité augmente avec l'avancement :
       * les lignes restent rassemblées à gauche,
       * puis se dispersent de plus en plus à droite.
       */
      const volatility =
        height * (0.009);

      /*
       * Le drift spécifique à chaque ligne augmente progressivement.
       * Il donne des trajectoires plus divergentes, sans rendre le
       * mouvement parfaitement directionnel.
       */
      const drift =
        driftBias *
        height *
        (0.0015 + progress * 0.0045);

      /*
       * Petit mouvement sinusoïdal propre à chaque trajectoire :
       * utile pour éviter une texture trop uniforme.
       */
      const wave =
        Math.sin(index * random(0.025, 0.06) + pathIndex) *
        height *
        0.0018;

      y += randomNormal() * volatility + drift + wave;

      y = clamp(y, height * 0.07, height * 0.93);

      points.push({
        x: (index / pointCount) * (width + 100) - 50,
        y
      });
    }

    return {
      points,
      opacity: random(0.14, 0.30),
      lineWidth: random(2, 3.4),
      speed: random(0.45, 1.05),
      phase: random(0, Math.PI * 2)
    };
  });
};

  const drawGrid = () => {
    context.save();
    context.strokeStyle = colors.burgundyFaint;
    context.lineWidth = 0.5;

    const spacing = width < 760 ? 52 : 74;

    for (let x = 0; x <= width; x += spacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += spacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.restore();
  };

  const drawCandles = () => {
    const candleGap = Math.max(15, Math.min(23, width / 55));
    const bodyWidth = candleGap * 0.5;
    const startX = -candleGap * 5 - (marketOffset % candleGap);

    context.save();
    context.globalAlpha = 0.50;

    candles.forEach((candle, index) => {
      const x = startX + index * candleGap;
      const isBullish = candle.close >= candle.open;
      const candleColor = isBullish ? colors.burgundy : colors.blue;

      context.strokeStyle = candleColor;
      context.fillStyle = candleColor;
      context.lineWidth = 1.1;

      const bodyTop = Math.min(candle.open, candle.close);
      const bodyHeight = Math.max(2, Math.abs(candle.close - candle.open));

      context.beginPath();
      context.moveTo(x, candle.high);
      context.lineTo(x, candle.low);
      context.stroke();

      if (isBullish) {
        context.fillRect(
          x - bodyWidth / 2,
          bodyTop,
          bodyWidth,
          bodyHeight
        );
      } else {
        context.strokeRect(
          x - bodyWidth / 2,
          bodyTop,
          bodyWidth,
          bodyHeight
        );
      }
    });

    context.restore();
  };

  const drawBrownianPaths = (time) => {
  if (brownianStartTime === null) {
    brownianStartTime = time;
  }

  brownianPaths.forEach((path, pathIndex) => {
    const elapsed = Math.max(
      0,
      time - brownianStartTime - pathIndex * BROWNIAN_STAGGER
    );

    // Progression de 0 à 1 sur 6 secondes
    const rawProgress = Math.min(elapsed / BROWNIAN_DRAW_DURATION, 1);

    // Ease-out : démarre plus vite et ralentit légèrement à la fin
    const progress = 1 - Math.pow(1 - rawProgress, 3);

    // Nombre de points actuellement révélés
    const visiblePointCount = Math.max(
      2,
      Math.floor(progress * (path.points.length - 1)) + 1
    );

    context.save();

    context.globalAlpha = path.opacity;
    context.strokeStyle = colors.burgundy;
    context.lineWidth = path.lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";

    const horizontalShift =
      Math.sin(time * 0.00012 * path.speed + path.phase) * 28;

    context.beginPath();

    for (let index = 0; index < visiblePointCount; index += 1) {
      const point = path.points[index];

      const verticalOscillation =
        Math.sin(
          index * 0.12 +
          time * 0.00028 * path.speed +
          path.phase
        ) * 7;

      const x = point.x + horizontalShift;
      const y = point.y + verticalOscillation;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
    context.restore();
  });
};

  const drawSubtleGradient = () => {
    const gradient = context.createRadialGradient(
      width * 0.72,
      height * 0.35,
      30,
      width * 0.72,
      height * 0.35,
      Math.max(width, height) * 0.62
    );

    gradient.addColorStop(0, "rgba(244, 240, 232, 0)");
    gradient.addColorStop(1, "rgba(244, 240, 232, 0.54)");

    context.save();
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.restore();
  };

  const render = (time) => {
    const deltaTime = Math.min(time - lastTime, 60);
    lastTime = time;

    context.clearRect(0, 0, width, height);

    marketOffset += deltaTime * 0.010;

    if (time > nextCandleTimer) {
      const lastCandle = candles[candles.length - 1];
      candles.push(createCandle(lastCandle.close));
      candles.shift();

      nextCandleTimer = time + random(1000, 2400);
    }

    drawGrid();
    drawCandles();
    drawBrownianPaths(time);
    drawSubtleGradient();

    animationFrameId = window.requestAnimationFrame(render);
  };

  const resizeObserver = new ResizeObserver(() => {
    window.cancelAnimationFrame(animationFrameId);
    resizeCanvas();
    lastTime = performance.now();
    animationFrameId = window.requestAnimationFrame(render);
  });

  resizeCanvas();
  resizeObserver.observe(hero);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrameId);
      return;
    }

    lastTime = performance.now();
    animationFrameId = window.requestAnimationFrame(render);
  });

  lastTime = performance.now();
  animationFrameId = window.requestAnimationFrame(render);
})();

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

const montrealMapElement = document.querySelector("#montreal-map");

if (montrealMapElement && typeof L !== "undefined") {
  const montrealCoordinates = [45.5017, -73.5673];

  const montrealMap = L.map(montrealMapElement, {
    scrollWheelZoom: false,
    zoomControl: true,
    preferCanvas: false
  }).setView(montrealCoordinates, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(montrealMap);

  const burgundyMarker = L.divIcon({
    className: "burgundy-map-marker",
    html: '<span class="marker-inner"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });

  L.marker(montrealCoordinates, {
    icon: burgundyMarker,
    title: "Montréal, Québec"
  })
    .addTo(montrealMap)
    .bindPopup("<strong>Montréal, Québec</strong><br>Available remotely");

  const refreshMapSize = () => {
    requestAnimationFrame(() => {
      montrealMap.invalidateSize({
        pan: false,
        animate: false
      });
    });
  };

  montrealMap.whenReady(() => {
    refreshMapSize();

    window.setTimeout(refreshMapSize, 100);
    window.setTimeout(refreshMapSize, 500);
    window.setTimeout(refreshMapSize, 1000);
  });

  window.addEventListener("resize", refreshMapSize);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      refreshMapSize();
    });

    resizeObserver.observe(montrealMapElement);
  }
}



