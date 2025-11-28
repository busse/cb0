// UI_SPEC_PLACEHOLDER: JavaScript for interactive features
// This file will contain client-side interactivity for the site

(function() {
  'use strict';
  
  // Filter functionality for ideas/sprints pages
  function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-button');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.dataset.filter;
        
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('filter-button--active'));
        this.classList.add('filter-button--active');
        
        // Filter cards
        const cards = document.querySelectorAll('.idea-card, .story-card, .sprint-card');
        cards.forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const status = card.classList.toString().match(/--(\w+)/);
            if (status && status[1] === filter) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilters);
  } else {
    initFilters();
  }
  
  console.log('Ideas Array taxonomy system initialized');
})();

