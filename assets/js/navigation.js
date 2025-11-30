/**
 * Navigation System
 * Handles filtering, search, and mobile menu
 */

(function() {
  'use strict';
  
  // --------------------------------------------------------------------------
  // Filter Bar
  // --------------------------------------------------------------------------
  
  function initFilterBar() {
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;
    
    const dropdowns = filterBar.querySelectorAll('.filter-bar__dropdown');
    const activeFilters = {};
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.filter-bar__trigger');
      const options = dropdown.querySelector('.filter-bar__options');
      const filterType = trigger.dataset.filterType;
      
      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns();
        if (!isExpanded) {
          trigger.setAttribute('aria-expanded', 'true');
          options.hidden = false;
        }
      });
      
      // Select option
      options.addEventListener('click', (e) => {
        const option = e.target.closest('[role="option"]');
        if (!option) return;
        
        const value = option.dataset.value;
        
        // Update selection
        options.querySelectorAll('[role="option"]').forEach(opt => {
          opt.classList.remove('is-selected');
        });
        option.classList.add('is-selected');
        
        // Store filter
        if (value === 'all') {
          delete activeFilters[filterType];
        } else {
          activeFilters[filterType] = value;
        }
        
        // Apply filters
        applyFilters(filterBar.dataset.filterCollection, activeFilters);
        updateURL(activeFilters);
        closeAllDropdowns();
      });
    });
    
    // Close on outside click
    document.addEventListener('click', closeAllDropdowns);
    
    // Load filters from URL
    loadFiltersFromURL(activeFilters, dropdowns);
    if (Object.keys(activeFilters).length > 0) {
      applyFilters(filterBar.dataset.filterCollection, activeFilters);
    }
  }
  
  function closeAllDropdowns() {
    document.querySelectorAll('.filter-bar__trigger').forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.filter-bar__options').forEach(options => {
      options.hidden = true;
    });
  }
  
  function applyFilters(collection, filters) {
    const cards = document.querySelectorAll('[data-status], [data-priority], [data-sprint]');
    let visibleCount = 0;
    
    cards.forEach(card => {
      let visible = true;
      
      for (const [type, value] of Object.entries(filters)) {
        const cardValue = card.dataset[type];
        if (type === 'sprint') {
          if (value === 'unassigned' && cardValue) {
            visible = false;
            break;
          } else if (value !== 'unassigned' && cardValue !== value) {
            visible = false;
            break;
          }
        } else if (cardValue !== value) {
          visible = false;
          break;
        }
      }
      
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    
    // Update count
    const countEl = document.querySelector('[data-visible-count]');
    if (countEl) {
      countEl.textContent = visibleCount === cards.length ? 'all' : visibleCount;
    }
  }
  
  function updateURL(filters) {
    const url = new URL(window.location);
    url.search = '';
    for (const [key, value] of Object.entries(filters)) {
      url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
  
  function loadFiltersFromURL(filters, dropdowns) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      filters[key] = value;
      // Update dropdown UI
      dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.filter-bar__trigger');
        if (trigger.dataset.filterType === key) {
          const option = dropdown.querySelector(`[data-value="${value}"]`);
          if (option) {
            dropdown.querySelectorAll('[role="option"]').forEach(opt => {
              opt.classList.remove('is-selected');
            });
            option.classList.add('is-selected');
          }
        }
      });
    }
  }
  
  // --------------------------------------------------------------------------
  // Notation Search
  // --------------------------------------------------------------------------
  
  function initNotationSearch() {
    const searchForms = document.querySelectorAll('.notation-search__form');
    
    searchForms.forEach(searchForm => {
      const input = searchForm.querySelector('.notation-search__input');
      
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const notation = input.value.trim();
        const url = parseNotation(notation);
        
        if (url) {
          window.location.href = url;
        } else {
          // Fallback to search
          alert('Invalid notation format. Try: i5, 5.23, or 2609');
        }
      });
      
      // Show hint on focus
      input.addEventListener('focus', () => {
        const hint = document.getElementById('notation-hint');
        if (hint) hint.hidden = false;
      });
      
      input.addEventListener('blur', () => {
        setTimeout(() => {
          const hint = document.getElementById('notation-hint');
          if (hint) hint.hidden = true;
        }, 200);
      });
    });
  }
  
  function parseNotation(input) {
    const normalized = input.toLowerCase().trim();
    
    // Full notation: 2609.5.23
    if (/^\d{4}\.\d+\.\d+$/.test(normalized)) {
      const [sprint, idea, story] = normalized.split('.');
      return `/updates/${sprint}-${idea}-${story}/`;
    }
    
    // Idea.Story: 5.23
    if (/^\d+\.\d+$/.test(normalized)) {
      const [idea, story] = normalized.split('.');
      return `/s/${idea}/${story}/`;
    }
    
    // Idea only: i5 or just 5
    if (/^i?\d+$/.test(normalized)) {
      const num = normalized.replace(/^i/i, '');
      return `/i/${num}/`;
    }
    
    // Sprint: 2609
    if (/^\d{4}$/.test(normalized)) {
      return `/sprint/${normalized}/`;
    }
    
    return null;
  }
  
  // --------------------------------------------------------------------------
  // Mobile Navigation
  // --------------------------------------------------------------------------
  
  function initMobileNav() {
    const toggle = document.querySelector('.primary-nav__mobile-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const closeBtn = mobileNav?.querySelector('.mobile-nav__close');
    
    if (!toggle || !mobileNav) return;
    
    toggle.addEventListener('click', () => {
      mobileNav.hidden = false;
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    });
    
    closeBtn?.addEventListener('click', closeMobileNav);
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileNav.hidden) {
        closeMobileNav();
      }
    });
    
    function closeMobileNav() {
      mobileNav.hidden = true;
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
  
  // --------------------------------------------------------------------------
  // Quick Jump
  // --------------------------------------------------------------------------
  
  function initQuickJump() {
    const buttons = document.querySelectorAll('.quick-jump__btn[data-filter]');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const [type, value] = btn.dataset.filter.split(':');
        const filters = { [type]: value };
        
        applyFilters('', filters);
        updateURL(filters);
        
        // Update active state
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  }
  
  // --------------------------------------------------------------------------
  // Initialize
  // --------------------------------------------------------------------------
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    initFilterBar();
    initNotationSearch();
    initMobileNav();
    initQuickJump();
  }
  
})();



