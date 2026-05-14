/*
  CHHS Probability Tree Engine
  Static SVG engine for worked solutions and marking guides.
*/

function renderProbabilityTree(targetId, config) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const width = config.width || 760;
  const height = config.height || 420;

  const startX = 60;
  const startY = height / 2;

  const level1X = 260;
  const level2X = 520;

  const branchGap = config.branchGap || 120;
  const subGap = config.subGap || 52;

  const outcomes = config.outcomes || [];

  let svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="prob-tree-svg">
      <defs>
        <style>
          .prob-line { stroke:#222; stroke-width:2; fill:none; }
          .prob-label { font-family:"Cambria Math","Times New Roman",serif; font-size:22px; fill:#111; }
          .prob-small { font-family:"Cambria Math","Times New Roman",serif; font-size:20px; fill:#111; }
          .prob-node { fill:#111; }
        </style>
      </defs>
  `;

  svg += `<circle cx="${startX}" cy="${startY}" r="3.5" class="prob-node" />`;

  outcomes.forEach((branch, i) => {
    const level1Y = startY + (i - (outcomes.length - 1) / 2) * branchGap;

    svg += drawLine(startX, startY, level1X, level1Y);
    svg += drawLabel(
      (startX + level1X) / 2 - 22,
      (startY + level1Y) / 2 - 10,
      branch.probability
    );

    svg += drawLabel(level1X + 18, level1Y + 7, branch.label);

    const subBranches = branch.outcomes || [];

    subBranches.forEach((sub, j) => {
      const offset = (j - (subBranches.length - 1) / 2) * subGap;
      const level2Y = level1Y + offset;

      svg += drawLine(level1X + 90, level1Y, level2X, level2Y);
      svg += drawLabel(
        (level1X + 90 + level2X) / 2 - 12,
        (level1Y + level2Y) / 2 - 10,
        sub.probability
      );

      svg += drawLabel(level2X + 18, level2Y + 7, sub.label);
    });
  });

  svg += `</svg>`;

  target.innerHTML = svg;
}

function drawLine(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="prob-line" />`;
}

function drawLabel(x, y, text) {
  return `<text x="${x}" y="${y}" class="prob-label">${text}</text>`;
}
