export function copyFormat(showAlert = false) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedElement = range.startContainer.parentElement;

    const computedStyle = window.getComputedStyle(selectedElement);
    const format = {
      fontFamily: computedStyle.fontFamily,
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
      fontWeight: computedStyle.fontWeight,
      fontStyle: computedStyle.fontStyle,
      textDecoration: computedStyle.textDecoration,
      backgroundColor: computedStyle.backgroundColor
    };

    sessionStorage.setItem('copiedFormat', JSON.stringify(format));
    if (showAlert) {
      alert('Formatting copied!');
    }
  } else {
    alert('No text selected!');
  }
}

export function applyFormat(showAlert = false) {
  const format = JSON.parse(sessionStorage.getItem('copiedFormat'));
  if (!format) {
    alert('No format copied!');
    return;
  }

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer;
      const parentElement = textNode.parentElement;

      const text = textNode.nodeValue;
      const beforeText = text.substring(0, range.startOffset);
      const selectedText = text.substring(range.startOffset, range.endOffset);
      const afterText = text.substring(range.endOffset);

      if (beforeText) {
        parentElement.insertBefore(document.createTextNode(beforeText), textNode);
      }

      if (selectedText) {
        const span = document.createElement('span');
        span.textContent = selectedText;
        for (const [key, value] of Object.entries(format)) {
          span.style[key] = value;
        }
        parentElement.insertBefore(span, textNode);
      }

      if (afterText) {
        parentElement.insertBefore(document.createTextNode(afterText), textNode);
      }

      parentElement.removeChild(textNode);
    } else {
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) =>
            range.intersectsNode(node) && node.nodeValue.trim() !== ''
        }
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((textNode) => {
        const parentElement = textNode.parentElement;

        const text = textNode.nodeValue;
        const startOffset = textNode === range.startContainer ? range.startOffset : 0;
        const endOffset = textNode === range.endContainer ? range.endOffset : text.length;

        const beforeText = text.substring(0, startOffset);
        const selectedText = text.substring(startOffset, endOffset);
        const afterText = text.substring(endOffset);

        if (beforeText) {
          parentElement.insertBefore(document.createTextNode(beforeText), textNode);
        }

        if (selectedText) {
          const span = document.createElement('span');
          span.textContent = selectedText;
          for (const [key, value] of Object.entries(format)) {
            span.style[key] = value;
          }
          parentElement.insertBefore(span, textNode);
        }

        if (afterText) {
          parentElement.insertBefore(document.createTextNode(afterText), textNode);
        }

        parentElement.removeChild(textNode);
      });
    }

    if (showAlert) {
      alert('Formatting applied to selected text!');
    }
  } else {
    alert('No text selected!');
  }
}
