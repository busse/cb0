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
  
  // Story preview tooltip for sprint table
  function initStoryPreview() {
    const storyLinks = document.querySelectorAll('.sprint-table__story-link[data-story-number]');
    if (storyLinks.length === 0) return;
    
    // Create tooltip element
    let tooltip = document.getElementById('sprint-table-story-preview');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'sprint-table-story-preview';
      tooltip.className = 'sprint-table__story-preview';
      document.body.appendChild(tooltip);
    }
    
    let hoverTimeout;
    let currentLink = null;
    
    function showTooltip(link, event) {
      const storyNumber = link.dataset.storyNumber;
      const ideaNumber = link.dataset.ideaNumber;
      const title = link.dataset.storyTitle || '';
      const description = link.dataset.storyDescription || '';
      const status = link.dataset.storyStatus || '';
      const priority = link.dataset.storyPriority || '';
      const created = link.dataset.storyCreated || '';
      
      // Format notation
      const notation = `i${ideaNumber}.${storyNumber}`;
      
      // Format status
      const statusText = status ? status.replace(/-/g, ' ').toUpperCase() : '';
      
      // Format created date
      let createdText = '';
      if (created) {
        try {
          const date = new Date(created);
          createdText = date.toISOString().split('T')[0];
        } catch (e) {
          createdText = created;
        }
      }
      
      // Build tooltip HTML
      const statusClass = status ? `sprint-table__story-preview--${status.replace(/_/g, '-')}` : '';
      tooltip.className = `sprint-table__story-preview ${statusClass}`;
      tooltip.innerHTML = `
        <header class="sprint-table__story-preview-header">
          <span class="sprint-table__story-preview-notation">${notation}</span>
          <div class="sprint-table__story-preview-title">${title}</div>
          ${statusText ? `<div class="sprint-table__story-preview-status-box">
            <span class="sprint-table__story-preview-status-text">${statusText}</span>
          </div>` : ''}
        </header>
        <div class="sprint-table__story-preview-grid">
          ${description ? `<div class="sprint-table__story-preview-row">
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--label">DESCRIPTION</div>
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--value sprint-table__story-preview-description">${description}</div>
          </div>` : ''}
          ${priority ? `<div class="sprint-table__story-preview-row">
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--label">PRIORITY</div>
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--value">${priority.toUpperCase()}</div>
          </div>` : ''}
          ${statusText ? `<div class="sprint-table__story-preview-row">
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--label">STATUS</div>
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--value sprint-table__story-preview-cell--secondary">${statusText}</div>
          </div>` : ''}
          ${createdText ? `<div class="sprint-table__story-preview-row">
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--label">CREATED</div>
            <div class="sprint-table__story-preview-cell sprint-table__story-preview-cell--value">${createdText}</div>
          </div>` : ''}
        </div>
      `;
      
      // Show tooltip first to get its dimensions
      tooltip.classList.add('sprint-table__story-preview--visible');
      
      // Position tooltip
      const rect = link.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Position to the right of the link, or left if not enough space
      let left = rect.right + scrollX + 10;
      let top = rect.top + scrollY - 10;
      
      // Check if tooltip would go off screen to the right
      if (left + tooltipRect.width > window.innerWidth + scrollX) {
        left = rect.left + scrollX - tooltipRect.width - 10;
      }
      
      // Check if tooltip would go off screen to the bottom
      if (top + tooltipRect.height > window.innerHeight + scrollY) {
        top = window.innerHeight + scrollY - tooltipRect.height - 10;
      }
      
      // Check if tooltip would go off screen to the top
      if (top < scrollY) {
        top = scrollY + 10;
      }
      
      // Ensure tooltip doesn't go off left edge
      if (left < scrollX) {
        left = scrollX + 10;
      }
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      currentLink = link;
    }
    
    function hideTooltip() {
      tooltip.classList.remove('sprint-table__story-preview--visible');
      currentLink = null;
    }
    
    storyLinks.forEach(link => {
      link.addEventListener('mouseenter', function(e) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          showTooltip(this, e);
        }, 300); // Small delay to prevent flickering
      });
      
      link.addEventListener('mouseleave', function() {
        clearTimeout(hoverTimeout);
        hideTooltip();
      });
    });
    
    // Hide tooltip when mouse leaves the table area
    const sprintTable = document.querySelector('.sprint-table');
    if (sprintTable) {
      sprintTable.addEventListener('mouseleave', function() {
        clearTimeout(hoverTimeout);
        hideTooltip();
      });
    }
  }
  
  // Initialize when DOM is ready
  function init() {
    initFilters();
    setCurrentNav();
    initStoryPreview();
    console.log('Bauhaus/Swiss-German Design System - Initialized');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

