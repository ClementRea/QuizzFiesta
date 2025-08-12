export default () => {
  const apply = (img) => {
    if (!img) return
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy')
    if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async')
  }

  document.querySelectorAll('img').forEach(apply)

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'IMG') apply(node)
          node.querySelectorAll?.('img').forEach(apply)
        }
      })
    }
  })
  mo.observe(document.documentElement, { childList: true, subtree: true })
}
