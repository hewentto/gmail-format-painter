import { copyFormat, applyFormat } from './format.js';

const COPY_MENU_ID = 'copy-format';
const APPLY_MENU_ID = 'apply-format';
const GMAIL_URL_PATTERNS = ['https://mail.google.com/*'];

function isValidFormat(format) {
  if (!format || typeof format !== 'object') {
    return false;
  }

  return Object.values(format).every((value) => typeof value === 'string' && value.trim() !== '');
}

async function executeCommand(tabId, command, args = []) {
  if (!tabId) {
    return { ok: false, message: 'Open Gmail and try again.' };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      function: command,
      args,
    });

    const result = results?.[0]?.result;
    if (!result || typeof result !== 'object') {
      return { ok: false, message: 'The page did not return a valid response.' };
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'The command could not be run on this page.',
    };
  }
}

async function storeCopiedFormat(format) {
  await chrome.storage.session.set({ copiedFormat: format });
}

async function getCopiedFormat() {
  const { copiedFormat } = await chrome.storage.session.get('copiedFormat');
  return isValidFormat(copiedFormat) ? copiedFormat : null;
}

async function handleCopyFormat(tabId) {
  const result = await executeCommand(tabId, copyFormat);

  if (!result.ok) {
    return result;
  }

  if (!isValidFormat(result.format)) {
    return { ok: false, message: 'The selected formatting could not be stored.' };
  }

  await storeCopiedFormat(result.format);
  return { ok: true, message: result.message };
}

async function handleApplyFormat(tabId) {
  const copiedFormat = await getCopiedFormat();
  if (!copiedFormat) {
    return { ok: false, message: 'Copy formatting before applying it.' };
  }

  return executeCommand(tabId, applyFormat, [copiedFormat]);
}

async function setActionFeedback(tabId, result) {
  if (!tabId) {
    return;
  }

  await chrome.action.setBadgeText({ tabId, text: result.ok ? 'OK' : '!' });
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: result.ok ? '#188038' : '#b3261e',
  });

  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: '' });
  }, 3000);
}

function createContextMenus() {
  chrome.contextMenus.create({
    id: COPY_MENU_ID,
    title: 'Copy Format',
    contexts: ['selection'],
    documentUrlPatterns: GMAIL_URL_PATTERNS,
  });

  chrome.contextMenus.create({
    id: APPLY_MENU_ID,
    title: 'Apply Format',
    contexts: ['selection'],
    documentUrlPatterns: GMAIL_URL_PATTERNS,
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    createContextMenus();
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    return;
  }

  const result =
    info.menuItemId === COPY_MENU_ID
      ? await handleCopyFormat(tab.id)
      : info.menuItemId === APPLY_MENU_ID
        ? await handleApplyFormat(tab.id)
        : null;

  if (result) {
    await setActionFeedback(tab.id, result);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== COPY_MENU_ID && message?.type !== APPLY_MENU_ID) {
    return false;
  }

  const handler = message.type === COPY_MENU_ID ? handleCopyFormat : handleApplyFormat;

  handler(message.tabId)
    .then((result) => {
      sendResponse(result);
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        message: error?.message || 'The request failed.',
      });
    });

  return true;
});
