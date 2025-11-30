// Figures Collection - Lightbox Functionality
// Bauhaus/Experimental Jetset/Swiss-German Design System

(function() {
  'use strict';
  
  let currentImageIndex = 0;
  let images = [];
  let lightbox = null;
  let lightboxImage = null;
  let lightboxClose = null;
  let lightboxPrev = null;
  let lightboxNext = null;
  
  // Initialize lightbox
  function initLightbox() {
    // Create lightbox HTML if it doesn't exist
    if (!document.querySelector('.lightbox')) {
      const lightboxHTML = `
        <div class="lightbox" role="dialog" aria-label="Image lightbox" aria-modal="true">
          <button class="lightbox__close" aria-label="Close lightbox" title="Close (ESC)">×</button>
          <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous image" title="Previous (←)">←</button>
          <button class="lightbox__nav lightbox__nav--next" aria-label="Next image" title="Next (→)">→</button>
          <div class="lightbox__content">
            <img class="lightbox__image" src="" alt="">
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    }
    
    lightbox = document.querySelector('.lightbox');
    lightboxImage = lightbox.querySelector('.lightbox__image');
    lightboxClose = lightbox.querySelector('.lightbox__close');
    lightboxPrev = lightbox.querySelector('.lightbox__nav--prev');
    lightboxNext = lightbox.querySelector('.lightbox__nav--next');
    
    // Event listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevious);
    lightboxNext.addEventListener('click', showNext);
    lightbox.addEventListener('click', function(e) {
      // Close if clicking on backdrop (not on image or controls)
      if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox__content')) {
        closeLightbox();
      }
    });
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyboard);
  }
  
  // Collect all lightbox images
  function collectImages() {
    images = Array.from(document.querySelectorAll('[data-lightbox]')).map(link => ({
      src: link.href || link.querySelector('img')?.src,
      alt: link.querySelector('img')?.alt || link.title || '',
      element: link
    }));
  }
  
  // Open lightbox
  function openLightbox(index) {
    if (images.length === 0) return;
    
    currentImageIndex = index;
    const image = images[currentImageIndex];
    
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    
    lightbox.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    
    updateNavigation();
  }
  
  // Close lightbox
  function closeLightbox() {
    lightbox.classList.remove('is-active');
    document.body.style.overflow = '';
  }
  
  // Show previous image
  function showPrevious(e) {
    if (e) e.stopPropagation();
    if (images.length === 0) return;
    
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    const image = images[currentImageIndex];
    
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    
    updateNavigation();
  }
  
  // Show next image
  function showNext(e) {
    if (e) e.stopPropagation();
    if (images.length === 0) return;
    
    currentImageIndex = (currentImageIndex + 1) % images.length;
    const image = images[currentImageIndex];
    
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    
    updateNavigation();
  }
  
  // Update navigation buttons
  function updateNavigation() {
    if (images.length <= 1) {
      lightboxPrev.classList.add('lightbox__nav--hidden');
      lightboxNext.classList.add('lightbox__nav--hidden');
    } else {
      lightboxPrev.classList.remove('lightbox__nav--hidden');
      lightboxNext.classList.remove('lightbox__nav--hidden');
    }
  }
  
  // Handle keyboard events
  function handleKeyboard(e) {
    if (!lightbox.classList.contains('is-active')) return;
    
    switch(e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        showPrevious();
        break;
      case 'ArrowRight':
        showNext();
        break;
    }
  }
  
  // Initialize on DOM ready
  function init() {
    initLightbox();
    collectImages();
    
    // Attach click handlers to all lightbox triggers
    document.addEventListener('click', function(e) {
      const trigger = e.target.closest('[data-lightbox]');
      if (trigger) {
        e.preventDefault();
        collectImages(); // Re-collect in case new images were added
        const index = images.findIndex(img => img.element === trigger);
        if (index !== -1) {
          openLightbox(index);
        }
      }
    });
    
    console.log('Figures lightbox initialized');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

