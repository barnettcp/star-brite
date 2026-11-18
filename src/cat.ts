import { validateConstellation } from './core/constellation';

type CatMode = 'star' | 'edge' | 'delete';

type CatStar = {
  id: string;
  x: number;
  y: number;
  size: number;
};

type CatState = {
  constellationName: string;
  constellationId: string;
  aiGenerated: boolean;
  stars: CatStar[];
  edges: Array<[string, string]>;
  mode: CatMode;
  selectedStarId: string | null;
  selectedEdgeKey: string | null;
  pendingEdgeStart: string | null;
};

function createBlankState(): CatState {
  return {
    constellationName: 'Untitled constellation',
    constellationId: 'untitled-constellation',
    aiGenerated: false,
    stars: [],
    edges: [],
    mode: 'star',
    selectedStarId: null,
    selectedEdgeKey: null,
    pendingEdgeStart: null,
  };
}

const starterState: CatState = createBlankState();

function clampGridValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createNewStarId(stars: CatStar[]): string {
  let candidate = 1;
  while (stars.some((star) => star.id === `k${candidate}`)) {
    candidate += 1;
  }
  return `k${candidate}`;
}

function pairKey(left: string, right: string): string {
  return [left, right].sort().join('::');
}

function describeStarLocation(star: CatStar): string {
  return `${star.x}, ${star.y}`;
}

function getEditorStarDisplaySize(size: number): number {
  return Math.max(8, 2.5 + size * 8);
}

function getValidationIssues(state: CatState): string[] {
  try {
    validateConstellation({
      id: state.constellationId,
      name: state.constellationName,
      aiGenerated: state.aiGenerated,
      stars: state.stars,
      edges: state.edges,
    });
    return [];
  } catch (error) {
    if (error instanceof Error) {
      return [error.message];
    }
    return ['Constellation is invalid.'];
  }
}

function buildEdgePath(edge: [string, string], stars: CatStar[]): string {
  const [fromId, toId] = edge;
  const from = stars.find((star) => star.id === fromId);
  const to = stars.find((star) => star.id === toId);
  if (!from || !to) {
    return '';
  }

  const startMargin = 2.0;
  const endMargin = 2.0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;

  const shortenedFrom = { x: from.x + nx * startMargin, y: from.y + ny * startMargin };
  const shortenedTo = { x: to.x - nx * endMargin, y: to.y - ny * endMargin };

  return `M ${shortenedFrom.x} ${shortenedFrom.y} L ${shortenedTo.x} ${shortenedTo.y}`;
}

export function renderConstellationAuthoringTool(root: HTMLElement): void {
  let state: CatState = structuredClone(starterState);

  function render(): void {
    const selectedStar = state.stars.find((star) => star.id === state.selectedStarId) ?? null;
    const selectedEdge = state.selectedEdgeKey ? state.edges.find(([from, to]) => pairKey(from, to) === state.selectedEdgeKey) ?? null : null;
    const validationIssues = getValidationIssues(state);
    const isValid = validationIssues.length === 0;
    const validationSummary = isValid ? 'Valid constellation' : `${validationIssues.length} validation issue${validationIssues.length === 1 ? '' : 's'}`;
    const validationStateClass = isValid ? 'ok' : 'warning';
    const canExport = isValid;

    const listTitle = state.mode === 'edge' ? 'Edges' : 'Stars';
    const listItems = state.mode === 'edge'
      ? state.edges.length === 0
        ? '<li class="placeholder">No edges yet.</li>'
        : state.edges
            .map(([from, to]) => `
              <li class="${state.selectedEdgeKey === pairKey(from, to) ? 'selected' : ''}" data-edge-key="${pairKey(from, to)}">
                <span>${from} → ${to}</span>
              </li>
            `)
            .join('')
      : state.stars.length === 0
        ? '<li class="placeholder">No stars yet.</li>'
        : state.stars
            .map(
              (star) => `
                <li class="${state.selectedStarId === star.id ? 'selected' : ''}" data-star-id="${star.id}">
                  <span>${star.id}</span>
                  <span>${describeStarLocation(star)}</span>
                </li>
              `,
            )
            .join('');

    root.innerHTML = `
      <div class="cat-tool" aria-label="Constellation authoring tool">
        <header class="cat-header">
          <div>
            <p class="cat-kicker">Dev tool</p>
            <h1>CAT — Constellation Authoring Tool</h1>
          </div>
          <div class="cat-header-actions">
            <button type="button" class="cat-button secondary" data-action="new">New</button>
            <button type="button" class="cat-button secondary" data-action="load">Load</button>
            <button type="button" class="cat-button primary" data-action="save" ${canExport ? '' : 'disabled'}>Save</button>
          </div>
        </header>

        <div class="cat-layout">
          <aside class="cat-panel">
            <div class="cat-panel-section">
              <h2>Tools</h2>
              <div class="cat-toolbar" aria-label="Constellation editing tools">
                <button type="button" class="cat-tool-button ${state.mode === 'star' ? 'active' : ''}" data-mode="star">Star</button>
                <button type="button" class="cat-tool-button ${state.mode === 'edge' ? 'active' : ''}" data-mode="edge">Edge</button>
                <button type="button" class="cat-tool-button ${state.mode === 'delete' ? 'active' : ''}" data-mode="delete">Delete</button>
              </div>
            </div>

            <div class="cat-panel-section">
              <h2>Constellation</h2>
              <label class="cat-field">
                <span>Name</span>
                <input type="text" value="${state.constellationName}" data-field="constellationName" />
              </label>
              <label class="cat-field">
                <span>ID</span>
                <input type="text" value="${state.constellationId}" data-field="constellationId" />
              </label>
              <label class="cat-field checkbox-field">
                <input type="checkbox" ${state.aiGenerated ? 'checked' : ''} data-field="aiGenerated" />
                <span>AI generated</span>
              </label>
            </div>

            <div class="cat-panel-section">
              <h2>${listTitle}</h2>
              <ul class="cat-star-list">
                ${listItems}
              </ul>
            </div>
          </aside>

          <main class="cat-editor-panel">
            <div class="cat-editor-surface" aria-label="Constellation grid editor">
              <div class="cat-grid" aria-hidden="true"></div>
              ${state.stars
                .map(
                  (star) => `
                    <button
                      type="button"
                      class="cat-star ${state.selectedStarId === star.id ? 'selected' : ''}"
                      data-star-id="${star.id}"
                      style="left: ${star.x}%; top: ${star.y}%; --display-star-size: ${getEditorStarDisplaySize(star.size)}px;"
                      aria-label="Edit star ${star.id}"
                    ></button>
                  `,
                )
                .join('')}
              <svg class="cat-edge-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                ${state.edges
                  .map((edge) => {
                    const key = pairKey(edge[0], edge[1]);
                    return `<path d="${buildEdgePath(edge, state.stars)}" data-edge-key="${key}" class="${state.selectedEdgeKey === key ? 'selected' : ''}"></path>`;
                  })
                  .join('')}
              </svg>
            </div>
          </main>

          <aside class="cat-panel">
            <div class="cat-panel-section">
              <h2>${selectedEdge ? 'Selected edge' : selectedStar ? 'Selected star' : 'Selection'}</h2>
              ${selectedEdge
                ? `
                  <div class="cat-selection-summary">
                    <span>${selectedEdge[0]}</span>
                    <span class="selection-arrow">→</span>
                    <span>${selectedEdge[1]}</span>
                  </div>
                  <div class="cat-inline-actions">
                    <button type="button" class="cat-button secondary" data-action="delete-selected-edge">Delete edge</button>
                  </div>
                `
                : selectedStar
                  ? `
                    <div class="cat-field-row">
                      <label class="cat-field">
                        <span>X</span>
                        <input type="number" min="0" max="100" value="${selectedStar.x}" data-selected-field="x" />
                      </label>
                      <label class="cat-field">
                        <span>Y</span>
                        <input type="number" min="0" max="100" value="${selectedStar.y}" data-selected-field="y" />
                      </label>
                    </div>
                    <label class="cat-field">
                      <span>Size</span>
                      <input type="number" min="0.5" max="5" step="0.5" value="${selectedStar.size}" data-selected-field="size" />
                    </label>
                    <label class="cat-field">
                      <span>ID</span>
                      <input type="text" value="${selectedStar.id}" data-selected-field="id" />
                    </label>
                    <div class="cat-inline-actions">
                      <button type="button" class="cat-button secondary" data-action="delete-selected-star">Delete star</button>
                    </div>
                  `
                  : `
                    <div class="cat-status">No selection</div>
                  `}
            </div>

            <div class="cat-panel-section">
              <h2>Validation</h2>
              <div class="cat-status ${validationStateClass}">${validationSummary}</div>
              <ul class="cat-validation-list">
                ${validationIssues.length === 0
                  ? `
                    <li>${state.stars.length} stars</li>
                    <li>${state.edges.length} edges</li>
                    <li>All star ids unique</li>
                  `
                  : validationIssues.map((issue) => `<li>${issue}</li>`).join('')}
              </ul>
            </div>

            <div class="cat-panel-section">
              <h2>JSON</h2>
              <pre class="cat-preview">${JSON.stringify(
                {
                  id: state.constellationId,
                  name: state.constellationName,
                  aiGenerated: state.aiGenerated,
                  stars: state.stars,
                  edges: state.edges,
                },
                null,
                2,
              )}</pre>
            </div>
          </aside>
        </div>
      </div>
    `;

    const toolButtons = root.querySelectorAll<HTMLButtonElement>('[data-mode]');
    toolButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextMode = button.dataset.mode as CatMode;
        state = { ...state, mode: nextMode, pendingEdgeStart: nextMode === 'edge' ? state.pendingEdgeStart : null };
        if (nextMode === 'edge') {
          state.selectedEdgeKey = null;
        } else {
          state.selectedEdgeKey = null;
          state.pendingEdgeStart = null;
        }
        render();
      });
    });

    const fieldMap: Record<string, 'constellationName' | 'constellationId' | 'aiGenerated'> = {
      constellationName: 'constellationName',
      constellationId: 'constellationId',
      aiGenerated: 'aiGenerated',
    };

    const syncJsonPreview = (): void => {
      const preview = root.querySelector<HTMLPreElement>('.cat-preview');
      if (!preview) {
        return;
      }
      preview.textContent = JSON.stringify(
        {
          id: state.constellationId,
          name: state.constellationName,
          aiGenerated: state.aiGenerated,
          stars: state.stars,
          edges: state.edges,
        },
        null,
        2,
      );
    };

    Object.entries(fieldMap).forEach(([selector, field]) => {
      const input = root.querySelector<HTMLInputElement>(`[data-field="${selector}"]`);
      if (!input) {
        return;
      }

      const commitField = () => {
        const value = input.type === 'checkbox' ? input.checked : input.value;
        // @ts-expect-error field is a runtime key on state already
        state[field] = value;
        syncJsonPreview();
        render();
      };

      input.addEventListener('input', () => {
        const value = input.type === 'checkbox' ? input.checked : input.value;
        // @ts-expect-error field is a runtime key on state already
        state[field] = value;
        syncJsonPreview();
      });

      input.addEventListener('change', commitField);
      input.addEventListener('blur', commitField);
    });

    const selectedInputs = root.querySelectorAll<HTMLInputElement>('[data-selected-field]');
    selectedInputs.forEach((input) => {
      const commitSelectedInput = () => {
        if (!state.selectedStarId) {
          return;
        }

        const star = state.stars.find((candidate) => candidate.id === state.selectedStarId);
        if (!star) {
          return;
        }

        const field = input.dataset.selectedField;
        if (!field) {
          return;
        }

        if (field === 'id') {
          const nextId = input.value.trim();
          if (!nextId) {
            return;
          }
          const originalId = star.id;
          if (state.stars.some((candidate) => candidate.id === nextId && candidate.id !== originalId)) {
            render();
            return;
          }
          star.id = nextId;
          state.selectedStarId = nextId;
          state.edges = state.edges.map(([from, to]) => {
            if (from === originalId) return [nextId, to];
            if (to === originalId) return [from, nextId];
            return [from, to];
          });
          state.stars = state.stars.map((candidate) => (candidate.id === originalId ? { ...candidate, id: nextId } : candidate));
          syncJsonPreview();
          render();
          return;
        }

        const numericValue = Number(input.value);
        if (Number.isNaN(numericValue)) {
          return;
        }

        if (field === 'x') {
          star.x = clampGridValue(numericValue);
        }
        if (field === 'y') {
          star.y = clampGridValue(numericValue);
        }
        if (field === 'size') {
          star.size = Math.max(0.5, Math.min(5, numericValue));
        }

        syncJsonPreview();
        render();
      };

      input.addEventListener('input', () => {
        if (!state.selectedStarId) {
          return;
        }

        const star = state.stars.find((candidate) => candidate.id === state.selectedStarId);
        if (!star) {
          return;
        }

        const field = input.dataset.selectedField;
        if (!field) {
          return;
        }

        if (field === 'id') {
          const nextId = input.value.trim();
          if (!nextId) {
            return;
          }
          const originalId = star.id;
          if (state.stars.some((candidate) => candidate.id === nextId && candidate.id !== originalId)) {
            return;
          }
          star.id = nextId;
          state.selectedStarId = nextId;
          state.edges = state.edges.map(([from, to]) => {
            if (from === originalId) return [nextId, to];
            if (to === originalId) return [from, nextId];
            return [from, to];
          });
          state.stars = state.stars.map((candidate) => (candidate.id === originalId ? { ...candidate, id: nextId } : candidate));
          syncJsonPreview();
          return;
        }

        const numericValue = Number(input.value);
        if (Number.isNaN(numericValue)) {
          return;
        }

        if (field === 'x') {
          star.x = clampGridValue(numericValue);
        }
        if (field === 'y') {
          star.y = clampGridValue(numericValue);
        }
        if (field === 'size') {
          star.size = Math.max(0.5, Math.min(5, numericValue));
        }

        syncJsonPreview();
      });

      input.addEventListener('change', commitSelectedInput);
      input.addEventListener('blur', commitSelectedInput);
    });

    root.querySelectorAll<HTMLButtonElement>('[data-star-id]').forEach((starButton) => {
      starButton.addEventListener('click', () => {
        const clickedId = starButton.dataset.starId;
        if (!clickedId) {
          return;
        }

        if (state.mode === 'delete') {
          state.stars = state.stars.filter((star) => star.id !== clickedId);
          state.edges = state.edges.filter(([from, to]) => from !== clickedId && to !== clickedId);
          if (state.selectedStarId === clickedId) {
            state.selectedStarId = state.stars[0]?.id ?? null;
          }
          state.selectedEdgeKey = null;
          render();
          return;
        }

        if (state.mode === 'edge') {
          state.selectedEdgeKey = null;
          if (state.pendingEdgeStart === null) {
            state.pendingEdgeStart = clickedId;
            state.selectedStarId = clickedId;
            render();
            return;
          }

          if (state.pendingEdgeStart === clickedId) {
            state.pendingEdgeStart = null;
            state.selectedStarId = clickedId;
            render();
            return;
          }

          const candidate = [state.pendingEdgeStart, clickedId] as [string, string];
          const key = pairKey(candidate[0], candidate[1]);
          const exists = state.edges.some(([from, to]) => pairKey(from, to) === key);
          if (!exists) {
            state.edges = [...state.edges, candidate];
          }
          state.pendingEdgeStart = null;
          state.selectedEdgeKey = key;
          state.selectedStarId = clickedId;
          render();
          return;
        }

        state.selectedEdgeKey = null;
        state.selectedStarId = clickedId;
        render();
      });
    });

    root.querySelectorAll<HTMLLIElement>('[data-edge-key]').forEach((edgeItem) => {
      edgeItem.addEventListener('click', () => {
        const edgeKey = edgeItem.dataset.edgeKey;
        if (!edgeKey) {
          return;
        }

        if (state.mode === 'delete') {
          state.edges = state.edges.filter(([from, to]) => pairKey(from, to) !== edgeKey);
          if (state.selectedEdgeKey === edgeKey) {
            state.selectedEdgeKey = null;
          }
          render();
          return;
        }

        state.selectedEdgeKey = edgeKey;
        state.selectedStarId = null;
        state.pendingEdgeStart = null;
        render();
      });
    });

    root.querySelectorAll<SVGPathElement>('.cat-edge-layer path[data-edge-key]').forEach((edgePath) => {
      edgePath.addEventListener('click', (event) => {
        const edgeKey = edgePath.dataset.edgeKey;
        if (!edgeKey) {
          return;
        }

        event.stopPropagation();

        if (state.mode === 'delete') {
          state.edges = state.edges.filter(([from, to]) => pairKey(from, to) !== edgeKey);
          if (state.selectedEdgeKey === edgeKey) {
            state.selectedEdgeKey = null;
          }
          render();
          return;
        }

        state.selectedEdgeKey = edgeKey;
        state.selectedStarId = null;
        state.pendingEdgeStart = null;
        render();
      });
    });

    const surface = root.querySelector<HTMLDivElement>('.cat-editor-surface');
    if (surface) {
      surface.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-star-id]')) {
          return;
        }

        if (state.mode !== 'star') {
          return;
        }

        const rect = surface.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
        const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
        const nextX = clampGridValue(x);
        const nextY = clampGridValue(y);

        const nextStar: CatStar = {
          id: createNewStarId(state.stars),
          x: nextX,
          y: nextY,
          size: 2.0,
        };
        state.stars = [...state.stars, nextStar];
        state.selectedStarId = nextStar.id;
        render();
      });
    }

    const actionButtons = root.querySelectorAll<HTMLButtonElement>('[data-action]');
    actionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'new') {
          state = createBlankState();
          render();
          return;
        }

        if (action === 'delete-selected-edge') {
          if (!state.selectedEdgeKey) {
            return;
          }

          state.edges = state.edges.filter(([from, to]) => pairKey(from, to) !== state.selectedEdgeKey);
          state.selectedEdgeKey = null;
          render();
          return;
        }

        if (action === 'delete-selected-star') {
          if (!state.selectedStarId) {
            return;
          }

          const selectedId = state.selectedStarId;
          state.stars = state.stars.filter((star) => star.id !== selectedId);
          state.edges = state.edges.filter(([from, to]) => from !== selectedId && to !== selectedId);
          state.selectedStarId = state.stars[0]?.id ?? null;
          state.selectedEdgeKey = null;
          render();
          return;
        }

        if (action === 'save') {
          const payload = {
            id: state.constellationId,
            name: state.constellationName,
            aiGenerated: state.aiGenerated,
            stars: state.stars,
            edges: state.edges,
          };

          try {
            validateConstellation(payload);
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'This constellation is invalid and cannot be exported.');
            return;
          }

          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = `${state.constellationId}.json`;
          anchor.click();
          URL.revokeObjectURL(objectUrl);
          return;
        }

        if (action === 'load') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(String(reader.result ?? '{}')) as {
                  id?: string;
                  name?: string;
                  aiGenerated?: boolean;
                  stars?: CatStar[];
                  edges?: Array<[string, string]>;
                };
                const nextStars = Array.isArray(parsed.stars) ? parsed.stars : [];
                const nextEdges = Array.isArray(parsed.edges) ? parsed.edges : [];
                state = {
                  constellationId: typeof parsed.id === 'string' ? parsed.id : state.constellationId,
                  constellationName: typeof parsed.name === 'string' ? parsed.name : state.constellationName,
                  aiGenerated: Boolean(parsed.aiGenerated),
                  stars: nextStars,
                  edges: nextEdges,
                  mode: 'star',
                  selectedStarId: nextStars[0]?.id ?? null,
                  selectedEdgeKey: null,
                  pendingEdgeStart: null,
                };
                render();
              } catch {
                window.alert('Unable to load constellation JSON.');
              }
            };
            reader.readAsText(file);
          });
          input.click();
        }
      });
    });

    const grid = root.querySelector<HTMLDivElement>('.cat-grid');
    if (grid) {
      grid.innerHTML = '';
      const cells = Array.from({ length: 100 }, () => {
        const cell = document.createElement('span');
        cell.className = 'cat-grid-cell';
        cell.setAttribute('aria-hidden', 'true');
        return cell;
      });
      grid.append(...cells);
    }

    const selectedStarIndexLabel = root.querySelector('.cat-status');
    if (selectedStarIndexLabel && selectedStar) {
      selectedStarIndexLabel.textContent = `Selected star: ${selectedStar.id}`;
    }
  }

  render();
}
