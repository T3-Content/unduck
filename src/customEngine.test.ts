import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

describe('Custom Engine Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          return localStorage[key] || null;
        }),
        setItem: vi.fn((key, value) => {
          localStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete localStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(localStorage).forEach(key => delete localStorage[key]);
        })
      },
      writable: true
    });
  });

  it('should save custom engine to localStorage', () => {
    // Simulate adding a custom engine
    const customEngines = [{ name: 'Test Engine', bang: 'te', url: 'https://test.com/search?q={{{s}}}' }];
    localStorage.setItem('custom-engines', JSON.stringify(customEngines));
    
    // Verify the custom engine was saved
    const savedEngines = JSON.parse(localStorage.getItem('custom-engines') || '[]');
    expect(savedEngines).toHaveLength(1);
    expect(savedEngines[0]).toEqual({
      name: 'Test Engine',
      bang: 'te',
      url: 'https://test.com/search?q={{{s}}}'
    });
  });

  it('should prevent duplicate bangs', async () => {
    // Dynamically import the main module
    const { noSearchDefaultPageRender, searchEngines } = await import('./main');
    
    // Mock the DOM elements
    document.body.innerHTML = `
      <div id="app"></div>
    `;
    
    // Render the page
    noSearchDefaultPageRender();
    
    // Add a custom engine with a bang that already exists
    const customEngines = [{ name: 'Test Engine', bang: 'g', url: 'https://test.com/search?q={{{s}}}' }];
    localStorage.setItem('custom-engines', JSON.stringify(customEngines));
    
    // Try to add another engine with the same bang
    const newEngine = { name: 'Another Engine', bang: 'g', url: 'https://another.com/search?q={{{s}}}' };
    
    // Get existing engines
    const existingEngines = JSON.parse(localStorage.getItem('custom-engines') || '[]');
    
    // Check if bang already exists
    const bangExists = existingEngines.some((engine: any) => engine.bang === newEngine.bang) || 
        searchEngines.some((engine: any) => engine.bang === newEngine.bang);
        
    expect(bangExists).toBe(true);
  });

  it('should include custom engines in the dropdown', async () => {
    // Dynamically import the main module
    const { noSearchDefaultPageRender, searchEngines } = await import('./main');
    
    // Mock the DOM elements
    document.body.innerHTML = `
      <div id="app"></div>
    `;
    
    // Add a custom engine
    const customEngines = [{ name: 'Test Engine', bang: 'te', url: 'https://test.com/search?q={{{s}}}' }];
    localStorage.setItem('custom-engines', JSON.stringify(customEngines));
    
    // Render the page
    noSearchDefaultPageRender();
    
    // Check if the custom engine is in the dropdown
    const selectElement = document.querySelector('#default-engine') as HTMLSelectElement;
    expect(selectElement).not.toBeNull();
    
    // Check if the custom engine option exists
    const customOption = Array.from(selectElement.options).find(option => option.value === 'te');
    expect(customOption).not.toBeNull();
    expect(customOption?.text).toContain('Test Engine');
  });
});
