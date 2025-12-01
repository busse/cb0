import { escapeAttr, escapeHtml } from '../utils/dom';

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectOptions = {
  name: string;
  options: MultiSelectOption[];
  selected: string[];
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
};

export type MultiSelectResult = {
  html: string;
  init: (form: HTMLFormElement) => void;
};

export function createMultiSelect(options: MultiSelectOptions): MultiSelectResult {
  const {
    name,
    options: allOptions,
    selected,
    placeholder = 'Search...',
    searchable = true,
    required = false,
  } = options;

  const selectedSet = new Set(selected);
  const uniqueId = `multi-select-${name}-${Math.random().toString(36).slice(2, 11)}`;

  // Generate HTML structure
  const html = `
    <div class="multi-select" data-multi-select="${name}" data-unique-id="${uniqueId}">
      <div class="multi-select__tags" data-tags></div>
      <input 
        type="text" 
        class="multi-select__input" 
        placeholder="${escapeAttr(placeholder)}"
        data-input
      />
      <div class="multi-select__dropdown hidden" data-dropdown>
        ${allOptions
          .map(
            (option) => `
          <div class="multi-select__option" data-option="${escapeAttr(option.value)}">
            <input 
              type="checkbox" 
              value="${escapeAttr(option.value)}" 
              id="${uniqueId}-${escapeAttr(option.value)}"
              ${selectedSet.has(option.value) ? 'checked' : ''}
            />
            <label for="${uniqueId}-${escapeAttr(option.value)}">${escapeHtml(option.label)}</label>
          </div>
        `
          )
          .join('')}
      </div>
      <div data-hidden-inputs></div>
    </div>
  `;

  // Initialize function
  const init = (form: HTMLFormElement) => {
    const container = form.querySelector<HTMLDivElement>(`[data-multi-select="${name}"]`);
    if (!container) return;

    const tagsContainer = container.querySelector<HTMLDivElement>('[data-tags]');
    const input = container.querySelector<HTMLInputElement>('[data-input]');
    const dropdown = container.querySelector<HTMLDivElement>('[data-dropdown]');
    const hiddenInputsContainer = container.querySelector<HTMLDivElement>('[data-hidden-inputs]');
    const options = container.querySelectorAll<HTMLDivElement>('[data-option]');

    if (!tagsContainer || !input || !dropdown || !hiddenInputsContainer) return;

    let selectedValues = new Set(selected);
    let filteredOptions = Array.from(options);
    let focusedIndex = -1;

    // Update hidden inputs for form submission
    const updateHiddenInputs = () => {
      hiddenInputsContainer.innerHTML = '';
      selectedValues.forEach((value) => {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = name;
        hiddenInput.value = value;
        hiddenInputsContainer.appendChild(hiddenInput);
      });
    };

    // Update tags display
    const updateTags = () => {
      tagsContainer.innerHTML = '';
      selectedValues.forEach((value) => {
        const option = allOptions.find((opt) => opt.value === value);
        if (!option) return;

        const tag = document.createElement('div');
        tag.className = 'multi-select__tag';
        tag.innerHTML = `
          <span>${escapeHtml(option.label)}</span>
          <button type="button" class="multi-select__tag-remove" data-remove="${escapeAttr(value)}" aria-label="Remove ${escapeHtml(option.label)}">×</button>
        `;
        tagsContainer.appendChild(tag);
      });
      updateHiddenInputs();
    };

    // Update dropdown visibility
    const updateDropdown = () => {
      const searchTerm = input.value.toLowerCase().trim();
      filteredOptions = Array.from(options);

      if (searchable && searchTerm) {
        filteredOptions = filteredOptions.filter((optionEl) => {
          const optionValue = optionEl.dataset.option || '';
          const option = allOptions.find((opt) => opt.value === optionValue);
          if (!option) return false;
          return option.label.toLowerCase().includes(searchTerm);
        });
      }

      // Show/hide options based on filter
      options.forEach((optionEl) => {
        const isVisible = filteredOptions.includes(optionEl);
        optionEl.style.display = isVisible ? '' : 'none';
      });

      // Reset focused index if current focus is out of bounds or hidden
      if (focusedIndex >= filteredOptions.length || (focusedIndex >= 0 && !filteredOptions.includes(filteredOptions[focusedIndex]))) {
        focusedIndex = -1;
      }
    };

    // Validation function for required fields
    const validateField = () => {
      if (required && selectedValues.size === 0) {
        input.setCustomValidity('Please select at least one option.');
        return false;
      } else {
        input.setCustomValidity('');
        return true;
      }
    };

    // Toggle selection
    const toggleSelection = (value: string) => {
      if (selectedValues.has(value)) {
        selectedValues.delete(value);
      } else {
        selectedValues.add(value);
      }
      updateTags();
      updateCheckboxes();
      if (required) {
        validateField();
      }
    };

    // Update checkboxes to match selected values
    const updateCheckboxes = () => {
      options.forEach((optionEl) => {
        const checkbox = optionEl.querySelector<HTMLInputElement>('input[type="checkbox"]');
        const value = optionEl.dataset.option || '';
        if (checkbox) {
          checkbox.checked = selectedValues.has(value);
        }
      });
    };

    // Open dropdown
    const openDropdown = () => {
      dropdown.classList.remove('hidden');
      updateDropdown();
      focusedIndex = -1;
    };

    // Close dropdown
    const closeDropdown = () => {
      dropdown.classList.add('hidden');
      input.value = '';
      updateDropdown();
      focusedIndex = -1;
    };

    // Handle input focus
    input.addEventListener('focus', () => {
      openDropdown();
    });

    // Handle input input (typing)
    input.addEventListener('input', () => {
      updateDropdown();
      focusedIndex = -1;
    });

    // Handle click on input
    input.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('hidden')) {
        openDropdown();
      }
    });

    // Handle option click
    options.forEach((optionEl) => {
      const checkbox = optionEl.querySelector<HTMLInputElement>('input[type="checkbox"]');
      const label = optionEl.querySelector<HTMLLabelElement>('label');

      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        const value = optionEl.dataset.option || '';
        if (value) {
          toggleSelection(value);
        }
      };

      checkbox?.addEventListener('change', handleClick);
      label?.addEventListener('click', handleClick);
      optionEl.addEventListener('click', handleClick);
    });

    // Handle tag remove
    tagsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const removeButton = target.closest<HTMLButtonElement>('[data-remove]');
      if (removeButton) {
        const value = removeButton.dataset.remove || '';
        if (value) {
          toggleSelection(value);
        }
      }
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      if (dropdown.classList.contains('hidden')) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusedIndex = Math.min(focusedIndex + 1, filteredOptions.length - 1);
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            filteredOptions[focusedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusedIndex = Math.max(focusedIndex - 1, -1);
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            filteredOptions[focusedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            const value = filteredOptions[focusedIndex].dataset.option || '';
            if (value) {
              toggleSelection(value);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          input.blur();
          break;
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        closeDropdown();
      }
    });

    // Add form validation for required fields
    if (required) {
      // Validate on form submit
      form.addEventListener('submit', (e) => {
        if (!validateField()) {
          e.preventDefault();
          input.reportValidity();
        }
      });
    }

    // Initialize
    updateTags();
    updateCheckboxes();
    updateHiddenInputs();
    
    // Validate initially if required
    if (required) {
      validateField();
    }
  };

  return { html, init };
}

