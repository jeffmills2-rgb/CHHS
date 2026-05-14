/*
  CHHS Number Line Engine
  Static SVG number line engine for worked solutions and marking guides.
*/

function renderNumberLine(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 180;

  const xmin = config.xmin ?? -10;
  const xmax = config.xmax ?? 10;
  const tickStep = config.tickStep || 1;
  const labelStep = config.labelStep || tickStep;

  const marginLeft = config.marginLeft || 56;
  const marginRight = config.marginRight || 56;
  const axisY = config.axisY || 92;

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
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="numberline-svg">
      <defs>
        <style>
          .nl-axis { stroke:#111; stroke-width:2.6; stroke-linecap:round; }
          .nl-arrow { fill:#111; }
          .nl-tick { stroke:#111; stroke-width:1.8; }
          .nl-label { font-family:Arial, Helvetica, sans-serif; font-size:16px; fill:#111; }
          .nl-point { fill:#111; stroke:white; stroke-width:1.4; }
          .nl-point-label { font-family:"Cambria Math","Times New Roman",serif; font-size:18px; fill:#111; }
          .nl-jump { stroke:#111; stroke-width:2.4; fill:none; }
          .nl-jump-dashed { stroke-dasharray:7 6; }
        </style>
      </defs>
  `;

  // Axis line
  svg += `<line x1="${marginLeft}" y1="${axisY}" x2="${width - marginRight}" y2="${axisY}" class="nl-axis" />`;

  // Arrowheads
  if (config.arrows !== false) {
    svg += `
      <polygon points="${marginLeft},${axisY} ${marginLeft + 10},${axisY - 6} ${marginLeft + 10},${axisY + 6}" class="nl-arrow" />
      <polygon points="${width - marginRight},${axisY} ${width - marginRight - 10},${axisY - 6} ${width - marginRight - 10},${axisY + 6}" class="nl-arrow" />
    `;
  }

  // Ticks
  for (let x = Math.ceil(xmin / tickStep) * tickStep; x <= xmax + 1e-9; x += tickStep) {
    const px = sx(x);
    const major = Math.abs((x / labelStep) - Math.round(x / labelStep)) < 1e-9;
    const tickLength = major ? 20 : 12;

    svg += `<line x1="${px}" y1="${axisY - tickLength / 2}" x2="${px}" y2="${axisY + tickLength / 2}" class="nl-tick" />`;

    if (major) {
      svg += `<text x="${px}" y="${axisY + 36}" text-anchor="middle" class="nl-label">${niceNumber(x)}</text>`;
    }
  }

  // Jumps / arcs
  const jumps = config.jumps || [];

  jumps.forEach(jump => {
    const x1 = sx(jump.from);
    const x2 = sx(jump.to);
    const mid = (x1 + x2) / 2;
    const span = Math.abs(x2 - x1);
    const heightArc = jump.height || Math.min(70, Math.max(28, span / 3));
    const above = jump.above !== false;
    const sign = above ? -1 : 1;

    const y = axisY;
    const cY = y + sign * heightArc;

    const dashed = jump.dashed ? " nl-jump-dashed" : "";

    svg += `<path d="M ${x1} ${y} Q ${mid} ${cY} ${x2} ${y}" class="nl-jump${dashed}" />`;

    if (jump.arrow !== false) {
      const arrowDir = jump.to >= jump.from ? 1 : -1;
      const ax = x2;
      const ay = y;
      svg += `
        <path d="
          M ${ax} ${ay}
          l ${-arrowDir * 10} ${above ? -5 : 5}
          M ${ax} ${ay}
          l ${-arrowDir * 10} ${above ? 5 : -5}
        " class="nl-jump" />
      `;
    }

    if (jump.label) {
      svg += `<text x="${mid}" y="${cY + (above ? -10 : 22)}" text-anchor="middle" class="nl-point-label">${esc(jump.label)}</text>`;
    }
  });

  // Points
  const points = config.points || [];

  points.forEach(p => {
    const px = sx(p.x);
    const r = p.r || 5;

    if (p.open) {
      svg += `<circle cx="${px}" cy="${axisY}" r="${r}" fill="white" stroke="#111" stroke-width="2.4" />`;
    } else {
      svg += `<circle cx="${px}" cy="${axisY}" r="${r}" class="nl-point" />`;
    }

    if (p.label) {
      const dy = p.dy ?? -18;
      svg += `<text x="${px + (p.dx || 0)}" y="${axisY + dy}" text-anchor="${p.anchor || "middle"}" class="nl-point-label">${esc(p.label)}</text>`;
    }
  });

  // Highlight interval
  const intervals = config.intervals || [];

  intervals.forEach(interval => {
    const x1 = sx(interval.from);
    const x2 = sx(interval.to);
    const y = axisY + (interval.offsetY || 0);

    svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#111" stroke-width="${interval.strokeWidth || 7}" stroke-linecap="round" />`;
  });

  svg += `</svg>`;

  target.innerHTML = svg;
}
