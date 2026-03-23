import { bangs } from "./bang";
import "./global.css";

// Types
interface CustomBang {
  t: string; // trigger
  s: string; // name/description
  u: string; // url template
  d: string; // domain
}

// Custom bangs management
class CustomBangsManager {
  private static STORAGE_KEY = "custom-bangs";
  private static DEFAULT_BANG_KEY = "default-bang";

  static getCustomBangs(): CustomBang[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static saveCustomBangs(customBangs: CustomBang[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customBangs));
  }

  static addCustomBang(bang: CustomBang): void {
    const customBangs = this.getCustomBangs();
    const existingIndex = customBangs.findIndex(b => b.t === bang.t);
    
    if (existingIndex >= 0) {
      customBangs[existingIndex] = bang;
    } else {
      customBangs.push(bang);
    }
    
    this.saveCustomBangs(customBangs);
  }

  static removeCustomBang(trigger: string): void {
    const customBangs = this.getCustomBangs().filter(b => b.t !== trigger);
    this.saveCustomBangs(customBangs);
  }

  static getDefaultBang(): string {
    return localStorage.getItem(this.DEFAULT_BANG_KEY) ?? "g";
  }

  static setDefaultBang(trigger: string): void {
    localStorage.setItem(this.DEFAULT_BANG_KEY, trigger);
  }

  static getAllBangs(): (CustomBang | typeof bangs[0])[] {
    return [...this.getCustomBangs(), ...bangs];
  }
}

function renderSettingsUI() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const customBangs = CustomBangsManager.getCustomBangs();
  const defaultBang = CustomBangsManager.getDefaultBang();

  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
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

        <div class="settings-section">
          <h2>Settings</h2>
          
          <div class="setting-group">
            <label for="default-bang-select">Default Search Engine:</label>
            <select id="default-bang-select" class="setting-input">
              <option value="g" ${defaultBang === "g" ? "selected" : ""}>Google (g)</option>
              <option value="ddg" ${defaultBang === "ddg" ? "selected" : ""}>DuckDuckGo (ddg)</option>
              <option value="b" ${defaultBang === "b" ? "selected" : ""}>Bing (b)</option>
              <option value="y" ${defaultBang === "y" ? "selected" : ""}>Yahoo (y)</option>
              ${customBangs.map(bang => 
                `<option value="${bang.t}" ${defaultBang === bang.t ? "selected" : ""}>${bang.s} (${bang.t})</option>`
              ).join("")}
            </select>
          </div>

          <div class="setting-group">
            <h3>Custom Bangs</h3>
            <div class="custom-bangs-list">
              ${customBangs.length === 0 ? 
                '<p class="no-bangs">No custom bangs yet. Add one below!</p>' :
                customBangs.map(bang => `
                  <div class="custom-bang-item">
                    <div class="bang-info">
                      <strong>!${bang.t}</strong> - ${bang.s}
                      <div class="bang-url">${bang.u}</div>
                    </div>
                    <button class="delete-bang-btn" data-trigger="${bang.t}">Delete</button>
                  </div>
                `).join("")
              }
            </div>
            
            <div class="add-bang-form">
              <h4>Add Custom Bang</h4>
              <div class="form-row">
                <input type="text" id="bang-trigger" placeholder="Trigger (e.g., 'gh')" class="form-input" />
                <input type="text" id="bang-name" placeholder="Name (e.g., 'GitHub')" class="form-input" />
              </div>
              <input type="text" id="bang-url" placeholder="URL template (use %s for search term)" class="form-input full-width" />
              <button id="add-bang-btn" class="primary-button">Add Bang</button>
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

  setupEventListeners();
}

function setupEventListeners() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  
  // Copy button functionality
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

  // Default bang selection
  const defaultBangSelect = app.querySelector<HTMLSelectElement>("#default-bang-select")!;
  defaultBangSelect.addEventListener("change", () => {
    CustomBangsManager.setDefaultBang(defaultBangSelect.value);
  });

  // Add custom bang
  const addBangBtn = app.querySelector<HTMLButtonElement>("#add-bang-btn")!;
  const triggerInput = app.querySelector<HTMLInputElement>("#bang-trigger")!;
  const nameInput = app.querySelector<HTMLInputElement>("#bang-name")!;
  const urlInput2 = app.querySelector<HTMLInputElement>("#bang-url")!;

  addBangBtn.addEventListener("click", () => {
    const trigger = triggerInput.value.trim().toLowerCase();
    const name = nameInput.value.trim();
    const url = urlInput2.value.trim();

    if (!trigger || !name || !url) {
      alert("Please fill in all fields");
      return;
    }

    if (!url.includes("%s")) {
      alert("URL must contain %s placeholder for search terms");
      return;
    }

    const domain = new URL(url.replace("%s", "test")).hostname;

    CustomBangsManager.addCustomBang({
      t: trigger,
      s: name,
      u: url,
      d: domain
    });

    // Refresh the UI
    renderSettingsUI();
  });

  // Delete custom bangs
  app.querySelectorAll(".delete-bang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger!;
      if (confirm(`Delete custom bang !${trigger}?`)) {
        CustomBangsManager.removeCustomBang(trigger);
        renderSettingsUI();
      }
    });
  });
}

function getBangRedirectUrl(): string | null {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  
  if (!query) {
    renderSettingsUI();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  
  // Check custom bangs first, then default bangs
  const allBangs = CustomBangsManager.getAllBangs();
  const selectedBang = bangCandidate 
    ? allBangs.find((b) => b.t === bangCandidate)
    : allBangs.find((b) => b.t === CustomBangsManager.getDefaultBang());

  // If we have a bang candidate but no matching bang found, use default search with full query
  if (bangCandidate && !selectedBang) {
    const defaultBang = allBangs.find((b) => b.t === CustomBangsManager.getDefaultBang());
    if (defaultBang) {
      // Use the entire query (including the invalid bang) as the search term
      let searchUrl = defaultBang.u;
      if (searchUrl.includes("%s")) {
        searchUrl = searchUrl.replace("%s", encodeURIComponent(query).replace(/%2F/g, "/"));
      } else if (searchUrl.includes("{{{s}}}")) {
        searchUrl = searchUrl.replace("{{{s}}}", encodeURIComponent(query).replace(/%2F/g, "/"));
      }
      return searchUrl;
    }
  }

  if (!selectedBang) return null;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just a bang (e.g., `!gh`), go to the domain
  if (cleanQuery === "") {
    return selectedBang ? `https://${selectedBang.d}` : null;
  }

  // Replace the search placeholder with the actual query
  // Handle both %s (for custom bangs) and {{{s}}} (for default bangs)
  let searchUrl = selectedBang.u;
  if (searchUrl.includes("%s")) {
    searchUrl = searchUrl.replace("%s", encodeURIComponent(cleanQuery).replace(/%2F/g, "/"));
  } else if (searchUrl.includes("{{{s}}}")) {
    searchUrl = searchUrl.replace("{{{s}}}", encodeURIComponent(cleanQuery).replace(/%2F/g, "/"));
  }

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangRedirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
