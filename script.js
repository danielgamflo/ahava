// Hero Carousel
let currentSlideIndex = 1;
let carouselAutoPlayInterval;

function currentSlide(n) {
  currentSlideIndex = n;
  showSlide(n);
}

function showSlide(n) {
  const heroCarousel = document.querySelector('.hero-carousel');
  if (!heroCarousel) {
    console.log('Hero carousel not found');
    return;
  }

  const slides = heroCarousel.querySelectorAll('.carousel-slide');
  const dots = heroCarousel.querySelectorAll('.dot');

  console.log('Found slides:', slides.length, 'dots:', dots.length, 'showing:', currentSlideIndex);

  if (n > slides.length) currentSlideIndex = 1;
  if (n < 1) currentSlideIndex = slides.length;

  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));

  if (slides[currentSlideIndex - 1]) {
    slides[currentSlideIndex - 1].classList.add('active');
    console.log('Added active to slide', currentSlideIndex);
  }
  if (dots[currentSlideIndex - 1]) dots[currentSlideIndex - 1].classList.add('active');
}

function autoPlayCarousel() {
  carouselAutoPlayInterval = setInterval(() => {
    currentSlideIndex++;
    console.log('Carousel slide:', currentSlideIndex);
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

    const galleryWrapper = document.createElement('div');
    galleryWrapper.className = 'gallery-wrapper';

    const gallery = document.createElement('div');
    gallery.className = 'category-gallery';

    categoryProducts.forEach((product) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = product.image ? 'assets/images/' + product.image : 'assets/images/placeholder-product.svg';
      img.alt = product.name;
      galleryItem.appendChild(img);

      galleryItem.onclick = (function(pid) {
        return function() {
          openLightbox(pid);
        };
      })(product.id);

      gallery.appendChild(galleryItem);
    });

    // Create gallery dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'gallery-dots-container';
    for (let i = 0; i < categoryProducts.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
      dot.onclick = (function(index) {
        return function() {
          gallery.scrollLeft = index * (galleryWrapper.offsetWidth);
          updateGalleryDots(dotsContainer, index);
        };
      })(i);
      dotsContainer.appendChild(dot);
    }

    // Update dots on scroll
    gallery.addEventListener('scroll', function() {
      const itemWidth = gallery.offsetWidth;
      const scrollPos = gallery.scrollLeft;
      const activeIndex = Math.round(scrollPos / itemWidth);
      updateGalleryDots(dotsContainer, activeIndex);
    });

    galleryWrapper.appendChild(gallery);
    galleryWrapper.appendChild(dotsContainer);
    body.appendChild(description);
    body.appendChild(galleryWrapper);
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
let currentProduct = null;

function openLightbox(productId) {
  console.log('Opening lightbox for product:', productId);
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  currentProduct = product;

  document.body.classList.add('lightbox-open');
  currentLightboxSlideIndex = 0;

  // Carousel
  const track = document.getElementById('carouselTrack');
  console.log('Track found:', !!track);
  track.innerHTML = '';
  track.style.transform = 'translateX(0%)';

  if (product.images && product.images.length > 0) {
    product.images.forEach((imagePath) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      const img = document.createElement('img');
      img.src = 'assets/images/' + imagePath;
      img.alt = product.name;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      slide.appendChild(img);
      track.appendChild(slide);
    });
  }

  // Create carousel dots
  const dotsContainer = document.getElementById('carouselDots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.onclick = function() {
      currentLightboxSlideIndex = i;
      updateLightboxCarousel();
      updateCarouselDots();
    };
    dotsContainer.appendChild(dot);
  }

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

  // Add touch listeners for carousel
  const track = document.getElementById('carouselTrack');
  if (track) {
    // Remove old listeners first
    track.removeEventListener('touchstart', handleTouchStart);
    track.removeEventListener('touchend', handleTouchEnd);

    // Add new listeners
    track.addEventListener('touchstart', handleTouchStart, false);
    track.addEventListener('touchend', handleTouchEnd, false);
  }

  document.getElementById('lightbox').classList.add('active');
}

function handleTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    lastTouchTime = Date.now();
  }
}

function handleTouchEnd(e) {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  if (Date.now() - lastTouchTime > 1000) return;

  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > 50) {
    e.preventDefault();
    if (diff > 0 && currentProduct && currentLightboxSlideIndex < (currentProduct.images.length - 1)) {
      currentLightboxSlideIndex++;
    } else if (diff < 0 && currentLightboxSlideIndex > 0) {
      currentLightboxSlideIndex--;
    }
    updateLightboxCarousel();
    updateCarouselDots();
  }
}

function updateLightboxCarousel() {
  const track = document.getElementById('carouselTrack');
  if (track) {
    track.style.transform = 'translateX(' + (-currentLightboxSlideIndex * 100) + '%)';
  }
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.classList.remove('lightbox-open');
}

function updateCarouselDots() {
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentLightboxSlideIndex);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    showSlide(currentSlideIndex);
    autoPlayCarousel();
  }, 100);

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
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
  });

  loadProducts();
});

function updateGalleryDots(container, activeIndex) {
  const dots = container.querySelectorAll('.gallery-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex);
  });
}

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
