const copyButton = document.getElementById('copy-format');
const applyButton = document.getElementById('apply-format');
const statusElement = document.getElementById('status');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function setBusyState(isBusy) {
  copyButton.disabled = isBusy;
  applyButton.disabled = isBusy || applyButton.dataset.hasFormat !== 'true';
}

async function refreshApplyAvailability() {
  const { copiedFormat } = await chrome.storage.session.get('copiedFormat');
  const hasFormat =
    !!copiedFormat &&
    typeof copiedFormat === 'object' &&
    Object.values(copiedFormat).every((value) => typeof value === 'string' && value.trim() !== '');

  applyButton.dataset.hasFormat = hasFormat ? 'true' : 'false';
  applyButton.disabled = !hasFormat;
}

function getActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!tabs[0]?.id) {
        reject(new Error('Open Gmail and try again.'));
        return;
      }

      resolve(tabs[0].id);
    });
  });
}

function sendCommand(type, tabId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, tabId }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error('No response was returned.'));
        return;
      }

      resolve(response);
    });
  });
}

async function runAction(type) {
  setBusyState(true);

  try {
    const tabId = await getActiveTabId();
    const result = await sendCommand(type, tabId);
    setStatus(result.message, !result.ok);
  } catch (error) {
    setStatus(error.message || 'The action failed.', true);
  } finally {
    await refreshApplyAvailability();
    setBusyState(false);
  }
}

copyButton.addEventListener('click', () => {
  runAction('copy-format');
});

applyButton.addEventListener('click', () => {
  runAction('apply-format');
});

refreshApplyAvailability()
  .then(() => {
    setStatus('Open Gmail, select text in a compose window, then copy or apply formatting.');
  })
  .catch(() => {
    setStatus('Open Gmail and try again.', true);
  });
