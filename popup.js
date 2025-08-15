import { copyFormat, applyFormat } from './format.js';

document.getElementById('copy-format').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: copyFormat,
      args: [true]
    });
  });
});

document.getElementById('apply-format').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: applyFormat,
      args: [true]
    });
  });
});
