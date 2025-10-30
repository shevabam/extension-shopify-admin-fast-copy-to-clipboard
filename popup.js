document.addEventListener('DOMContentLoaded', function() {
    localizeHtmlPage();

    const toggleSwitch = document.getElementById('extension-toggle');
    const themeToggleBtn = document.getElementById('theme-toggle');

    chrome.storage.sync.get(['isExtensionActive'], function(result) {
        const isActive = result.isExtensionActive !== undefined ? result.isExtensionActive : true;
        updateUI(isActive);
    });

    toggleSwitch.addEventListener('change', function() {
        const isActive = this.checked;
        chrome.storage.sync.set({ isExtensionActive: isActive }, function() {
            updateUI(isActive);
        });
    });

    function updateUI(isActive) {
        toggleSwitch.checked = isActive;
    }

    // Theme management: use data-theme with storage + system fallback
    if (themeToggleBtn) {
        const getSystemTheme = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        const SUN_SVG = `
            <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>`;

        const MOON_SVG = `
            <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>`;

        const updateThemeButton = (theme) => {
            themeToggleBtn.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
            themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Dark theme' : 'Light theme');
            themeToggleBtn.title = theme === 'dark' ? 'Dark theme' : 'Light theme';
        };

        chrome.storage.sync.get(['popupTheme'], (result) => {
            const hasUserPref = typeof result.popupTheme === 'string';
            const initialTheme = hasUserPref ? result.popupTheme : getSystemTheme();
            applyTheme(initialTheme);
            updateThemeButton(initialTheme);

            // If no user preference, keep following system changes until user picks
            if (!hasUserPref && window.matchMedia) {
                const mq = window.matchMedia('(prefers-color-scheme: dark)');
                const systemListener = (e) => {
                    const theme = e.matches ? 'dark' : 'light';
                    applyTheme(theme);
                    updateThemeButton(theme);
                };
                if (typeof mq.addEventListener === 'function') {
                    mq.addEventListener('change', systemListener);
                } else if (typeof mq.addListener === 'function') {
                    mq.addListener(systemListener);
                }
            }
        });

        themeToggleBtn.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme') || getSystemTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            chrome.storage.sync.set({ popupTheme: next }, () => {
                applyTheme(next);
                updateThemeButton(next);
            });
        });
    }

    function applyTheme(theme) {
        // Set data-theme for CSS variables
        document.body.setAttribute('data-theme', theme);
    }

    const rateButton = document.getElementById('rate-button');
    if (rateButton) {
        rateButton.addEventListener('click', () => {
            const extensionId = chrome.runtime.id;
            const webStoreUrl = `https://chrome.google.com/webstore/detail/${extensionId}/reviews`;
            chrome.tabs.create({ url: webStoreUrl });
        });
    }
});


function localizeHtmlPage() {
    // Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];
  
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });
  
        if(valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
}
