// Carousel
let currentSlideIndex = 1;
let carouselAutoPlayInterval;

function currentSlide(n) {
  currentSlideIndex = n;
  showSlide(n);
}

function showSlide(n) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.dot');
  if (n > slides.length) currentSlideIndex = 1;
  if (n < 1) currentSlideIndex = slides.length;
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  if (slides[currentSlideIndex - 1]) slides[currentSlideIndex - 1].classList.add('active');
  if (dots[currentSlideIndex - 1]) dots[currentSlideIndex - 1].classList.add('active');
}

function autoPlayCarousel() {
  carouselAutoPlayInterval = setInterval(() => {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
  }, 5000);
}

let allProducts = [];

async function loadProducts() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    allProducts = data.products;
    renderProductsByCategory(data.products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function groupByCategory(products) {
  return products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {});
}

function renderProductsByCategory(products) {
  const accordion = document.getElementById('productsAccordion');
  const grouped = groupByCategory(products);
  accordion.innerHTML = '';

  Object.entries(grouped).forEach(([category, categoryProducts]) => {
    const section = document.createElement('div');
    section.className = 'product-category-section';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = '<div><h3 class="category-title">' + category + '</h3><span class="category-count">' + categoryProducts.length + ' variedad' + (categoryProducts.length > 1 ? 'es' : '') + '</span></div><span class="toggle-icon">▼</span>';

    const content = document.createElement('div');
    content.className = 'category-content';

    const body = document.createElement('div');
    body.className = 'category-body';

    const description = document.createElement('p');
    description.className = 'category-description';
    description.textContent = 'Descubre nuestras ' + categoryProducts.length + ' variedad' + (categoryProducts.length > 1 ? 'es' : '') + ' de ' + category.toLowerCase() + '.';

    const gallery = document.createElement('div');
    gallery.className = 'category-gallery';

    categoryProducts.forEach((product) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = 'assets/images/placeholder-product.svg';
      img.alt = product.name;
      galleryItem.appendChild(img);

      galleryItem.onclick = (function(pid) {
        return function() {
          openLightbox(pid);
        };
      })(product.id);

      gallery.appendChild(galleryItem);
    });

    body.appendChild(description);
    body.appendChild(gallery);
    content.appendChild(body);
    section.appendChild(header);
    section.appendChild(content);

    header.onclick = function() {
      section.classList.toggle('expanded');
    };

    accordion.appendChild(section);
  });
}

let currentLightboxSlideIndex = 0;
let touchStartX = 0;
let lastTouchTime = 0;

function openLightbox(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  currentLightboxSlideIndex = 0;

  // Carousel
  const track = document.getElementById('carouselTrack');
  track.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    const img = document.createElement('img');
    img.src = 'assets/images/placeholder-product.svg';
    img.alt = 'Vista ' + (i + 1);
    slide.appendChild(img);
    track.appendChild(slide);
  }

  track.style.transform = 'translateX(0%)';

  document.getElementById('productCategory').textContent = product.category;
  document.getElementById('productTitle').textContent = product.name;
  document.getElementById('productDescription').textContent = product.detailedDescription || product.description;

  const specs = document.getElementById('productSpecs');
  specs.innerHTML = '';

  const specData = [
    { label: 'Calorías', value: product.calories + ' kcal' },
    { label: 'Peso', value: product.weight },
    { label: 'Tamaño', value: (product.size?.length || '') + ' × ' + (product.size?.height || '') },
    { label: 'Semillas', value: product.seeds?.join(', ') || '' },
    { label: 'Harina', value: product.flour || '' },
    { label: 'Conservación', value: 'Fresco: ' + (product.fresh || '') + ' Congelado: ' + (product.frozen || '') }
  ];

  specData.forEach(spec => {
    const box = document.createElement('div');
    box.className = 'spec-box';
    box.innerHTML = '<div class="spec-label">' + spec.label + '</div><div class="spec-value">' + spec.value + '</div>';
    specs.appendChild(box);
  });

  const btn = document.getElementById('whatsappBtn');
  if (btn) {
    btn.onclick = function() {
      window.open('https://wa.me/56XXXXXXXXX?text=Hola%20me%20interesa%20' + encodeURIComponent(product.name), '_blank');
    };
  }

  document.getElementById('lightbox').classList.add('active');
}

function updateLightboxCarousel() {
  const track = document.getElementById('carouselTrack');
  if (track) {
    track.style.transform = 'translateX(' + (-currentLightboxSlideIndex * 100) + '%)';
  }
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
  showSlide(currentSlideIndex);
  // autoPlayCarousel();

  // Hamburger menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function() {
      hamburgerBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        hamburgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  const lightboxClose = document.querySelector('.lightbox-close');
  if (lightboxClose) lightboxClose.onclick = closeLightbox;

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.onclick = function(e) {
      if (e.target === this) closeLightbox();
    };

    // Add touch listeners to carousel track
    const track = document.getElementById('carouselTrack');
    if (track) {
      track.addEventListener('touchstart', function(e) {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          lastTouchTime = Date.now();
        }
      }, false);

      track.addEventListener('touchend', function(e) {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        if (Date.now() - lastTouchTime > 1000) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
          if (diff > 0 && currentLightboxSlideIndex < 3) {
            currentLightboxSlideIndex++;
          } else if (diff < 0 && currentLightboxSlideIndex > 0) {
            currentLightboxSlideIndex--;
          }
          updateLightboxCarousel();
        }
      }, false);
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
  });

  loadProducts();
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.onclick = function(e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    }
  };
});

// Parallax effect for values section bread image
let parallaxOffset = 0;
let targetParallaxOffset = 0;
let ticking = false;

window.addEventListener('scroll', () => {
  targetParallaxOffset = window.scrollY * 0.3;
  if (!ticking) {
    requestAnimationFrame(() => {
      const img = document.querySelector('.values-bread-image');
      if (img) {
        parallaxOffset += (targetParallaxOffset - parallaxOffset) * 0.15;
        img.style.transform = `translateY(${parallaxOffset}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }
});
