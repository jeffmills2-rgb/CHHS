/*
  CHHS Geometry Engine
  Static SVG geometry engine for worked solutions and marking guides.
*/

function renderGeometryDiagram(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 440;
  const padding = config.padding || 42;

  const points = config.points || {};
  const shapes = config.shapes || [];
  const labels = config.labels || [];
  const angleMarks = config.angleMarks || [];
  const sideMarks = config.sideMarks || [];

  function esc(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function P(name) {
    return points[name];
  }

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="geom-svg">
      <defs>
        <style>
          .geom-line { stroke:#111; stroke-width:2.5; fill:none; stroke-linecap:round; stroke-linejoin:round; }
          .geom-dashed { stroke-dasharray:7 6; }
          .geom-shape-fill { fill:#f7f7f7; stroke:#111; stroke-width:2.5; }
          .geom-label { font-family:Arial, Helvetica, sans-serif; font-size:20px; fill:#111; font-weight:700; }
          .geom-small { font-family:"Cambria Math","Times New Roman",serif; font-size:18px; fill:#111; }
          .geom-angle { stroke:#111; stroke-width:2; fill:none; }
          .geom-angle-fill { fill:#eeeeee; stroke:#111; stroke-width:1.8; }
          .geom-right { fill:none; stroke:#111; stroke-width:2; }
          .geom-tick { stroke:#111; stroke-width:2.2; stroke-linecap:round; }
        </style>
      </defs>
  `;

  shapes.forEach(shape => {
    if (shape.type === "polygon") {
      const pts = shape.points.map(name => `${P(name).x},${P(name).y}`).join(" ");
      const fillClass = shape.fill ? "geom-shape-fill" : "geom-line";
      svg += `<polygon points="${pts}" class="${fillClass}" />`;
    }

    if (shape.type === "line") {
      const a = P(shape.from);
      const b = P(shape.to);
      const dashed = shape.dashed ? " geom-dashed" : "";
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="geom-line${dashed}" />`;
    }

    if (shape.type === "circle") {
      const c = P(shape.center);
      svg += `<circle cx="${c.x}" cy="${c.y}" r="${shape.r}" class="geom-line" />`;
    }
  });

  angleMarks.forEach(mark => {
    svg += drawAngleMark(mark);
  });

  sideMarks.forEach(mark => {
    svg += drawSideMark(mark);
  });

  labels.forEach(label => {
    const base = label.point ? P(label.point) : { x: label.x, y: label.y };
    svg += `<text x="${base.x + (label.dx || 0)}" y="${base.y + (label.dy || 0)}" text-anchor="${label.anchor || "middle"}" class="${label.small ? "geom-small" : "geom-label"}">${esc(label.text)}</text>`;
  });

  svg += `</svg>`;

  target.innerHTML = svg;

  function drawAngleMark(mark) {
    const vertex = P(mark.vertex);
    const a = P(mark.from);
    const b = P(mark.to);

    const r = mark.r || 34;

    const angle1 = Math.atan2(a.y - vertex.y, a.x - vertex.x);
    const angle2 = Math.atan2(b.y - vertex.y, b.x - vertex.x);

    const start = normaliseAngle(angle1);
    let end = normaliseAngle(angle2);

    let sweep = end - start;
    if (sweep < 0) sweep += Math.PI * 2;

    if (mark.reflex === false && sweep > Math.PI) {
      sweep = Math.PI * 2 - sweep;
    }

    const endAngle = start + sweep;

    const x1 = vertex.x + r * Math.cos(start);
    const y1 = vertex.y + r * Math.sin(start);
    const x2 = vertex.x + r * Math.cos(endAngle);
    const y2 = vertex.y + r * Math.sin(endAngle);

    const largeArc = sweep > Math.PI ? 1 : 0;

    let out = `
      <path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" class="geom-angle" />
    `;

    if (mark.label) {
      const mid = start + sweep / 2;
      const lr = r + (mark.labelOffset || 22);
      out += `<text x="${vertex.x + lr * Math.cos(mid)}" y="${vertex.y + lr * Math.sin(mid) + 6}" text-anchor="middle" class="geom-small">${esc(mark.label)}</text>`;
    }

    if (mark.rightAngle) {
      out += drawRightAngle(vertex, a, b, mark.size || 22);
    }

    return out;
  }

  function drawRightAngle(v, a, b, size) {
    const u1 = unitVector(v, a);
    const u2 = unitVector(v, b);

    const p1 = {
      x: v.x + u1.x * size,
      y: v.y + u1.y * size
    };

    const p2 = {
      x: p1.x + u2.x * size,
      y: p1.y + u2.y * size
    };

    const p3 = {
      x: v.x + u2.x * size,
      y: v.y + u2.y * size
    };

    return `<path d="M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}" class="geom-right" />`;
  }

  function drawSideMark(mark) {
    const a = P(mark.from);
    const b = P(mark.to);
    const count = mark.count || 1;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);

    const nx = -dy / len;
    const ny = dx / len;

    const spacing = 7;
    let out = "";

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;

      const cx = mx + (dx / len) * offset;
      const cy = my + (dy / len) * offset;

      out += `
        <line 
          x1="${cx - nx * 8}" y1="${cy - ny * 8}" 
          x2="${cx + nx * 8}" y2="${cy + ny * 8}" 
          class="geom-tick" />
      `;
    }

    return out;
  }

  function unitVector(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    return { x: dx / len, y: dy / len };
  }

  function normaliseAngle(a) {
    while (a < 0) a += Math.PI * 2;
    while (a >= Math.PI * 2) a -= Math.PI * 2;
    return a;
  }
}
