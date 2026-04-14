let styleEl = null;
const FIELDS_CONFIG = (window.FIELDS_CONFIG || []);
let observer = null;
let retryInterval = null;
let isEnabled = false;
let boundSafeAddCopyButtons = null;
let boundClickHandler = null;


function ensureStyleInjected() {
  if (!styleEl) {
    styleEl = document.createElement('link');
    styleEl.rel = 'stylesheet';
    styleEl.href = chrome.runtime.getURL('style.css');
    (document.head || document.documentElement).appendChild(styleEl);
  }
}

function createCopyButton(field) {
  const button = document.createElement('button');
  button.className = 'fast-copy-btn';
  button.title = chrome.i18n.getMessage('copy') || 'Copy';
  button.type = 'button';
  button.setAttribute('aria-label', chrome.i18n.getMessage('copy') || 'Copy');
  button.innerHTML = '<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#1a1a1a"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.00001 4.10999C6.14022 4.33198 5.37874 4.83376 4.83558 5.53625C4.29241 6.23875 3.99845 7.10201 4.00001 7.98999V17.99C4.00001 19.0509 4.42149 20.0682 5.17164 20.8184C5.92178 21.5685 6.93914 21.99 8.00001 21.99H16C17.0609 21.99 18.0783 21.5685 18.8284 20.8184C19.5786 20.0682 20 19.0509 20 17.99V7.98999C19.9993 7.10372 19.7044 6.24269 19.1614 5.54224C18.6184 4.84178 17.8581 4.34156 17 4.12" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9 5.98999C8.46957 5.98999 7.96089 5.77925 7.58582 5.40417C7.21074 5.0291 7 4.52042 7 3.98999C7 3.45956 7.21074 2.95088 7.58582 2.57581C7.96089 2.20073 8.46957 1.98999 9 1.98999H15C15.5304 1.98999 16.0392 2.20073 16.4142 2.57581C16.7893 2.95088 17 3.45956 17 3.98999C17 4.52042 16.7893 5.0291 16.4142 5.40417C16.0392 5.77925 15.5304 5.98999 15 5.98999H9Z" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 16H14" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 12H16" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';
  
  button.dataset.fieldId = `fast-copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let valueToCopy = '';
    
    try {
      if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
        valueToCopy = field.value;
      } else if (field.hasAttribute('contenteditable')) {
        valueToCopy = field.textContent || field.innerText;
      } else if (field.textContent) {
        valueToCopy = field.textContent;
      } else if (field.value) {
        valueToCopy = field.value;
      }
      
      if (valueToCopy !== '') {
        navigator.clipboard.writeText(valueToCopy).then(() => {
          showTooltip(button, chrome.i18n.getMessage('copied') || 'Copied!');
          
          field.classList.add('fast-copy-highlight');
          setTimeout(() => {
            field.classList.remove('fast-copy-highlight');
          }, 1000);
        }).catch(err => {
          console.error('Error during copy:', err);
          showTooltip(button, 'Error copying');
        });
      }
    } catch (error) {
      console.error('Error during copy:', error);
      showTooltip(button, 'Error');
    }
  });
  
  return button;
}

function showTooltip(element, text) {
  const existingTooltips = document.querySelectorAll('.fast-copy-tooltip');
  existingTooltips.forEach(el => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 200);
  });
  
  const tooltip = document.createElement('div');
  tooltip.className = 'fast-copy-tooltip';
  tooltip.textContent = text;
  document.body.appendChild(tooltip);
  
  // Obtenir les dimensions et la position de l'élément
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Positionner le tooltip au-dessus du bouton en tenant compte du défilement
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  
  // Calculer la position initiale (centré au-dessus du bouton)
  let top = rect.top + scrollY - tooltipRect.height - 8;
  let left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);
  
  // Ajuster si le tooltip sort de l'écran horizontalement
  const horizontalMargin = 10;
  if (left < horizontalMargin) {
    left = horizontalMargin;
  } else if (left + tooltipRect.width > window.innerWidth - horizontalMargin) {
    left = window.innerWidth - tooltipRect.width - horizontalMargin;
  }
  
  // Ajuster si le tooltip sort de l'écran verticalement
  const verticalMargin = 10;
  if (top < verticalMargin) {
    // Si pas assez de place en haut, afficher en dessous
    top = rect.bottom + scrollY + 8;
    
    // S'assurer qu'on ne dépasse pas le bas de l'écran non plus
    if (top + tooltipRect.height > window.innerHeight + scrollY - verticalMargin) {
      top = window.innerHeight + scrollY - tooltipRect.height - verticalMargin;
    }
  }
  
  tooltip.style.left = `${Math.round(left)}px`;
  tooltip.style.top = `${Math.round(top)}px`;
  
  // Forcer le recalcul du style pour activer la transition
  void tooltip.offsetWidth;
  
  setTimeout(() => {
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
  }, 10);
  
  setTimeout(() => {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    }, 200);
  }, 2000);
}

function removeCopyButtons() {
  try {
    document.querySelectorAll('.fast-copy-btn').forEach(btn => btn.remove());

    // Also remove from iframes (e.g. TinyMCE editor)
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        const doc = iframe.contentDocument;
        if (doc) doc.querySelectorAll('.fast-copy-btn').forEach(btn => btn.remove());
      } catch (e) { /* cross-origin, skip */ }
    });

    // Clean up shadow DOM buttons
    FIELDS_CONFIG.forEach(config => {
      if (config.shadowInputSelector) {
        try {
          document.querySelectorAll(config.selector).forEach(el => {
            if (el.shadowRoot) {
              el.shadowRoot.querySelectorAll('.fast-copy-btn').forEach(btn => btn.remove());
              el.shadowRoot.querySelectorAll('link[data-fast-copy]').forEach(link => link.remove());
              const inputWrapper = el.shadowRoot.querySelector('.input-wrapper');
              if (inputWrapper) inputWrapper.style.position = '';
            }
          });
        } catch (e) { /* skip */ }
      }
    });

    // Clean field classes
    document.querySelectorAll('.fast-copy-field').forEach(field => {
      field.classList.remove('fast-copy-highlight');
      field.classList.remove('fast-copy-field');
    });

    // Remove orphan wrappers (use Array.from snapshot to avoid live-NodeList issues)
    document.querySelectorAll('.fast-copy-wrapper').forEach(wrapper => {
      Array.from(wrapper.children).forEach(child => {
        if (child.classList.contains('fast-copy-btn')) {
          child.remove();
        } else if (wrapper.parentNode) {
          wrapper.parentNode.insertBefore(child, wrapper);
        }
      });
      wrapper.remove();
    });
  } catch (e) {
    console.error('[FCB] Error removing buttons:', e);
  }
}

function addCopyButtons() {
  if (!isEnabled) return;
  FIELDS_CONFIG.forEach(config => {
    try {
      const fields = document.querySelectorAll(config.selector);
      
      fields.forEach(field => {
        try {
          // Handle shadow DOM elements (e.g. s-internal-text-field)
          if (config.shadowInputSelector && field.shadowRoot) {
            if (field.shadowRoot.querySelector('.fast-copy-btn')) return;

            const actualInput = field.shadowRoot.querySelector(config.shadowInputSelector);
            if (!actualInput) return;

            // Inject stylesheet into shadow root if not already present
            if (!field.shadowRoot.querySelector('link[data-fast-copy]')) {
              const styleLink = document.createElement('link');
              styleLink.rel = 'stylesheet';
              styleLink.href = chrome.runtime.getURL('style.css');
              styleLink.setAttribute('data-fast-copy', '1');
              field.shadowRoot.appendChild(styleLink);
            }

            const button = createCopyButton(actualInput);
            button.style.cssText = 'position:absolute !important; right:4px !important; top:50% !important; transform:translateY(-50%) !important; margin:0 !important;';

            const inputWrapper = field.shadowRoot.querySelector('.input-wrapper');
            if (inputWrapper) {
              inputWrapper.style.position = 'relative';
              inputWrapper.appendChild(button);
            } else {
              field.shadowRoot.appendChild(button);
            }
            return;
          }

          // Regular element flow
          if (!field.parentNode.querySelector('.fast-copy-btn')) {
            if (!field.parentNode.classList.contains('fast-copy-wrapper')) {
              const wrapper = document.createElement('div');
              wrapper.className = 'fast-copy-wrapper';

              field.parentNode.insertBefore(wrapper, field);
              wrapper.appendChild(field);

              field.classList.add('fast-copy-field');
            }

            const button = createCopyButton(field);
            field.parentNode.appendChild(button);
          }
        } catch (error) {
          console.error('Error adding button:', error);
        }
      });
    } catch (error) {
      console.error('Error with selector', config.selector, ':', error);
    }
  });
}

function init() {
  boundSafeAddCopyButtons = () => {
    try {
      addCopyButtons();
    } catch (error) {
      console.error('Error adding buttons:', error);
    }
  };

  boundClickHandler = (e) => {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      setTimeout(boundSafeAddCopyButtons, 500);
    }
  };

  boundSafeAddCopyButtons();

  // Observe changes in DOM
  observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0 ||
          (mutation.type === 'attributes' &&
           (mutation.target.matches('input') ||
            mutation.target.matches('div') ||
            mutation.target.matches('form')))) {
        shouldCheck = true;
      }
    });

    if (shouldCheck) {
      boundSafeAddCopyButtons();
    }
  });

  // Démarrer l'observation avec une configuration plus large
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'data-*']
  });

  // Réessayer après un délai pour les chargements dynamiques
  const maxRetries = 3;
  let retryCount = 0;

  retryInterval = setInterval(() => {
    if (retryCount >= maxRetries) {
      clearInterval(retryInterval);
      return;
    }

    boundSafeAddCopyButtons();
    retryCount++;
  }, 1500);

  // Écouter les événements de navigation dans l'interface Shopify
  window.addEventListener('popstate', boundSafeAddCopyButtons);
  document.addEventListener('click', boundClickHandler);
}

function enableFeature() {
  if (isEnabled) return;
  isEnabled = true;
  ensureStyleInjected();
  init();
}

function disableFeature() {
  if (!isEnabled) return;
  isEnabled = false;
  try {
    if (observer) {
      observer.takeRecords(); // discard any pending mutation records
      observer.disconnect();
      observer = null;
    }
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    if (boundSafeAddCopyButtons) {
      window.removeEventListener('popstate', boundSafeAddCopyButtons);
      boundSafeAddCopyButtons = null;
    }
    if (boundClickHandler) {
      document.removeEventListener('click', boundClickHandler);
      boundClickHandler = null;
    }
  } catch (e) {}
  removeCopyButtons();
}

// Read initial setting and listen for changes
chrome.storage.sync.get(['isExtensionActive'], (result) => {
  const active = result.isExtensionActive !== undefined ? result.isExtensionActive : true;
  if (active) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enableFeature);
    } else {
      enableFeature();
    }
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.isExtensionActive) {
    const newVal = changes.isExtensionActive.newValue;
    if (newVal) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableFeature, { once: true });
      } else {
        enableFeature();
      }
    } else {
      disableFeature();
    }
  }
});
