/*
  CHHS Network Graph Engine
  Renderer-safe SVG engine for networks, spanning trees, flow networks and weighted graphs.
*/

function renderNetworkGraph(targetId, config = {}) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 430;
  const nodes = Array.isArray(config.nodes) ? config.nodes : [];
  const edges = Array.isArray(config.edges) ? config.edges : [];
  const annotations = Array.isArray(config.annotations) ? config.annotations : [];

  const nodeMap = {};
  nodes.forEach(node => {
    if (node && node.id) nodeMap[node.id] = node;
  });

  const nodeRadius = config.nodeRadius ?? 5;
  const fontFamily = config.fontFamily || `"Cambria Math","Times New Roman",serif`;

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function getNode(id) {
    return nodeMap[id];
  }

  function linePoint(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }

  function normal(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  }

  function edgePath(edge, a, b) {
    if (edge.curve) {
      const mid = linePoint(a, b, 0.5);
      const n = normal(a, b);
      const c = {
        x: mid.x + n.x * edge.curve,
        y: mid.y + n.y * edge.curve
      };
      return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
    }

    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  }

  function edgeLabelPosition(edge, a, b) {
    const t = edge.labelT ?? 0.5;
    const p = linePoint(a, b, t);
    const n = normal(a, b);
    const offset = edge.labelOffset ?? 14;

    if (edge.curve) {
      return {
        x: p.x + n.x * (edge.curve * 0.5 + offset),
        y: p.y + n.y * (edge.curve * 0.5 + offset)
      };
    }

    return {
      x: p.x + n.x * offset,
      y: p.y + n.y * offset
    };
  }

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="network-svg">
      <defs>
        <marker id="${targetId}-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 3 L 0 6 z" fill="#111"></path>
        </marker>

        <marker id="${targetId}-arrow-highlight" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 3 L 0 6 z" fill="#0b57d0"></path>
        </marker>

        <style>
          .net-title {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 18px;
            font-weight: 700;
            fill: #111;
          }

          .net-edge {
            stroke: #111;
            stroke-width: 2;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .net-edge-light {
            stroke: #555;
            stroke-width: 1.6;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .net-edge-highlight {
            stroke: #0b57d0;
            stroke-width: 3;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .net-dashed {
            stroke-dasharray: 7 5;
          }

          .net-node {
            fill: #111;
            stroke: #111;
            stroke-width: 1.5;
          }

          .net-node-open {
            fill: #fff;
            stroke: #111;
            stroke-width: 2;
          }

          .net-node-highlight {
            fill: #0b57d0;
            stroke: #0b57d0;
            stroke-width: 2;
          }

          .net-label {
            font-family: ${fontFamily};
            font-size: 20px;
            fill: #111;
          }

          .net-small {
            font-family: ${fontFamily};
            font-size: 17px;
            fill: #111;
          }

          .net-edge-label {
            font-family: ${fontFamily};
            font-size: 18px;
            fill: #111;
          }

          .net-box-label {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 15px;
            fill: #111;
          }
        </style>
      </defs>
  `;

  if (config.title) {
    svg += `
      <text x="${width / 2}" y="26" text-anchor="middle" class="net-title">
        ${esc(config.title)}
      </text>
    `;
  }

  edges.forEach(edge => {
    const a = getNode(edge.from);
    const b = getNode(edge.to);
    if (!a || !b) return;

    const cls = edge.highlight
      ? "net-edge-highlight"
      : edge.light
        ? "net-edge-light"
        : "net-edge";

    const dashed = edge.dashed ? " net-dashed" : "";

    const marker = edge.directed
      ? edge.highlight
        ? ` marker-end="url(#${targetId}-arrow-highlight)"`
        : ` marker-end="url(#${targetId}-arrow)"`
      : "";

    svg += `
      <path
        d="${edgePath(edge, a, b)}"
        class="${cls}${dashed}"
        ${marker}
      />
    `;

    if (edge.label !== undefined && edge.label !== "") {
      const lp = edgeLabelPosition(edge, a, b);

      svg += `
        <text
          x="${lp.x + (edge.labelDx || 0)}"
          y="${lp.y + (edge.labelDy || 0)}"
          text-anchor="${edge.labelAnchor || "middle"}"
          class="net-edge-label"
        >
          ${esc(edge.label)}
        </text>
      `;
    }
  });

  nodes.forEach(node => {
    const cls = node.highlight
      ? "net-node-highlight"
      : node.open
        ? "net-node-open"
        : "net-node";

    const r = node.r ?? nodeRadius;

    svg += `
      <circle cx="${node.x}" cy="${node.y}" r="${r}" class="${cls}" />
    `;

    const label = node.label ?? node.id;

    if (label !== "") {
      svg += `
        <text
          x="${node.x + (node.dx ?? 0)}"
          y="${node.y + (node.dy ?? -12)}"
          text-anchor="${node.anchor || "middle"}"
          class="${node.small ? "net-small" : "net-label"}"
        >
          ${esc(label)}
        </text>
      `;
    }
  });

  annotations.forEach(item => {
    if (item.type === "text" || !item.type) {
      svg += `
        <text
          x="${item.x}"
          y="${item.y}"
          text-anchor="${item.anchor || "middle"}"
          class="${item.small ? "net-small" : "net-label"}"
        >
          ${esc(item.text)}
        </text>
      `;
    }

    if (item.type === "line") {
      svg += `
        <line
          x1="${item.x1}" y1="${item.y1}"
          x2="${item.x2}" y2="${item.y2}"
          class="${item.highlight ? "net-edge-highlight" : "net-edge"}${item.dashed ? " net-dashed" : ""}"
          ${item.directed ? `marker-end="url(#${targetId}-arrow)"` : ""}
        />
      `;
    }

    if (item.type === "boxLabel") {
      svg += `
        <rect
          x="${item.x}" y="${item.y}"
          width="${item.width || 85}" height="${item.height || 30}"
          fill="white"
          stroke="#111"
          stroke-width="1.5"
        />
        <text
          x="${item.x + (item.width || 85) / 2}"
          y="${item.y + (item.height || 30) / 2 + 5}"
          text-anchor="middle"
          class="net-box-label"
        >
          ${esc(item.text)}
        </text>
      `;
    }
  });

  svg += `</svg>`;
  target.innerHTML = svg;
}