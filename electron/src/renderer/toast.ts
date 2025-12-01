const toastContainer = document.getElementById('toast-container') as HTMLDivElement | null;
const errorBanner = document.getElementById('error-message') as HTMLDivElement | null;

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export function showError(message: string): void {
  if (errorBanner) {
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
    setTimeout(() => {
      errorBanner.style.display = 'none';
    }, 5000);
  }
  showToast(message, 'error');
}


