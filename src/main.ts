import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://unduck.link?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <div class="setting">
          <span>Default Browser:</span>
          <select id="default-browser-select"></select>
        </div>
      </div>
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        •
        <a href="https://x.com/theo" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Setup default browser select
  const defaultBrowserSelect = document.querySelector<HTMLSelectElement>("#default-browser-select")!;
  const defaultBangs = [
    { name: "Google", bang: "g" },
    { name: "DuckDuckGo", bang: "ddg" },
    { name: "Bing", bang: "b" },
    { name: "Yahoo", bang: "y" },
    { name: "Brave", bang: "brave" },
  ];

  for (const bang of defaultBangs) {
    const option = document.createElement("option");
    option.value = bang.bang;
    option.textContent = bang.name;
    if (bang.bang === LS_DEFAULT_BANG) {
      option.selected = true;
    }
    defaultBrowserSelect.appendChild(option);
  }

  defaultBrowserSelect.addEventListener("change", () => {
    localStorage.setItem("default-bang", defaultBrowserSelect.value);
  });
}

// Searches are handled by the inline script (src/redirect.ts). This module is only the homepage.
if (!new URLSearchParams(location.search).get("q")?.trim()) noSearchDefaultPageRender();
