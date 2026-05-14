/*
  CHHS Geometry Engine
  Updated with:
  - safer rendering
  - trig-triangle preset
  - dashed construction lines
  - right-angle markers
  - side labels
  - angle labels
*/

function renderGeometryDiagram(targetId, config = {}) {

  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 420;

  const points = config.points || {};
  const labels = config.labels || [];
  const shapes = config.shapes || [];
  const dashed = config.dashed || [];
  const rightAngles = config.rightAngles || [];
  const sideMarks = config.sideMarks || [];
  const angleMarks = config.angleMarks || [];

  function esc(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function point(name) {
    return points[name];
  }

  let svg = `
  <svg
    viewBox="0 0 ${width} ${height}"
    width="100%"
    height="100%"
    class="geometry-svg"
  >
    <defs>
      <style>
        .g-line {
          stroke:#111;
          stroke-width:2.2;
          fill:none;
          stroke-linecap:round;
          stroke-linejoin:round;
        }

        .g-dashed {
          stroke:#666;
          stroke-width:1.8;
          fill:none;
          stroke-dasharray:6 4;
        }

        .g-label {
          font-family:"Cambria Math","Times New Roman",serif;
          font-size:20px;
          fill:#111;
        }

        .g-small {
          font-size:17px;
        }

        .g-angle {
          stroke:#111;
          stroke-width:1.8;
          fill:none;
        }

        .g-right-angle {
          stroke:#111;
          stroke-width:1.8;
          fill:none;
        }

        .g-side-mark {
          stroke:#111;
          stroke-width:2;
        }
      </style>
    </defs>
  `;

  // ---------- SHAPES ----------

  shapes.forEach(shape => {

    if (shape.type === "polygon") {

      const pts = shape.points
        .map(p => `${point(p).x},${point(p).y}`)
        .join(" ");

      svg += `
        <polygon
          points="${pts}"
          class="g-line"
          ${shape.fill ? `fill="${shape.fill}"` : `fill="none"`}
        />
      `;
    }

if (shape.type === "segment" || shape.type === "line") {
      const a = point(shape.from);
      const b = point(shape.to);

      svg += `
        <line
          x1="${a.x}"
          y1="${a.y}"
          x2="${b.x}"
          y2="${b.y}"
          class="g-line"
        />
      `;
    }
  });

  // ---------- DASHED ----------

  dashed.forEach(line => {

    const a = point(line.from);
    const b = point(line.to);

    if (!a || !b) return;

    svg += `
      <line
        x1="${a.x}"
        y1="${a.y}"
        x2="${b.x}"
        y2="${b.y}"
        class="g-dashed"
      />
    `;
  });

  // ---------- RIGHT ANGLES ----------

  rightAngles.forEach(ra => {

    const p = point(ra.at);
    if (!p) return;

    const s = ra.size || 16;

    svg += `
      <path
        d="
          M ${p.x} ${p.y}
          l ${s} 0
          l 0 ${-s}
          l ${-s} 0
        "
        class="g-right-angle"
      />
    `;
  });

  // ---------- SIDE MARKS ----------

  sideMarks.forEach(mark => {

    const a = point(mark.from);
    const b = point(mark.to);

    if (!a || !b) return;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const len = Math.hypot(dx, dy);

    const ux = -dy / len;
    const uy = dx / len;

    const count = mark.count || 1;

    for (let i = 0; i < count; i++) {

      const offset = (i - (count - 1) / 2) * 8;

      const cx = mx + ux * offset;
      const cy = my + uy * offset;

      svg += `
        <line
          x1="${cx - ux * 8}"
          y1="${cy - uy * 8}"
          x2="${cx + ux * 8}"
          y2="${cy + uy * 8}"
          class="g-side-mark"
        />
      `;
    }
  });

  // ---------- ANGLE MARKS ----------

  angleMarks.forEach(mark => {

    const v = point(mark.vertex);
    const a = point(mark.from);
    const b = point(mark.to);

    if (!v || !a || !b) return;

    const r = mark.r || 32;

    const a1 = Math.atan2(a.y - v.y, a.x - v.x);
    const a2 = Math.atan2(b.y - v.y, b.x - v.x);

    const x1 = v.x + r * Math.cos(a1);
    const y1 = v.y + r * Math.sin(a1);

    const x2 = v.x + r * Math.cos(a2);
    const y2 = v.y + r * Math.sin(a2);

    svg += `
      <path
        d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}"
        class="g-angle"
      />
    `;

    if (mark.label) {

      const mid = (a1 + a2) / 2;

      const lx = v.x + (r + 22) * Math.cos(mid);
      const ly = v.y + (r + 22) * Math.sin(mid);

      svg += `
        <text
          x="${lx}"
          y="${ly}"
          class="g-label g-small"
          text-anchor="middle"
        >
          ${esc(mark.label)}
        </text>
      `;
    }
  });

  // ---------- LABELS ----------

  labels.forEach(label => {

    const isPointLabel = label.point && points[label.point];

    let x = label.x;
    let y = label.y;

    if (isPointLabel) {
      x = points[label.point].x + (label.dx || 0);
      y = points[label.point].y + (label.dy || 0);
    }

    svg += `
      <text
        x="${x}"
        y="${y}"
        class="g-label ${label.small ? "g-small" : ""}"
        text-anchor="${label.anchor || "middle"}"
      >
        ${esc(label.text)}
      </text>
    `;
  });

  svg += `</svg>`;

  target.innerHTML = svg;
}