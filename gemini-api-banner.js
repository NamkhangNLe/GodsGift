export function maybeShowApiKeyBanner(key) {
  if (key === 'TODO') {
    let banner = document.createElement('div');
    banner.className = 'api-key-banner';
    banner.innerHTML = `
      To get started with Gemini,
      <a href="https://makersuite.google.com/app/apikey" target="_blank">
      get an API key</a> (Ctrl+Click) and enter it at the top of
      <code>main.js</code>`;
    document.body.prepend(banner);
  }
}