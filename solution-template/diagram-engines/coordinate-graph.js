/*
  CHHS Coordinate Graph Engine
  Updated AI-safe version
  Supports:
  - lines: [{ equation: "y=4x-2" }]
  - functions: [{ fn: x => ... }]
  - points
  - segments
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

  const xmin = config.xmin ?? -10;
  const xmax = config.xmax ?? 10;
  const ymin = config.ymin ?? -10;
  const ymax = config.ymax ?? 10;

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
    return Number.isInteger(n)
      ? String(n)
      : String(Number(n.toFixed(2)));
  }

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <defs>
        <style>
          .coord-border { stroke:#222; stroke-width:1.6; fill:white; }
          .coord-grid { stroke:#d6d6d6; stroke-width:1; }
          .coord-axis { stroke:#111; stroke-width:2.2; }
          .coord-tick { stroke:#111; stroke-width:1.4; }
          .coord-label { font-family:Arial; font-size:14px; fill:#111; }
          .coord-axis-label { font-family:Arial; font-size:18px; font-weight:700; fill:#111; }
          .coord-title { font-family:Arial; font-size:20px; font-weight:700; fill:#111; }
          .coord-line { stroke:#111; stroke-width:2.6; fill:none; }
          .coord-point { fill:#111; stroke:white; stroke-width:1.5; }
          .coord-point-label {
            font-family:"Cambria Math","Times New Roman",serif;
            font-size:17px;
            fill:#111;
          }
        </style>

        <clipPath id="${targetId}-clip">
          <rect
            x="${margin.left}"
            y="${margin.top}"
            width="${plotW}"
            height="${plotH}"
          />
        </clipPath>
      </defs>
  `;

  if (config.title) {
    svg += `
      <text
        x="${width / 2}"
        y="20"
        text-anchor="middle"
        class="coord-title"
      >
        ${escapeText(config.title)}
      </text>
    `;
  }

  svg += `
    <rect
      x="${margin.left}"
      y="${margin.top}"
      width="${plotW}"
      height="${plotH}"
      class="coord-border"
    />
  `;

  // GRID
  for (let x = Math.ceil(xmin / gridStep) * gridStep; x <= xmax; x += gridStep) {
    svg += `
      <line
        x1="${sx(x)}"
        y1="${margin.top}"
        x2="${sx(x)}"
        y2="${margin.top + plotH}"
        class="coord-grid"
      />
    `;
  }

  for (let y = Math.ceil(ymin / gridStep) * gridStep; y <= ymax; y += gridStep) {
    svg += `
      <line
        x1="${margin.left}"
        y1="${sy(y)}"
        x2="${margin.left + plotW}"
        y2="${sy(y)}"
        class="coord-grid"
      />
    `;
  }

  // AXES
  if (xmin <= 0 && xmax >= 0) {
    svg += `
      <line
        x1="${sx(0)}"
        y1="${margin.top}"
        x2="${sx(0)}"
        y2="${margin.top + plotH}"
        class="coord-axis"
      />
    `;
  }

  if (ymin <= 0 && ymax >= 0) {
    svg += `
      <line
        x1="${margin.left}"
        y1="${sy(0)}"
        x2="${margin.left + plotW}"
        y2="${sy(0)}"
        class="coord-axis"
      />
    `;
  }

  // TICKS
  for (let x = Math.ceil(xmin / xTickStep) * xTickStep; x <= xmax; x += xTickStep) {
    const px = sx(x);
    const axisY = ymin <= 0 && ymax >= 0 ? sy(0) : margin.top + plotH;

    svg += `
      <line
        x1="${px}"
        y1="${axisY - 5}"
        x2="${px}"
        y2="${axisY + 5}"
        class="coord-tick"
      />
    `;

    if (x !== 0 || config.showZeroLabel) {
      svg += `
        <text
          x="${px}"
          y="${axisY + 22}"
          text-anchor="middle"
          class="coord-label"
        >
          ${niceNumber(x)}
        </text>
      `;
    }
  }

  for (let y = Math.ceil(ymin / yTickStep) * yTickStep; y <= ymax; y += yTickStep) {
    const py = sy(y);
    const axisX = xmin <= 0 && xmax >= 0 ? sx(0) : margin.left;

    svg += `
      <line
        x1="${axisX - 5}"
        y1="${py}"
        x2="${axisX + 5}"
        y2="${py}"
        class="coord-tick"
      />
    `;

    if (y !== 0 || config.showZeroLabel) {
      svg += `
        <text
          x="${axisX - 10}"
          y="${py + 5}"
          text-anchor="end"
          class="coord-label"
        >
          ${niceNumber(y)}
        </text>
      `;
    }
  }

  // AXIS LABELS
  svg += `
    <text
      x="${margin.left + plotW + 18}"
      y="${sy(0) + 6}"
      class="coord-axis-label"
    >
      x
    </text>

    <text
      x="${sx(0) - 6}"
      y="${margin.top - 10}"
      text-anchor="end"
      class="coord-axis-label"
    >
      y
    </text>
  `;

  svg += `<g clip-path="url(#${targetId}-clip)">`;

  // AI-SAFE LINE FORMAT
  const lines = config.lines || [];

  lines.forEach(line => {
    if (!line.equation) return;

    const fn = parseEquation(line.equation);

    if (!fn) {
      console.warn("Invalid equation:", line.equation);
      return;
    }

    let path = "";
    let started = false;

    for (let i = 0; i <= 300; i++) {
      const x = xmin + (i / 300) * (xmax - xmin);
      const y = fn(x);

      if (!Number.isFinite(y)) {
        started = false;
        continue;
      }

      const px = sx(x);
      const py = sy(y);

      path += started
        ? ` L ${px} ${py}`
        : `M ${px} ${py}`;

      started = true;
    }

    svg += `
      <path
        d="${path}"
        class="coord-line"
      />
    `;

    if (line.equation) {
      const lx = xmax - 2;
      const ly = fn(lx);

      if (Number.isFinite(ly)) {
        svg += `
          <text
            x="${sx(lx) + 8}"
            y="${sy(ly) - 8}"
            class="coord-point-label"
          >
            ${escapeText(line.equation)}
          </text>
        `;
      }
    }
  });

  // OPTIONAL LEGACY FUNCTIONS
  const functions = config.functions || [];

  functions.forEach(fnConfig => {
    if (typeof fnConfig.fn !== "function") return;

    let path = "";
    let started = false;

    for (let i = 0; i <= 300; i++) {
      const x = xmin + (i / 300) * (xmax - xmin);
      const y = fnConfig.fn(x);

      if (!Number.isFinite(y)) {
        started = false;
        continue;
      }

      const px = sx(x);
      const py = sy(y);

      path += started
        ? ` L ${px} ${py}`
        : `M ${px} ${py}`;

      started = true;
    }

    svg += `
      <path
        d="${path}"
        class="coord-line"
      />
    `;
  });

  // SEGMENTS
  const segments = config.segments || [];

  segments.forEach(seg => {
    svg += `
      <line
        x1="${sx(seg.x1)}"
        y1="${sy(seg.y1)}"
        x2="${sx(seg.x2)}"
        y2="${sy(seg.y2)}"
        class="coord-line"
      />
    `;
  });

  // POINTS
  const points = config.points || [];

  points.forEach(p => {
    svg += `
      <circle
        cx="${sx(p.x)}"
        cy="${sy(p.y)}"
        r="${p.r || 5}"
        class="coord-point"
      />
    `;

    if (p.label) {
      svg += `
        <text
          x="${sx(p.x) + (p.dx || 8)}"
          y="${sy(p.y) + (p.dy || -8)}"
          class="coord-point-label"
        >
          ${escapeText(p.label)}
        </text>
      `;
    }
  });

  svg += `</g>`;
  svg += `</svg>`;

  target.innerHTML = svg;

  // SIMPLE EQUATION PARSER
  function parseEquation(eq) {
    try {
      let expr = eq
        .replace(/\s+/g, "")
        .replace(/^y=/, "")
        .replace(/x²/g, "x*x")
        .replace(/\^2/g, "*x");

      return new Function("x", `return ${expr};`);
    } catch (e) {
      return null;
    }
  }
}