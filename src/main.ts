import { bangs } from "./bang";
import "./global.css";

const LS_DEFAULT_BANG = "default-bang";
const DEFAULT_BANG_FALLBACK = "g";

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
        <div class="settings-panel">
          <label class="settings-label" for="default-bang-input">Default bang</label>
          <input
            id="default-bang-input"
            class="bang-input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            inputmode="latin"
            placeholder="g"
          />
          <p class="bang-help">Used when a query does not include a bang. Defaults to google</p>
          <p class="bang-error" aria-live="polite"></p>
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
  const defaultBangInput = app.querySelector<HTMLInputElement>("#default-bang-input")!;
  const bangError = app.querySelector<HTMLParagraphElement>(".bang-error")!;
  let validationTimer: number | undefined;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  const validateDefaultBang = () => {
    const candidate = defaultBangInput.value.trim().toLowerCase();

    if (!candidate) {
      bangError.textContent = "Default bang cannot be empty.";
      defaultBangInput.classList.add("invalid");
      return;
    }

    const match = bangs.find((bang) => bang.t === candidate);
    if (!match) {
      bangError.textContent = `No bang found for !${candidate}.`;
      defaultBangInput.classList.add("invalid");
      return;
    }

    bangError.textContent = "";
    defaultBangInput.classList.remove("invalid");
    localStorage.setItem(LS_DEFAULT_BANG, candidate);
  };

  defaultBangInput.value = localStorage.getItem(LS_DEFAULT_BANG) ?? DEFAULT_BANG_FALLBACK;
  defaultBangInput.addEventListener("input", () => {
    window.clearTimeout(validationTimer);
    validationTimer = window.setTimeout(validateDefaultBang, 350);
  });

  validateDefaultBang();
}

const storedDefaultBang = localStorage.getItem(LS_DEFAULT_BANG) ?? DEFAULT_BANG_FALLBACK;
const defaultBang = bangs.find((b) => b.t === storedDefaultBang) ?? bangs.find((b) => b.t === DEFAULT_BANG_FALLBACK);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
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
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
