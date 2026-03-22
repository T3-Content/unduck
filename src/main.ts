import { bangs } from "./bang";
import "./global.css";
import { Search } from "lucide-react";
import { supabase } from "./supabase";

// Define popular search engines with their bang codes
export const searchEngines = [
  { name: "Google", bang: "g", url: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", bang: "d", url: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "Bing", bang: "b", url: "https://www.bing.com/search?q={{{s}}}" },
  { name: "Yahoo", bang: "y", url: "https://search.yahoo.com/search?p={{{s}}}" },
  { name: "Yandex", bang: "ya", url: "https://yandex.com/search/?text={{{s}}}" },
  { name: "Ecosia", bang: "e", url: "https://www.ecosia.org/search?q={{{s}}}" },
  { name: "Startpage", bang: "sp", url: "https://www.startpage.com/sp/search?query={{{s}}}" },
  { name: "Qwant", bang: "q", url: "https://www.qwant.com/?q={{{s}}}" },
  { name: "Brave", bang: "br", url: "https://search.brave.com/search?q={{{s}}}" },
  { name: "Mojeek", bang: "m", url: "https://www.mojeek.com/search?q={{{s}}}" },
];

export function noSearchDefaultPageRender() {
  const LS_DEFAULT_ENGINE = localStorage.getItem("default-engine") ?? "g";
  
  // Get custom engines from localStorage
  const customEngines = JSON.parse(localStorage.getItem("custom-engines") || "[]");
  
  // Combine built-in and custom engines
  const allEngines = [...searchEngines, ...customEngines];
  
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="main-container">
      <!-- 9-dots menu icon -->
      <button id="menu-button" class="menu-button">
        ⋮⋮⋮
      </button>
      
      <!-- Settings panel (hidden by default) -->
      <div id="settings-panel" class="settings-panel">
        <h2>Settings</h2>
        
        <div class="engine-selector-container">
          <label for="default-engine">Default Search Engine:</label>
          <select id="default-engine" class="engine-selector">
            ${allEngines.map(engine => 
              `<option value="${engine.bang}" ${engine.bang === LS_DEFAULT_ENGINE ? 'selected' : ''}>
                ${engine.name}
              </option>`
            ).join('')}
          </select>
        </div>
        
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="${window.location.origin}?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        
        <div class="custom-engine-container">
          <button id="add-custom-engine" class="add-engine-button">+ Add Custom Search Engine</button>
          <div id="custom-engine-form" class="custom-engine-form">
            <input type="text" id="custom-engine-name" class="custom-engine-input" placeholder="Engine Name (e.g., Wikipedia)">
            <input type="text" id="custom-engine-bang" class="custom-engine-input" placeholder="Bang (e.g., w)">
            <input type="text" id="custom-engine-url" class="custom-engine-input" placeholder="URL (use {{{s}}} for query)">
            <button id="save-custom-engine" class="save-engine-button">Save</button>
            <button id="cancel-custom-engine" class="cancel-engine-button">Cancel</button>
          </div>
        </div>
        
        <p class="bang-info">You can use !bang redirects for any site, e.g., <code>!gh</code> for GitHub.</p>
      </div>

      <div class="content-container">
        <h1 class="main-title">Und*ck</h1>
        <form id="search-form" class="search-form">
          <span class="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </span>
          <input 
            type="text" 
            id="search-input"
            class="search-input"
            placeholder="Search or enter a bang (e.g. !gh t3dotgg)"
          />
          <div id="suggestions-container" class="suggestions-container"></div>
        </form>
      </div>
      
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        •
        <a href="https://x.com/theo" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">source</a>
      </footer>
    </div>
  `;

  const menuButton = app.querySelector<HTMLButtonElement>("#menu-button")!;
  const settingsPanel = app.querySelector<HTMLDivElement>("#settings-panel")!;
  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const engineSelector = app.querySelector<HTMLSelectElement>("#default-engine")!;
  const addCustomEngineButton = app.querySelector<HTMLButtonElement>("#add-custom-engine")!;
  const customEngineForm = app.querySelector<HTMLDivElement>("#custom-engine-form")!;
  const customEngineName = app.querySelector<HTMLInputElement>("#custom-engine-name")!;
  const customEngineBang = app.querySelector<HTMLInputElement>("#custom-engine-bang")!;
  const customEngineUrl = app.querySelector<HTMLInputElement>("#custom-engine-url")!;
  const saveCustomEngineButton = app.querySelector<HTMLButtonElement>("#save-custom-engine")!;
  const cancelCustomEngineButton = app.querySelector<HTMLButtonElement>("#cancel-custom-engine")!;
  const searchForm = app.querySelector<HTMLFormElement>("#search-form")!;
  const searchInput = app.querySelector<HTMLInputElement>("#search-input")!;

  // Update the URL input with the current domain
  urlInput.value = `${window.location.origin}?q=%s`;

  // Add event listener for engine selector
  engineSelector.addEventListener("change", () => {
    localStorage.setItem("default-engine", engineSelector.value);
  });

  // Add copy functionality
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(urlInput.value);
      copyIcon.src = "/check.svg";
      copyButton.classList.add("copied");
      setTimeout(() => {
        copyIcon.src = "/clipboard.svg";
        copyButton.classList.remove("copied");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  });

  // Add custom engine form toggle
  addCustomEngineButton.addEventListener("click", () => {
    customEngineForm.style.display = "block";
    addCustomEngineButton.style.display = "none";
  });

  cancelCustomEngineButton.addEventListener("click", () => {
    customEngineForm.style.display = "none";
    addCustomEngineButton.style.display = "block";
    customEngineName.value = "";
    customEngineBang.value = "";
    customEngineUrl.value = "";
  });

  saveCustomEngineButton.addEventListener("click", () => {
    const name = customEngineName.value.trim();
    const bang = customEngineBang.value.trim();
    const url = customEngineUrl.value.trim();

    if (!name || !bang || !url) {
      alert("Please fill in all fields");
      return;
    }

    if (!url.includes("{{{s}}}")) {
      alert("URL must contain {{{s}}} as a placeholder for the search query");
      return;
    }

    // Get existing custom engines or initialize empty array
    const customEngines = JSON.parse(localStorage.getItem("custom-engines") || "[]");
    
    // Check if bang already exists
    if (customEngines.some((engine: any) => engine.bang === bang) || 
        searchEngines.some(engine => engine.bang === bang)) {
      alert("A search engine with this bang already exists");
      return;
    }

    // Add new custom engine
    customEngines.push({ name, bang, url });
    localStorage.setItem("custom-engines", JSON.stringify(customEngines));

    // Reset form
    customEngineName.value = "";
    customEngineBang.value = "";
    customEngineUrl.value = "";
    customEngineForm.style.display = "none";
    addCustomEngineButton.style.display = "block";
    
    // Refresh the page to show the new engine
    location.reload();
  });

  // Add menu toggle functionality
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
  });

  // Close settings panel when clicking outside
  document.addEventListener("click", (e) => {
    if (settingsPanel.style.display === "block" && 
        !settingsPanel.contains(e.target as Node) && 
        e.target !== menuButton) {
      settingsPanel.style.display = "none";
    }
  });

  // Add search form submission
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      // Save search to Supabase
      await saveSearchToSupabase(query);
      window.location.href = `?q=${encodeURIComponent(query)}`;
    }
  });

  // Add search input event listener for suggestions
  let debounceTimer: number;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSearchSuggestions(searchInput.value.trim());
    }, 300);
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (settingsPanel.style.display === "block" && 
        !settingsPanel.contains(e.target as Node) && 
        e.target !== menuButton) {
      settingsPanel.style.display = "none";
    }
    
    const suggestionsContainer = document.getElementById("suggestions-container");
    if (suggestionsContainer && suggestionsContainer.style.display !== "none" &&
        !searchForm.contains(e.target as Node)) {
      suggestionsContainer.style.display = "none";
    }
  });
}

// Save search query to Supabase
async function saveSearchToSupabase(query: string) {
  try {
    const { data, error } = await supabase
      .from('searches')
      .insert([{ query, created_at: new Date().toISOString() }]);
    
    if (error) {
      console.error('Error saving search to Supabase:', error);
    }
  } catch (err) {
    console.error('Error saving search to Supabase:', err);
  }
}

// Show search suggestions based on input
async function showSearchSuggestions(input: string) {
  const suggestionsContainer = document.getElementById("suggestions-container");
  if (!suggestionsContainer) return;
  
  if (input.length < 2) {
    suggestionsContainer.style.display = "none";
    return;
  }
  
  try {
    // Search for similar queries in Supabase
    const { data, error } = await supabase
      .from('searches')
      .select('query')
      .ilike('query', `%${input}%`)  // Case-insensitive partial match
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching suggestions:', error);
      suggestionsContainer.style.display = "none";
      return;
    }
    
    if (data && data.length > 0) {
      // Create suggestions list
      suggestionsContainer.innerHTML = data
        .map(item => `<div class="suggestion-item" onclick="document.getElementById('search-input').value='${item.query}'; document.getElementById('suggestions-container').style.display='none'; document.getElementById('search-form').submit();">${item.query}</div>`)
        .join('');
      suggestionsContainer.style.display = "block";
    } else {
      suggestionsContainer.style.display = "none";
    }
  } catch (err) {
    console.error('Error showing suggestions:', err);
    suggestionsContainer.style.display = "none";
  }
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

// Get the default search engine from localStorage
const LS_DEFAULT_ENGINE = localStorage.getItem("default-engine") ?? "g";
// Find the default search engine URL pattern
const defaultEngine = searchEngines.find(engine => engine.bang === LS_DEFAULT_ENGINE) || searchEngines[0];

export function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  
  // Get custom engines from localStorage
  const customEngines = JSON.parse(localStorage.getItem("custom-engines") || "[]");
  
  // Check if the bang is a search engine bang first
  const searchEngine = searchEngines.find(engine => engine.bang === bangCandidate);
  const customEngine = customEngines.find((engine: any) => engine.bang === bangCandidate);
  const selectedBang = bangs.find((b) => b.t === bangCandidate);
  
  // Priority: custom engine > built-in search engine > bang > default engine
  let finalBang;
  if (customEngine) {
    finalBang = { u: customEngine.url };
  } else if (searchEngine) {
    finalBang = { u: searchEngine.url };
  } else if (selectedBang) {
    finalBang = { u: selectedBang.u };
  } else {
    finalBang = { u: defaultEngine.url };
  }

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "") {
    if (customEngine || searchEngine) {
      // For search engines, we still need a query, so we'll return null to show the default page
      noSearchDefaultPageRender();
      return null;
    } else if (selectedBang) {
      return `https://${selectedBang.d}`;
    } else {
      // For default search engine with no query, show the default page
      noSearchDefaultPageRender();
      return null;
    }
  }

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = finalBang.u.replace(
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
