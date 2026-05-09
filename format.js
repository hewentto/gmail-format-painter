export function copyFormat() {
  const FORMAT_KEYS = [
    'fontFamily',
    'fontSize',
    'color',
    'fontWeight',
    'fontStyle',
    'textDecoration',
    'backgroundColor',
  ];

  const getElementFromNode = (node) => {
    if (!node) {
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return node;
    }

    return node.parentElement;
  };

  const getComposeRoot = (node) => {
    const element = getElementFromNode(node);

    if (!element) {
      return null;
    }

    return element.closest(
      'div[g_editable="true"][contenteditable="true"], div[role="textbox"][g_editable="true"], div[aria-label="Message Body"][contenteditable="true"]'
    );
  };

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || selection.toString().trim() === '') {
    return { ok: false, message: 'Select text in a Gmail compose window first.' };
  }

  const range = selection.getRangeAt(0);
  const startComposeRoot = getComposeRoot(range.startContainer);
  const endComposeRoot = getComposeRoot(range.endContainer);

  if (!startComposeRoot || !endComposeRoot || startComposeRoot !== endComposeRoot) {
    return { ok: false, message: 'Select text inside a single Gmail compose window.' };
  }

  const selectedElement = getElementFromNode(range.startContainer);
  if (!selectedElement) {
    return { ok: false, message: 'Unable to read formatting from the selected text.' };
  }

  const computedStyle = window.getComputedStyle(selectedElement);
  const format = FORMAT_KEYS.reduce((accumulator, key) => {
    const value = computedStyle[key];

    if (!value) {
      return accumulator;
    }

    if (key === 'backgroundColor' && (value === 'rgba(0, 0, 0, 0)' || value === 'transparent')) {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});

  if (Object.keys(format).length === 0) {
    return { ok: false, message: 'The selected text does not have reusable formatting.' };
  }

  return {
    ok: true,
    message: 'Formatting copied.',
    format,
  };
}

export function applyFormat(format) {
  const FORMAT_KEYS = new Set([
    'fontFamily',
    'fontSize',
    'color',
    'fontWeight',
    'fontStyle',
    'textDecoration',
    'backgroundColor',
  ]);
  const BLOCK_SELECTOR = 'div, p, li, blockquote, table, tr, td, th, ul, ol';

  const getElementFromNode = (node) => {
    if (!node) {
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return node;
    }

    return node.parentElement;
  };

  const getComposeRoot = (node) => {
    const element = getElementFromNode(node);

    if (!element) {
      return null;
    }

    return element.closest(
      'div[g_editable="true"][contenteditable="true"], div[role="textbox"][g_editable="true"], div[aria-label="Message Body"][contenteditable="true"]'
    );
  };

  const getFormattingBlock = (node, composeRoot) => {
    const element = getElementFromNode(node);

    if (!element || !composeRoot) {
      return null;
    }

    return element.closest(BLOCK_SELECTOR) || composeRoot;
  };

  const safeFormat =
    format && typeof format === 'object'
      ? Object.entries(format).reduce((accumulator, [key, value]) => {
          if (!FORMAT_KEYS.has(key) || typeof value !== 'string' || value.trim() === '') {
            return accumulator;
          }

          accumulator[key] = value;
          return accumulator;
        }, {})
      : null;

  if (!safeFormat || Object.keys(safeFormat).length === 0) {
    return { ok: false, message: 'Copy formatting before applying it.' };
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || selection.toString().trim() === '') {
    return { ok: false, message: 'Select text in a Gmail compose window first.' };
  }

  const range = selection.getRangeAt(0);
  const startComposeRoot = getComposeRoot(range.startContainer);
  const endComposeRoot = getComposeRoot(range.endContainer);

  if (!startComposeRoot || !endComposeRoot || startComposeRoot !== endComposeRoot) {
    return { ok: false, message: 'Select text inside a single Gmail compose window.' };
  }

  if (getFormattingBlock(range.startContainer, startComposeRoot) !== getFormattingBlock(range.endContainer, startComposeRoot)) {
    return { ok: false, message: 'Formatting across multiple paragraphs is not supported yet.' };
  }

  let extractedContent;
  try {
    extractedContent = range.extractContents();
  } catch (error) {
    return { ok: false, message: 'Unable to apply formatting to that selection.' };
  }

  if (!extractedContent || extractedContent.textContent.trim() === '') {
    return { ok: false, message: 'Select text in a Gmail compose window first.' };
  }

  const wrapper = document.createElement('span');
  Object.entries(safeFormat).forEach(([key, value]) => {
    wrapper.style[key] = value;
  });
  wrapper.appendChild(extractedContent);
  range.insertNode(wrapper);

  const updatedRange = document.createRange();
  updatedRange.selectNodeContents(wrapper);
  selection.removeAllRanges();
  selection.addRange(updatedRange);

  return { ok: true, message: 'Formatting applied.' };
}
