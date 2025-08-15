import { copyFormat, applyFormat } from './format.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "copy-format",
      title: "Copy Format",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "apply-format",
      title: "Apply Format",
      contexts: ["selection"],
    });
  });

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-format") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyFormat
    });
  } else if (info.menuItemId === "apply-format") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: applyFormat
    });
  }
});
