/*
  CHHS Coordinate Graph Engine
  Static SVG graph engine for worked solutions and marking guides.
*/

function renderCoordinateGraph(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 460;

  const margin = {
    left: config.marginLeft || 58,
    right: config.marginRight || 28,
    top: config.marginTop || 28,
    bottom: config.marginBottom || 52
  };

  const xmin = config.xmin ?? -5;
  const xmax = config.xmax ?? 5;
  const ymin = config.ymin ?? -5;
  const ymax = config.ymax ?? 5;

  const gridStep = config.gridStep || 1;
  const xTickStep = config.xTickStep || gridStep;
  const yTickStep = config.yTickStep || gridStep;

  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  function sx(x) {
    return margin.left + ((x - xmin) / (xmax - xmin)) * plotW;
  }

  function sy(y) {
    return margin.top + ((ymax - y) / (ymax - ymin)) * plotH;
  }

  function escapeText(text) {
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
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="coord-svg">
      <defs>
        <style>
          .coord-border { stroke:#222; stroke-width:1.6; fill:white; }
          .coord-grid { stroke:#d6d6d6; stroke-width:1; }
          .coord-axis { stroke:#111; stroke-width:2.2; }
          .coord-tick { stroke:#111; stroke-width:1.4; }
          .coord-label { font-family:Arial, Helvetica, sans-serif; font-size:14px; fill:#111; }
          .coord-axis-label { font-family:Arial, Helvetica, sans-serif; font-size:18px; font-weight:700; fill:#111; }
          .coord-title { font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; fill:#111; }
          .coord-curve { stroke:#111; stroke-width:2.7; fill:none; }
          .coord-line { stroke:#111; stroke-width:2.2; fill:none; }
          .coord-dashed { stroke-dasharray:7 6; }
          .coord-point { fill:#111; stroke:white; stroke-width:1.5; }
          .coord-point-label { font-family:"Cambria Math","Times New Roman",serif; font-size:17px; fill:#111; }
        </style>

        <clipPath id="${targetId}-clip">
          <rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" />
        </clipPath>
      </defs>
  `;

  if (config.title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" class="coord-title">${escapeText(config.title)}</text>`;
  }

  svg += `<rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" class="coord-border" />`;

  // Grid
  for (let x = Math.ceil(xmin / gridStep) * gridStep; x <= xmax + 1e-9; x += gridStep) {
    svg += `<line x1="${sx(x)}" y1="${margin.top}" x2="${sx(x)}" y2="${margin.top + plotH}" class="coord-grid" />`;
  }

  for (let y = Math.ceil(ymin / gridStep) * gridStep; y <= ymax + 1e-9; y += gridStep) {
    svg += `<line x1="${margin.left}" y1="${sy(y)}" x2="${margin.left + plotW}" y2="${sy(y)}" class="coord-grid" />`;
  }

  // Axes
  if (xmin <= 0 && xmax >= 0) {
    svg += `<line x1="${sx(0)}" y1="${margin.top}" x2="${sx(0)}" y2="${margin.top + plotH}" class="coord-axis" />`;
  }

  if (ymin <= 0 && ymax >= 0) {
    svg += `<line x1="${margin.left}" y1="${sy(0)}" x2="${margin.left + plotW}" y2="${sy(0)}" class="coord-axis" />`;
  }

  // Ticks and labels
  for (let x = Math.ceil(xmin / xTickStep) * xTickStep; x <= xmax + 1e-9; x += xTickStep) {
    const px = sx(x);
    const axisY = ymin <= 0 && ymax >= 0 ? sy(0) : margin.top + plotH;
    svg += `<line x1="${px}" y1="${axisY - 5}" x2="${px}" y2="${axisY + 5}" class="coord-tick" />`;

    if (Math.abs(x) > 1e-9 || config.showZeroLabel) {
      svg += `<text x="${px}" y="${axisY + 22}" text-anchor="middle" class="coord-label">${niceNumber(x)}</text>`;
    }
  }

  for (let y = Math.ceil(ymin / yTickStep) * yTickStep; y <= ymax + 1e-9; y += yTickStep) {
    const py = sy(y);
    const axisX = xmin <= 0 && xmax >= 0 ? sx(0) : margin.left;
    svg += `<line x1="${axisX - 5}" y1="${py}" x2="${axisX + 5}" y2="${py}" class="coord-tick" />`;

    if (Math.abs(y) > 1e-9 || config.showZeroLabel) {
      svg += `<text x="${axisX - 10}" y="${py + 5}" text-anchor="end" class="coord-label">${niceNumber(y)}</text>`;
    }
  }

  // Axis labels
  svg += `<text x="${margin.left + plotW + 18}" y="${sy(0) + 6}" class="coord-axis-label">x</text>`;
  svg += `<text x="${sx(0) - 6}" y="${margin.top - 10}" text-anchor="end" class="coord-axis-label">y</text>`;

  svg += `<g clip-path="url(#${targetId}-clip)">`;

  // Functions
  const functions = config.functions || [];

  functions.forEach(fnConfig => {
    const samples = fnConfig.samples || 240;
    const fn = fnConfig.fn;
    if (typeof fn !== "function") return;

    let path = "";
    let started = false;

    for (let i = 0; i <= samples; i++) {
      const x = xmin + (i / samples) * (xmax - xmin);
      const y = fn(x);

      if (!Number.isFinite(y)) {
        started = false;
        continue;
      }

      const px = sx(x);
      const py = sy(y);

      if (y < ymin - 10 || y > ymax + 10) {
        started = false;
        continue;
      }

      path += started ? ` L ${px} ${py}` : `M ${px} ${py}`;
      started = true;
    }

    const dashClass = fnConfig.dashed ? " coord-dashed" : "";
    svg += `<path d="${path}" class="coord-curve${dashClass}" />`;

    if (fnConfig.label) {
      const lx = fnConfig.labelX ?? xmax - 1;
      const ly = fn(lx);
      if (Number.isFinite(ly)) {
        svg += `<text x="${sx(lx) + 8}" y="${sy(ly) - 8}" class="coord-point-label">${escapeText(fnConfig.label)}</text>`;
      }
    }
  });

  // Line segments
  const segments = config.segments || [];
  segments.forEach(seg => {
    const dashClass = seg.dashed ? " coord-dashed" : "";
    svg += `
      <line 
        x1="${sx(seg.x1)}" y1="${sy(seg.y1)}" 
        x2="${sx(seg.x2)}" y2="${sy(seg.y2)}" 
        class="coord-line${dashClass}" />
    `;
  });

  // Points
  const points = config.points || [];
  points.forEach(p => {
    svg += `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r || 5}" class="coord-point" />`;

    if (p.label) {
      const dx = p.dx ?? 8;
      const dy = p.dy ?? -8;
      svg += `<text x="${sx(p.x) + dx}" y="${sy(p.y) + dy}" class="coord-point-label">${escapeText(p.label)}</text>`;
    }
  });

  svg += `</g>`;

  svg += `</svg>`;

  target.innerHTML = svg;
}
