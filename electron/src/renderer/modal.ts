import { showError } from './toast';

export type ModalOptions = {
  title: string;
  body: string;
  submitLabel?: string;
  width?: 'md' | 'lg';
  onSubmit: (formData: FormData, form: HTMLFormElement) => Promise<boolean | void>;
  onOpen?: (form: HTMLFormElement) => void;
};

let modal: HTMLDivElement | null = null;
let modalDialog: HTMLDivElement | null = null;
let modalForm: HTMLFormElement | null = null;
let modalTitle: HTMLHeadingElement | null = null;
let modalCloseButton: HTMLButtonElement | null = null;
let activeSubmitHandler: ModalOptions['onSubmit'] | null = null;

export function setupModalHandlers(): void {
  modal = document.getElementById('modal') as HTMLDivElement | null;
  modalDialog = modal?.querySelector('.modal__dialog') ?? null;
  modalForm = document.getElementById('modal-form') as HTMLFormElement | null;
  modalTitle = document.getElementById('modal-title') as HTMLHeadingElement | null;
  modalCloseButton = document.getElementById('modal-close') as HTMLButtonElement | null;

  if (!modal || !modalDialog || !modalForm || !modalTitle) {
    throw new Error('Modal DOM structure not found');
  }

  modalCloseButton?.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal?.classList.contains('hidden')) {
      closeModal();
    }
  });

  modalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeSubmitHandler || !modalForm) return;

    const submitButton = modalForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Saving…';
    }

    try {
      const shouldClose = await activeSubmitHandler(new FormData(modalForm), modalForm);
      if (shouldClose !== false) {
        closeModal();
      }
    } catch (error) {
      showError((error as Error).message);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.defaultText || 'Save';
      }
    }
  });
}

export function openModal(options: ModalOptions): void {
  if (!modal || !modalDialog || !modalForm || !modalTitle) {
    throw new Error('Modal handlers not initialized');
  }

  modalDialog.dataset.size = options.width ?? 'md';
  modalTitle.textContent = options.title;

  modalForm.innerHTML = `
    ${options.body}
    <div class="modal__actions">
      <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
      <button type="submit" class="btn btn-primary" data-default-text="${options.submitLabel ?? 'Save'}">${
        options.submitLabel ?? 'Save'
      }</button>
    </div>
  `;

  modalForm.querySelector('[data-modal-cancel]')?.addEventListener('click', closeModal);

  activeSubmitHandler = options.onSubmit;
  modal.classList.remove('hidden');
  options.onOpen?.(modalForm);
}

export function closeModal(): void {
  if (!modal || !modalForm) {
    return;
  }
  modal.classList.add('hidden');
  modalForm.reset();
  modalForm.innerHTML = '';
  activeSubmitHandler = null;
}


