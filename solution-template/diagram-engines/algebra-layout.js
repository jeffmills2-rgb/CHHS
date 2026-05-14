/*
  CHHS Algebra Layout Engine
  Static algebra working layout for worked solutions and marking guides.
*/

function renderAlgebraLayout(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const title = config.title || "";
  const steps = config.steps || [];
  const finalAnswer = config.finalAnswer || "";
  const notes = config.notes || [];

  function esc(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  let html = `
    <div class="algebra-layout">
      ${title ? `<div class="algebra-title">${esc(title)}</div>` : ""}
      <div class="algebra-steps">
  `;

  steps.forEach((step, index) => {
    html += `
      <div class="algebra-row">
        <div class="algebra-line-number">${index + 1}</div>
        <div class="algebra-expression">${step.expression || ""}</div>
        <div class="algebra-reason">${step.reason ? esc(step.reason) : ""}</div>
      </div>
    `;
  });

  html += `
      </div>
      ${finalAnswer ? `<div class="algebra-final">${finalAnswer}</div>` : ""}
  `;

  if (notes.length) {
    html += `<div class="algebra-notes">`;
    notes.forEach(note => {
      html += `<div class="algebra-note">• ${esc(note)}</div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;

  target.innerHTML = html;
}
