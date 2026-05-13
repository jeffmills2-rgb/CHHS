/*
  CHHS Integer Number Line Solution Engine
  Static SVG engine for integer missing-value and jump-back-to-zero solutions.
*/

function renderIntegerNumberLineSolution(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 240;

  const xmin = config.xmin ?? -20;
  const xmax = config.xmax ?? 20;
  const tickStep = config.tickStep || 1;
  const labelStep = config.labelStep || 1;

  const marginLeft = config.marginLeft || 58;
  const marginRight = config.marginRight || 58;
  const axisY = config.axisY || 120;

  const usableW = width - marginLeft - marginRight;

  function sx(x) {
    return marginLeft + ((x - xmin) / (xmax - xmin)) * usableW;
  }

  function esc(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function niceNumber(n) {
    if (Math.abs(n) < 1e-9) return "0";
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  }

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="int-nl-svg">
      <defs>
        <style>
          .inl-axis { stroke:#111; stroke-width:2.8; stroke-linecap:round; }
          .inl-tick { stroke:#111; stroke-width:1.5; }
          .inl-major { stroke-width:2.2; }
          .inl-label { font-family:Arial, Helvetica, sans-serif; font-size:15px; fill:#111; }
          .inl-point { fill:#111; stroke:white; stroke-width:1.4; }
          .inl-start { fill:#0b57d0; stroke:white; stroke-width:1.4; }
          .inl-end { fill:#111; stroke:white; stroke-width:1.4; }
          .inl-missing-box { fill:#111827; stroke:#111827; rx:7; ry:7; }
          .inl-missing-text { font-family:Arial, Helvetica, sans-serif; font-size:18px; font-weight:700; fill:white; }
          .inl-jump { stroke:#0b57d0; stroke-width:3; fill:none; stroke-dasharray:8 7; stroke-linecap:round; }
          .inl-jump-label { font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; fill:#0b57d0; }
          .inl-green-label { font-family:Arial, Helvetica, sans-serif; font-size:18px; font-weight:700; fill:#16833a; }
          .inl-note { font-family:Arial, Helvetica, sans-serif; font-size:17px; fill:#111; }
          .inl-title { font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; fill:#111; }
        </style>
      </defs>
  `;

  if (config.title) {
    svg += `<text x="${width / 2}" y="24" text-anchor="middle" class="inl-title">${esc(config.title)}</text>`;
  }

  svg += `<line x1="${marginLeft}" y1="${axisY}" x2="${width - marginRight}" y2="${axisY}" class="inl-axis" />`;

  for (let x = Math.ceil(xmin / tickStep) * tickStep; x <= xmax + 1e-9; x += tickStep) {
    const px = sx(x);
    const major = Math.abs((x / labelStep) - Math.round(x / labelStep)) < 1e-9;
    const tickLength = major ? 24 : 14;

    svg += `<line x1="${px}" y1="${axisY - tickLength / 2}" x2="${px}" y2="${axisY + tickLength / 2}" class="inl-tick ${major ? "inl-major" : ""}" />`;

    if (config.showAllLabels || (config.labels || []).includes(x)) {
      svg += `<text x="${px}" y="${axisY + 42}" text-anchor="middle" class="inl-label">${niceNumber(x)}</text>`;
    }
  }

  // Optional labelled values, useful when only selected numbers are shown.
  (config.valueLabels || []).forEach(label => {
    svg += `<text x="${sx(label.x) + (label.dx || 0)}" y="${axisY + (label.dy ?? 42)}" text-anchor="${label.anchor || "middle"}" class="inl-label">${esc(label.text ?? label.x)}</text>`;
  });

  // Missing value boxes, like the black ? boxes in the assessment.
  (config.missingValues || []).forEach(m => {
    const px = sx(m.x);
    const boxW = m.width || 42;
    const boxH = m.height || 30;
    const y = axisY + (m.dy ?? 32);

    svg += `
      <rect x="${px - boxW / 2}" y="${y - boxH / 2}" width="${boxW}" height="${boxH}" class="inl-missing-box" />
      <text x="${px}" y="${y + 7}" text-anchor="middle" class="inl-missing-text">${esc(m.text || "?")}</text>
    `;
  });

  // Points on the number line.
  (config.points || []).forEach(p => {
    const cls = p.kind === "start" ? "inl-start" : p.kind === "end" ? "inl-end" : "inl-point";
    svg += `<circle cx="${sx(p.x)}" cy="${axisY}" r="${p.r || 6}" class="${cls}" />`;

    if (p.label) {
      svg += `<text x="${sx(p.x) + (p.dx || 0)}" y="${axisY + (p.dy ?? -18)}" text-anchor="${p.anchor || "middle"}" class="inl-label">${esc(p.label)}</text>`;
    }
  });

  // Jump arcs, useful for subtraction and "back to zero" reasoning.
  (config.jumps || []).forEach(j => {
    const x1 = sx(j.from);
    const x2 = sx(j.to);
    const mid = (x1 + x2) / 2;
    const span = Math.abs(x2 - x1);
    const arcHeight = j.height || Math.min(82, Math.max(34, span / 3));
    const above = j.above !== false;
    const sign = above ? -1 : 1;
    const controlY = axisY + sign * arcHeight;

    svg += `<path d="M ${x1} ${axisY} Q ${mid} ${controlY} ${x2} ${axisY}" class="inl-jump" />`;

    if (j.arrow !== false) {
      const dir = j.to >= j.from ? 1 : -1;
      const ax = x2;
      const ay = axisY;
      svg += `
        <path d="
          M ${ax} ${ay}
          l ${-dir * 11} ${above ? -6 : 6}
          M ${ax} ${ay}
          l ${-dir * 11} ${above ? 6 : -6}
        " class="inl-jump" />
      `;
    }

    if (j.label) {
      svg += `<text x="${mid}" y="${controlY + (above ? -12 : 26)}" text-anchor="middle" class="inl-jump-label">${esc(j.label)}</text>`;
    }
  });

  // Green answer marker underneath, like the worked example style.
  if (config.answerMarker) {
    svg += `<text x="${sx(config.answerMarker.x)}" y="${axisY + (config.answerMarker.dy ?? 66)}" text-anchor="middle" class="inl-green-label">${esc(config.answerMarker.text)}</text>`;
  }

  // Optional explanatory line.
  if (config.explanation) {
    svg += `<text x="${width / 2}" y="${height - 22}" text-anchor="middle" class="inl-note">${esc(config.explanation)}</text>`;
  }

  svg += `</svg>`;

  target.innerHTML = svg;
}
