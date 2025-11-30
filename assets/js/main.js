// Bauhaus/Experimental Jetset/Swiss-German Design - Client-side Interactivity
// Ideas/Stories/Sprints Taxonomy System

(function() {
  'use strict';
  
  // Filter functionality for ideas/sprints pages
  function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn, .filter-button');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.dataset.filter;
        
        // Update active button
        filterButtons.forEach(btn => {
          btn.classList.remove('filter-btn--active', 'filter-button--active');
        });
        this.classList.add('filter-btn--active');
        
        // Filter cards
        const cards = document.querySelectorAll('.idea-card, .story-card, .sprint-card, .figure-card');
        cards.forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            // Check if card has the matching status class
            const hasStatus = card.classList.contains(`idea-card--${filter}`) ||
                            card.classList.contains(`story-card--${filter}`) ||
                            card.classList.contains(`sprint-card--${filter}`) ||
                            card.classList.contains(`figure-card--${filter}`);
            card.style.display = hasStatus ? '' : 'none';
          }
        });
      });
    });
  }
  
  // Set current page in navigation
  function setCurrentNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (currentPath.includes(linkPath) && linkPath !== '/') {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  
  // Initialize when DOM is ready
  function init() {
    initFilters();
    setCurrentNav();
    console.log('Bauhaus/Swiss-German Design System - Initialized');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

