export function renderConstellationAuthoringTool(root: HTMLElement): void {
  root.innerHTML = `
    <div class="cat-tool" aria-label="Constellation authoring tool">
      <header class="cat-header">
        <div>
          <p class="cat-kicker">Dev tool</p>
          <h1>CAT — Constellation Authoring Tool</h1>
        </div>
        <div class="cat-header-actions">
          <button type="button" class="cat-button secondary">Load</button>
          <button type="button" class="cat-button primary">Save</button>
        </div>
      </header>

      <div class="cat-layout">
        <aside class="cat-panel">
          <div class="cat-panel-section">
            <h2>Tools</h2>
            <div class="cat-toolbar" aria-label="Constellation editing tools">
              <button type="button" class="cat-tool-button active">New star</button>
              <button type="button" class="cat-tool-button">Select</button>
              <button type="button" class="cat-tool-button">Edge mode</button>
              <button type="button" class="cat-tool-button">Delete</button>
            </div>
          </div>

          <div class="cat-panel-section">
            <h2>Constellation</h2>
            <label class="cat-field">
              <span>Name</span>
              <input type="text" value="The Kite" />
            </label>
            <label class="cat-field">
              <span>ID</span>
              <input type="text" value="ai-kite" />
            </label>
            <label class="cat-field checkbox-field">
              <input type="checkbox" checked />
              <span>AI generated</span>
            </label>
          </div>

          <div class="cat-panel-section">
            <h2>Stars</h2>
            <ul class="cat-star-list">
              <li class="selected"><span>k1</span><span>50, 10</span></li>
              <li><span>k2</span><span>80, 40</span></li>
              <li><span>k3</span><span>50, 70</span></li>
              <li><span>k4</span><span>20, 40</span></li>
              <li><span>k5</span><span>50, 95</span></li>
            </ul>
          </div>
        </aside>

        <main class="cat-editor-panel">
          <div class="cat-editor-surface" aria-label="Constellation grid editor">
            <div class="cat-grid" aria-hidden="true"></div>
            <div class="cat-star" style="left: 50%; top: 10%; --star-size: 3.2;"></div>
            <div class="cat-star" style="left: 80%; top: 40%; --star-size: 2.1;"></div>
            <div class="cat-star selected" style="left: 50%; top: 70%; --star-size: 2.7;"></div>
            <div class="cat-star" style="left: 20%; top: 40%; --star-size: 1.6;"></div>
            <div class="cat-star" style="left: 50%; top: 95%; --star-size: 1.2;"></div>
            <svg class="cat-edge-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 50 10 L 80 40 L 50 70 L 20 40 L 50 10" />
              <path d="M 50 70 L 50 95" />
            </svg>
          </div>
        </main>

        <aside class="cat-panel">
          <div class="cat-panel-section">
            <h2>Selected star</h2>
            <div class="cat-field-row">
              <label class="cat-field">
                <span>X</span>
                <input type="number" value="50" />
              </label>
              <label class="cat-field">
                <span>Y</span>
                <input type="number" value="70" />
              </label>
            </div>
            <label class="cat-field">
              <span>Size</span>
              <input type="number" min="0.5" max="5" step="0.5" value="2.5" />
            </label>
            <label class="cat-field">
              <span>ID</span>
              <input type="text" value="k3" />
            </label>
          </div>

          <div class="cat-panel-section">
            <h2>Validation</h2>
            <div class="cat-status ok">Ready for authoring</div>
            <ul class="cat-validation-list">
              <li>5 stars</li>
              <li>5 edges</li>
              <li>All star ids unique</li>
            </ul>
          </div>

          <div class="cat-panel-section">
            <h2>JSON</h2>
            <pre class="cat-preview">{
  "id": "ai-kite",
  "name": "The Kite",
  "stars": [...],
  "edges": [["k1", "k2"], ["k2", "k3"], ["k3", "k4"], ["k4", "k1"], ["k3", "k5"]]
}</pre>
          </div>
        </aside>
      </div>
    </div>
  `;

  const grid = root.querySelector<HTMLDivElement>('.cat-grid');
  if (grid) {
    const cells = Array.from({ length: 100 }, (_, index) => {
      const cell = document.createElement('span');
      cell.className = 'cat-grid-cell';
      cell.style.setProperty('--grid-index', String(index));
      return cell;
    });
    grid.append(...cells);
  }
}
