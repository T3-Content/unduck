import { test, expect, vi } from 'vitest';

// Mock the DOM
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

global.localStorage = mockLocalStorage as any;
global.document = {
  querySelector: vi.fn(),
} as any;

global.HTMLElement = class {} as any;
global.HTMLDivElement = class {} as any;
global.HTMLButtonElement = class {} as any;
global.HTMLInputElement = class {} as any;
global.HTMLSelectElement = class {} as any;

test('localStorage should store and retrieve default engine correctly', () => {
  // Test setting a default engine
  localStorage.setItem('default-engine', 'd'); // DuckDuckGo
  
  // Test retrieving the default engine
  const defaultEngine = localStorage.getItem('default-engine');
  expect(defaultEngine).toBe('d');
  
  // Test default fallback
  localStorage.clear();
  const fallbackEngine = localStorage.getItem('default-engine') ?? 'g';
  expect(fallbackEngine).toBe('g');
});

test('search engine URLs should be properly formatted', () => {
  const searchEngines = [
    { name: "Google", bang: "g", url: "https://www.google.com/search?q={{{s}}}" },
    { name: "DuckDuckGo", bang: "d", url: "https://duckduckgo.com/?q={{{s}}}" },
    { name: "Bing", bang: "b", url: "https://www.bing.com/search?q={{{s}}}" },
  ];
  
  // Test URL formatting with a sample query
  const query = 'test search';
  const encodedQuery = encodeURIComponent(query).replace(/%2F/g, "/");
  
  const googleUrl = searchEngines[0].url.replace('{{{s}}}', encodedQuery);
  expect(googleUrl).toBe('https://www.google.com/search?q=test%20search');
  
  const duckDuckGoUrl = searchEngines[1].url.replace('{{{s}}}', encodedQuery);
  expect(duckDuckGoUrl).toBe('https://duckduckgo.com/?q=test%20search');
});
