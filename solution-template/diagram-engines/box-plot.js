/*
  CHHS Box Plot Engine
  Static SVG engine for box-and-whisker plots.
*/

function renderBoxPlot(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 300;

  const min = config.min;
  const q1 = config.q1;
  const median = config.median;
  const q3 = config.q3;
  const max = config.max;

  const scaleMin = config.scaleMin ?? Math.floor((min - 5) / 5) * 5;
  const scaleMax = config.scaleMax ?? Math.ceil((max + 5) / 5) * 5;
  const step = config.step || 5;

  const title = config.title || "";
  const axisLabel = config.axisLabel || config.label || "";

  const marginLeft = config.marginLeft || 70;
  const marginRight = config.marginRight || 60;
  const axisY = config.axisY || 210;
  const boxY = config.boxY || 130;
  const boxHeight = config.boxHeight || 58;

  const plotW = width - marginLeft - marginRight;

  function sx(value) {
    return marginLeft + ((value - scaleMin) / (scaleMax - scaleMin)) * plotW;
  }

  function esc(text) {
    return String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="boxplot-svg">
      <defs>
        <style>
          .bp-title {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 22px;
            font-weight: 700;
            fill: #111;
          }

          .bp-line {
            stroke: #111;
            stroke-width: 2.8;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .bp-box {
            fill: white;
            stroke: #111;
            stroke-width: 2.8;
          }

          .bp-median {
            stroke: #111;
            stroke-width: 3.2;
          }

          .bp-axis {
            stroke: #111;
            stroke-width: 2.4;
            stroke-linecap: round;
          }

          .bp-tick {
            stroke: #111;
            stroke-width: 1.5;
          }

          .bp-label {
            font-family: "Cambria Math", "Times New Roman", serif;
            font-size: 18px;
            fill: #111;
          }

          .bp-axis-label {
            font-family: "Cambria Math", "Times New Roman", serif;
            font-size: 20px;
            fill: #111;
          }

          .bp-dot {
            fill: #111;
          }
        </style>
      </defs>
  `;

  if (title) {
    svg += `
      <text x="${width / 2}" y="34" text-anchor="middle" class="bp-title">
        ${esc(title)}
      </text>
    `;
  }

  // Axis
  svg += `
    <line x1="${marginLeft}" y1="${axisY}" x2="${width - marginRight}" y2="${axisY}" class="bp-axis" />
  `;

  // Ticks and labels
  for (let v = scaleMin; v <= scaleMax + 1e-9; v += step) {
    svg += `
      <line x1="${sx(v)}" y1="${axisY - 7}" x2="${sx(v)}" y2="${axisY + 7}" class="bp-tick" />
      <text x="${sx(v)}" y="${axisY + 32}" text-anchor="middle" class="bp-label">${esc(v)}</text>
    `;
  }

  // Axis label
  if (axisLabel) {
    svg += `
      <text x="${width / 2}" y="${height - 22}" text-anchor="middle" class="bp-axis-label">
        ${esc(axisLabel)}
      </text>
    `;
  }

  const yTop = boxY - boxHeight / 2;
  const yBottom = boxY + boxHeight / 2;
  const yMid = boxY;

  // Whiskers
  svg += `
    <line x1="${sx(min)}" y1="${yMid}" x2="${sx(q1)}" y2="${yMid}" class="bp-line" />
    <line x1="${sx(q3)}" y1="${yMid}" x2="${sx(max)}" y2="${yMid}" class="bp-line" />
  `;

  // End dots
  if (config.showEndDots !== false) {
    svg += `
      <circle cx="${sx(min)}" cy="${yMid}" r="4" class="bp-dot" />
      <circle cx="${sx(max)}" cy="${yMid}" r="4" class="bp-dot" />
    `;
  }

  // Box
  svg += `
    <rect x="${sx(q1)}" y="${yTop}" width="${sx(q3) - sx(q1)}" height="${boxHeight}" class="bp-box" />
  `;

  // Median
  svg += `
    <line x1="${sx(median)}" y1="${yTop}" x2="${sx(median)}" y2="${yBottom}" class="bp-median" />
  `;

  // Optional five-number summary labels above box
  if (config.showValueLabels) {
    const labelY = yTop - 12;

    [
      { value: min, text: config.minLabel || String(min) },
      { value: q1, text: config.q1Label || String(q1) },
      { value: median, text: config.medianLabel || String(median) },
      { value: q3, text: config.q3Label || String(q3) },
      { value: max, text: config.maxLabel || String(max) }
    ].forEach(item => {
      svg += `
        <text x="${sx(item.value)}" y="${labelY}" text-anchor="middle" class="bp-label">
          ${esc(item.text)}
        </text>
      `;
    });
  }

  svg += `</svg>`;

  target.innerHTML = svg;
}