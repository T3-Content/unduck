import { bangs } from "./bang";
import "./global.css";

// Default search engines for when no bang is used
const DEFAULT_SEARCH_ENGINES = [
  { name: "Google", value: "google", url: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", value: "duckduckgo", url: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "DuckDuckGo HTML", value: "duckduckgo-html", url: "https://html.duckduckgo.com/html/?q={{{s}}}" },
  { name: "Google No AI (udm=14)", value: "google-no-ai", url: "https://www.google.com/search?udm=14&q={{{s}}}" },
  { name: "Kagi", value: "kagi", url: "https://kagi.com/search?q={{{s}}}" },
  { name: "Swisscows", value: "swisscows", url: "https://swisscows.com/web?query={{{s}}}" },
  { name: "Startpage", value: "startpage", url: "https://www.startpage.com/sp/search?query={{{s}}}" },
  { name: "Qwant", value: "qwant", url: "https://www.qwant.com/?q={{{s}}}" },
  { name: "T3 Chat", value: "t3chat", url: "https://www.t3.chat/new?q={{{s}}}" }
];

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
        <div class="button-container">
          <button class="customize-button">
            <img src="/gear.svg" alt="Settings" />
            Customize
          </button>
        </div>
        
        <div class="settings-panel">
          <div class="settings-content">
            <h3>Search Customization</h3>
            <div class="setting-group">
              <label for="default-search-select">Default search engine (when no bang is used):</label>
              <select id="default-search-select" class="search-select">
                ${DEFAULT_SEARCH_ENGINES.map(engine => 
                  `<option value="${engine.value}">${engine.name}</option>`
                ).join('')}
              </select>
              <p class="setting-description">This search engine will be used when you search without a bang (like "!g" or "!gh")</p>
            </div>
          </div>
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
  const customizeButton = app.querySelector<HTMLButtonElement>(".customize-button")!;
  const settingsPanel = app.querySelector<HTMLDivElement>(".settings-panel")!;
  const defaultSearchSelect = app.querySelector<HTMLSelectElement>("#default-search-select")!;

  // Load saved default search engine
  const savedDefaultSearch = localStorage.getItem("default-search-engine") || "google";
  defaultSearchSelect.value = savedDefaultSearch;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  customizeButton.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
    customizeButton.classList.toggle("active");
  });

  defaultSearchSelect.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    localStorage.setItem("default-search-engine", target.value);
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  
  if (bangCandidate) {
    // Bang detected - use existing logic
    const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;
    
    // Remove the first bang from the query
    const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

    // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
    if (cleanQuery === "")
      return selectedBang ? `https://${selectedBang.d}` : null;

    // Format of the url is:
    // https://www.google.com/search?q={{{s}}}
    const searchUrl = selectedBang?.u.replace(
      "{{{s}}}",
      // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
    );
    if (!searchUrl) return null;

    return searchUrl;
  } else {
    // No bang detected - use default search engine
    const defaultSearchEngine = localStorage.getItem("default-search-engine") || "google";
    const engine = DEFAULT_SEARCH_ENGINES.find(e => e.value === defaultSearchEngine);
    
    if (!engine) return null;
    
    return engine.url.replace("{{{s}}}", encodeURIComponent(query));
  }
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
