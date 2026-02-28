export function init() {}

export function render() {
  const container = document.getElementById('saved-list');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-icon">pin_drop</span>
      <p>No saved locations</p>
      <p class="empty-hint">Add pins from the map screen</p>
    </div>
  `;
}
