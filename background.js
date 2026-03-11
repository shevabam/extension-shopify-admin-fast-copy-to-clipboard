
// Context menu
async function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      resolve();
    });
  });
}

async function createActionContextMenus() {
  await removeAllContextMenus();
  
  chrome.contextMenus.create({
    id: "support",
    title: "❤️ " + chrome.i18n.getMessage("contextual_support"),
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "issues",
    title: "🤔 " + chrome.i18n.getMessage("contextual_issues"),
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "github",
    title: "🌐 " + chrome.i18n.getMessage("contextual_github"),
    parentId: "issues",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "reportIssue",
    title: "🐛 " + chrome.i18n.getMessage("contextual_report_issue"),
    parentId: "issues",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "donate",
    title: "🍕 " + chrome.i18n.getMessage("contextual_donate"),
    parentId: "support",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "review",
    title: "🌟 " + chrome.i18n.getMessage("contextual_review"),
    parentId: "support",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "projects",
    title: "🧪 " + chrome.i18n.getMessage("contextual_projects"),
    parentId: "support",
    contexts: ["action"]
  });
}


chrome.runtime.onInstalled.addListener(async () => {
  await createActionContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await createActionContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "github":
      chrome.tabs.create({ url: 'https://github.com/shevabam/extension-shopify-admin-fast-copy-to-clipboard' });
      break;
    case "reportIssue":
      chrome.tabs.create({ url: 'https://github.com/shevabam/extension-shopify-admin-fast-copy-to-clipboard/issues' });
      break;
    case "donate":
      chrome.tabs.create({ url: 'https://buymeacoffee.com/shevabam' });
      break;
    case "review": {
      const isEdge = navigator.userAgent.includes('Edg/');
      const reviewUrl = isEdge
        ? `https://microsoftedge.microsoft.com/addons/detail/${chrome.runtime.id}`
        : `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
      chrome.tabs.create({ url: reviewUrl });
      break;
    }
    case "projects":
      chrome.tabs.create({ url: `https://shevabam.fr` });
      break;
  }
});
