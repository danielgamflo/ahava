/* =========================================================================
   AHAVA — Comportamiento
   Portada · Catálogo plegable · Ficha de producto · Formulario · Motion
   ========================================================================= */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const WHATSAPP_NUMBER = '56968284286';
const CONTACT_EMAIL = 'info@ahava.cl';

let allProducts = [];

/* --- Portada ------------------------------------------------------------ */

function initHeroCarousel() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('.dot')];
  if (slides.length < 2) return;

  let index = 0;
  let timer = null;

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });
  }

  function start() {
    if (timer || prefersReducedMotion.matches) return;
    timer = setInterval(() => show(index + 1), 5500);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { show(i); stop(); start(); });
  });

  // Se detiene mientras el visitante interactúa o la pestaña está oculta.
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  prefersReducedMotion.addEventListener('change', () => (prefersReducedMotion.matches ? stop() : start()));

  show(0);
  start();
}

/* --- Navegación --------------------------------------------------------- */

function initNav() {
  const navbar = document.getElementById('navbar');
  const button = document.getElementById('hamburgerBtn');
  const list = document.getElementById('navLinks');
  if (!navbar || !button || !list) return;

  function closeMenu() {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú');
    list.classList.remove('active');
  }

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    list.classList.toggle('active', !open);
  });

  list.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      button.focus();
    }
  });

  // Estado condensado al separarse del borde superior.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  document.body.prepend(sentinel);
  new IntersectionObserver(
    ([entry]) => navbar.classList.toggle('is-scrolled', !entry.isIntersecting)
  ).observe(sentinel);

  // Sección activa en el menú.
  const sections = [...document.querySelectorAll('main section[id]')];
  const linkFor = new Map(
    [...list.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a])
  );

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = linkFor.get(entry.target.id);
        if (!link) return;
        linkFor.forEach((other) => other.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

/* --- Catálogo ----------------------------------------------------------- */

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function groupByCategory(products) {
  return products.reduce((groups, product) => {
    (groups[product.category] ||= []).push(product);
    return groups;
  }, {});
}

async function loadProducts() {
  const accordion = document.getElementById('productsAccordion');
  if (!accordion) return;

  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allProducts = data.products || [];
    renderProductsByCategory(allProducts);
  } catch (error) {
    accordion.innerHTML =
      '<p class="accordion-loading">No pudimos cargar el catálogo. ' +
      `Escríbenos por WhatsApp y te contamos qué tenemos disponible.</p>`;
  }
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/* Imagen real o marca de espera. No se usa un SVG gris genérico: una
   pieza en los colores de la casa dice "foto pendiente" sin parecer rota. */
function buildMedia(product) {
  const hasPhoto = product.image && !product.image.includes('placeholder');

  if (hasPhoto) {
    const img = document.createElement('img');
    img.src = `assets/images/${product.image}`;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
  }

  const mark = document.createElement('span');
  mark.className = 'media-pending';
  mark.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#i-grain"/></svg>';
  return mark;
}

function buildCard(product, index, { featured = false, showPrice = false } = {}) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = featured ? 'feature' : 'product-card';
  card.style.setProperty('--i', String(index));
  card.setAttribute('aria-label', `Ver ficha de ${product.name}`);

  const media = document.createElement('span');
  media.className = featured ? 'feature-media' : 'card-media';
  media.appendChild(buildMedia(product));

  const text = document.createElement('span');
  text.className = featured ? 'feature-text' : 'card-text';

  const name = document.createElement('span');
  name.className = featured ? 'feature-name' : 'card-name';
  name.textContent = product.name;
  text.appendChild(name);

  if (featured) {
    const blurb = document.createElement('span');
    blurb.className = 'feature-blurb';
    blurb.textContent = product.detailedDescription || product.description || '';
    text.appendChild(blurb);
  }

  const meta = document.createElement('span');
  meta.className = featured ? 'feature-meta' : 'card-meta';
  meta.textContent = [product.weight, showPrice && product.price && clp.format(product.price)]
    .filter(Boolean)
    .join(' · ');
  text.appendChild(meta);

  if (featured) {
    const cue = document.createElement('span');
    cue.className = 'feature-cue';
    cue.innerHTML =
      'Ver ficha <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg>';
    text.appendChild(cue);
  }

  card.append(media, text);
  card.addEventListener('click', () => openLightbox(product.id));
  return card;
}

function renderProductsByCategory(products) {
  const accordion = document.getElementById('productsAccordion');
  const grouped = groupByCategory(products);
  accordion.innerHTML = '';

  Object.entries(grouped).forEach(([category, items], index) => {
    const slug = slugify(category);
    const panelId = `panel-${slug}`;
    const buttonId = `trigger-${slug}`;
    const plural = items.length > 1 ? 'variedades' : 'variedad';

    const wrapper = document.createElement('div');
    wrapper.className = `product-category-wrapper ${slug}`;

    const section = document.createElement('div');
    section.className = 'product-category-section';
    section.dataset.reveal = '';
    section.style.setProperty('--reveal-delay', `${index * 70}ms`);

    // Cabecera: <h3> envuelve al <button> (patrón WAI-ARIA de acordeón).
    const heading = document.createElement('h3');
    heading.className = 'category-heading';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'category-header';
    trigger.id = buttonId;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panelId);
    trigger.innerHTML =
      `<span class="category-header-text">` +
        `<span class="category-title">${category}</span>` +
        `<span class="category-count">${items.length} ${plural}</span>` +
      `</span>` +
      `<span class="toggle-icon"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-chevron"/></svg></span>`;

    heading.appendChild(trigger);

    const content = document.createElement('div');
    content.className = 'category-content';
    content.id = panelId;
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', buttonId);

    const body = document.createElement('div');
    body.className = 'category-body';

    // La bandeja: superficie clara que levanta la fotografía sobre el
    // color de la banda. Sin ella el pan se apaga contra el olivo.
    const tray = document.createElement('div');
    tray.className = 'category-tray';

    // Precio: si toda la categoría comparte valor se dice una vez al pie;
    // repetirlo en cada ficha sería ruido. En cuanto los precios se
    // separen, cada ficha muestra el suyo. El código decide solo.
    const prices = [...new Set(items.map((p) => p.price).filter(Boolean))];
    const sharedPrice = prices.length === 1 ? prices[0] : null;
    const showPrice = !sharedPrice;

    // El destacado es el primero de la categoría en data.json.
    // Reordenar ahí cambia la portada, sin tocar código.
    const [lead, ...rest] = items;
    tray.appendChild(buildCard(lead, 0, { featured: true, showPrice }));

    if (rest.length) {
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      rest.forEach((product, i) => grid.appendChild(buildCard(product, i + 1, { showPrice })));
      tray.appendChild(grid);
    }

    if (sharedPrice) {
      const note = document.createElement('p');
      note.className = 'tray-note';
      note.textContent = `Cada uno a ${clp.format(sharedPrice)}`;
      tray.appendChild(note);
    }

    body.appendChild(tray);
    content.appendChild(body);
    section.append(heading, content);

    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      section.classList.toggle('expanded', !expanded);
    });

    wrapper.appendChild(section);
    accordion.appendChild(wrapper);
  });

  initReveals();
}

/* --- Ficha de producto -------------------------------------------------- */

let lastFocusedElement = null;

function buildSpecs(product) {
  // Solo se generan las casillas con dato real: antes se renderizaban
  // cajas vacías y un "×" suelto para los productos sin ficha completa.
  const size = [product.size?.length, product.size?.height].filter(Boolean).join(' × ');
  const storage = [
    product.fresh && `Fresco ${product.fresh.toLowerCase()}`,
    product.frozen && `Congelado ${product.frozen.toLowerCase()}`
  ].filter(Boolean).join(' · ');

  return [
    { label: 'Calorías', value: product.calories && `${product.calories} kcal` },
    { label: 'Peso', value: product.weight },
    { label: 'Tamaño', value: size },
    { label: 'Semillas', value: product.seeds?.join(', ') },
    { label: 'Harina', value: product.flour },
    { label: 'Conservación', value: storage }
  ].filter((spec) => spec.value);
}

function openLightbox(productId) {
  const product = allProducts.find((item) => item.id === productId);
  const lightbox = document.getElementById('lightbox');
  if (!product || !lightbox) return;

  lastFocusedElement = document.activeElement;

  const images = product.images?.length
    ? product.images
    : [product.image || 'placeholder-product.svg'];

  const mainImage = document.getElementById('mainProductImage');
  mainImage.src = `assets/images/${images[0]}`;
  mainImage.alt = product.name;

  // Categoría como etiqueta sobre la imagen, no como antetítulo.
  const container = mainImage.parentElement;
  container.querySelector('.product-chip')?.remove();
  const chip = document.createElement('p');
  chip.className = 'product-chip';
  chip.textContent = product.category;
  container.appendChild(chip);

  const thumbnails = document.getElementById('thumbnailsContainer');
  thumbnails.innerHTML = '';
  thumbnails.hidden = images.length < 2;

  if (images.length > 1) {
    images.forEach((path, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumbnail';
      button.setAttribute('aria-label', `Ver imagen ${index + 1} de ${images.length}`);
      button.setAttribute('aria-pressed', String(index === 0));

      const img = document.createElement('img');
      img.src = `assets/images/${path}`;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      button.appendChild(img);

      button.addEventListener('click', () => {
        mainImage.src = `assets/images/${path}`;
        thumbnails.querySelectorAll('.thumbnail')
          .forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
      });

      thumbnails.appendChild(button);
    });
  }

  document.getElementById('productTitle').textContent = product.name;
  document.getElementById('productDescription').textContent =
    product.detailedDescription || product.description || '';

  const specs = document.getElementById('productSpecs');
  specs.innerHTML = '';
  const specList = buildSpecs(product);
  specs.hidden = specList.length === 0;
  specList.forEach((spec) => {
    const box = document.createElement('div');
    box.className = 'spec-box';
    box.innerHTML =
      `<dt class="spec-label">${spec.label}</dt><dd class="spec-value">${spec.value}</dd>`;
    specs.appendChild(box);
  });

  const buyButton = document.getElementById('whatsappBtn');
  buyButton.onclick = () => {
    const message = `Hola, me interesa ${product.name} (${product.category}).`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener'
    );
  };

  lightbox.hidden = false;
  lightbox.classList.add('active');
  document.body.classList.add('lightbox-open');
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox || !lightbox.classList.contains('active')) return;

  lightbox.classList.remove('active');
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  lastFocusedElement?.focus();
  lastFocusedElement = null;
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // El foco no puede salir del diálogo mientras está abierto.
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...lightbox.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* --- Formulario --------------------------------------------------------- */

function initBusinessForm() {
  const form = document.getElementById('businessForm');
  const status = document.getElementById('businessStatus');
  if (!form || !status) return;

  const rules = {
    'bf-name': (value) => (value.trim() ? '' : 'Necesitamos tu nombre para responderte.'),
    'bf-email': (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Revisa el correo: parece incompleto.',
    'bf-business': (value) => (value.trim() ? '' : 'Cuéntanos cómo se llama tu negocio.'),
    'bf-message': (value) =>
      value.trim().length >= 10 ? '' : 'Escríbenos un poco más, al menos una frase.'
  };

  function validateField(id) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    const message = rules[id](input.value);

    input.closest('.field').classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
    if (message) input.setAttribute('aria-describedby', `${id}-error`);
    else input.removeAttribute('aria-describedby');

    return !message;
  }

  Object.keys(rules).forEach((id) => {
    const input = document.getElementById(id);
    // Solo se valida al salir del campo si ya había un error: no se regaña
    // a alguien mientras todavía está escribiendo.
    input.addEventListener('blur', () => {
      if (input.closest('.field').classList.contains('has-error')) validateField(id);
    });
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) validateField(id);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      status.textContent = 'Revisa los campos marcados antes de enviar.';
      status.className = 'form-status is-error';
      form.querySelector('.has-error input, .has-error textarea')?.focus();
      return;
    }

    // Sin backend: se abre el correo con la propuesta ya redactada.
    // Para envío automático, conectar aquí un endpoint (Formspree, Basin…).
    const data = new FormData(form);
    const subject = `Propuesta de negocio — ${data.get('business')}`;
    const body = [
      `Nombre: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `Negocio: ${data.get('business')}`,
      '',
      data.get('message')
    ].join('\n');

    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = 'Abrimos tu correo con la propuesta lista para enviar.';
    status.className = 'form-status is-ok';
  });
}

/* --- Motion ------------------------------------------------------------- */

function initReveals() {
  if (prefersReducedMotion.matches) return;

  document.documentElement.classList.add('reveal-ready');
  const targets = document.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );

  targets.forEach((target) => observer.observe(target));
}

function initParallax() {
  const section = document.querySelector('.values-section');
  const image = document.querySelector('.values-bread-image');
  if (!section || !image || prefersReducedMotion.matches) return;

  const MAX_SHIFT = 60; // px — acotado: la imagen nunca abandona su sección
  let visible = false;
  let ticking = false;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  }).observe(section);

  function update() {
    const rect = section.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const clamped = Math.min(Math.max(progress, 0), 1);
    image.style.translate = `-50% calc(-50% + ${(clamped - 0.5) * 2 * MAX_SHIFT}px)`;
  }

  window.addEventListener('scroll', () => {
    if (!visible || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });
}

/* --- Arranque ----------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = String(new Date().getFullYear());

  initHeroCarousel();
  initNav();
  initLightbox();
  initBusinessForm();
  initParallax();
  loadProducts();

  // Enlaces internos: se respeta el modo de movimiento reducido.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });
});
