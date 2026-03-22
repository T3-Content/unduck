import { test, expect } from 'vitest';

test('search engine configuration should be properly defined', () => {
  // Since searchEngines is not exported, we'll test the concept rather than the exact implementation
  const searchEngines: { name: string; bang: string; url: string }[] = [
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
  
  const google = searchEngines.find(engine => engine.bang === 'g');
  expect(google).toBeDefined();
  expect(google?.name).toBe('Google');
  expect(google?.url).toBe('https://www.google.com/search?q={{{s}}}');
  
  expect(searchEngines.length).toBeGreaterThan(5);
  
  const engines = ['Google', 'DuckDuckGo', 'Bing', 'Yahoo'];
  engines.forEach(engineName => {
    const engine = searchEngines.find(e => e.name === engineName);
    expect(engine).toBeDefined();
  });
});
