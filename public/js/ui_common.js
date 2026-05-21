/* ==========================================================================
   CUSTOM SOFT ALERTS & TOASTS SYSTEM & GENERAL UI UTILITIES
   ========================================================================== */
import { SOUNDS } from './sounds.js';

let activeModalCallback = null;
let activeModalCancelCallback = null;

export function showToast(message, type = 'info') {
    const container = document.getElementById('custom-toast-container');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    // Select icon based on type
    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    else if (type === 'error') iconName = 'error';
    else if (type === 'warning') iconName = 'warning';

    toast.innerHTML = `
        <span class="material-symbols-rounded toast-icon">${iconName}</span>
        <div class="toast-content">${message}</div>
    `;

    // Append to container
    container.appendChild(toast);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('toast-fadeOut');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
        // Fallback remove if transitionend does not trigger
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

export function showModalAlert(title, message, icon = 'info', onConfirm = null, showCancel = false, onCancel = null) {
    const backdrop = document.getElementById('custom-modal-backdrop');
    const titleEl = document.getElementById('custom-modal-title');
    const messageEl = document.getElementById('custom-modal-message');
    const iconEl = document.getElementById('custom-modal-icon');
    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!backdrop || !titleEl || !messageEl || !iconEl || !okBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Set icon type class for dynamic text shadow & color
    iconEl.className = 'material-symbols-rounded modal-icon';
    let iconClass = 'icon-info';
    if (icon === 'wifi_off' || icon === 'error') iconClass = 'icon-error';
    else if (icon === 'warning') iconClass = 'icon-warning';
    else if (icon === 'check_circle' || icon === 'success') iconClass = 'icon-success';
    else if (icon === 'logout') iconClass = 'icon-error';
    
    iconEl.classList.add(iconClass);
    iconEl.textContent = icon;

    // Show/hide cancel button
    if (cancelBtn) {
        if (showCancel) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
    }

    // Save callback
    activeModalCallback = onConfirm;
    activeModalCancelCallback = onCancel;

    // Show modal
    backdrop.classList.remove('hidden');
    
    // Play sound to grab attention
    SOUNDS.playClick();
}

export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Bind confirmation button click globally on script execution
const initModalEvents = () => {
    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');
    const backdrop = document.getElementById('custom-modal-backdrop');
    
    if (okBtn && backdrop) {
        okBtn.addEventListener('click', () => {
            SOUNDS.playClick();
            backdrop.classList.add('hidden');
            if (activeModalCallback) {
                const cb = activeModalCallback;
                activeModalCallback = null;
                activeModalCancelCallback = null;
                cb();
            }
        });
    }

    if (cancelBtn && backdrop) {
        cancelBtn.addEventListener('click', () => {
            SOUNDS.playClick();
            backdrop.classList.add('hidden');
            if (activeModalCancelCallback) {
                const cb = activeModalCancelCallback;
                activeModalCallback = null;
                activeModalCancelCallback = null;
                cb();
            }
        });
    }
};

// Execute once DOM parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalEvents);
} else {
    initModalEvents();
}
