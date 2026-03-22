import { bangs } from "./bang";
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
          <br>
          <p class="customize-link-container">
            <a href="#" class="customize-link">Want to customize the default bang?</a>
          </p>
          <div class="customize-section" style="display: none;">
            <input 
              type="text" 
              class="default-bang-input"
              placeholder="g (default)" 
            />
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
  const customizeLink = app.querySelector<HTMLLinkElement>(".customize-link")!;
  const customizeSection = app.querySelector<HTMLDivElement>(".customize-section")!;
  const defaultBangInput = customizeSection.querySelector<HTMLInputElement>(".default-bang-input")!;
  const customizeLinkContainer = app.querySelector<HTMLParagraphElement>(".customize-link-container")!;
  const originalUrl = urlInput.value;

  customizeLink.addEventListener("click", (e) => {
    e.preventDefault();
    customizeSection.style.display = "block";
    customizeLinkContainer.style.display = "none";
  });

  defaultBangInput.addEventListener("input", () => {
    const defaultBang = defaultBangInput.value.trim();
    if (defaultBang === "") {
      urlInput.value = originalUrl;
    } else {
      urlInput.value = `https://unduck.link?q=%s&default=${defaultBang}`;
    }
  });

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });
}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const urlDefault = url.searchParams.get("default")?.trim() ?? localStorage.getItem("default-bang") ?? "g";
  const defaultBang = bangs.find((b) => b.t === urlDefault);
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
