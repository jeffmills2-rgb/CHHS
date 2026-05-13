/*
  CHHS Worked Solution Renderer
  Turns structured worked-solution JSON into printable CHHS solution pages.
*/

function renderWorkedSolution(targetId, data) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = "";

  const page = document.createElement("div");
  page.className = "page";

  page.innerHTML = `
    <div class="header">
      <div class="school-block">
        <h1>${escapeHTML(data.school || "CHHS")}</h1>
        <h2>${escapeHTML(data.documentTitle || "Worked Solution")}</h2>
      </div>

      <div class="meta">
        ${escapeHTML(data.course || "Mathematics")}<br>
        ${escapeHTML(data.mode === "student" ? "Student Worked Solution" : "Teacher Worked Solution")}<br>
        ${escapeHTML(data.year || "")}
      </div>
    </div>
  `;

  const questions = data.questions || [];

  questions.forEach((question, index) => {
    const section = document.createElement("section");
    section.className = "question-section";

    if (index > 0 && question.pageBreakBefore) {
      section.classList.add("page-break");
    }

    section.innerHTML = `
      <div class="question-title">Question ${escapeHTML(question.questionNumber)}</div>

      ${question.questionText ? `
        <div class="question-text">
          ${escapeHTML(question.questionText)}
        </div>
      ` : ""}

      ${renderCriteriaTable(question.criteria || [])}

      <div class="sample-answer-title">Sample answer:</div>

      <div class="solution-render-area" id="solution-area-${index}"></div>

      ${renderListBlock("Common errors", question.commonErrors)}
      ${renderListBlock("Teacher notes", question.teacherNotes)}
    `;

    page.appendChild(section);
  });

  page.innerHTML += `
    <div class="footer">
      <div>${escapeHTML(data.school || "CHHS")} Mathematics Faculty</div>
      <div>Generated Solution Template</div>
    </div>
  `;

  target.appendChild(page);

  questions.forEach((question, index) => {
    renderQuestionSolution(`solution-area-${index}`, question.solution || {});
  });
}

function renderQuestionSolution(targetId, solution) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (solution.intro) {
    const intro = document.createElement("div");
    intro.className = "solution-intro";
    intro.textContent = solution.intro;
    target.appendChild(intro);
  }

  if (solution.type === "algebra" || solution.type === "mixed" || solution.steps) {
    const algebraId = `${targetId}-algebra`;

    const algebraContainer = document.createElement("div");
    algebraContainer.id = algebraId;
    target.appendChild(algebraContainer);

    if (typeof renderAlgebraLayout === "function") {
      renderAlgebraLayout(algebraId, {
        title: solution.algebraTitle || "",
        steps: solution.steps || [],
        finalAnswer: solution.finalAnswer || "",
        notes: solution.notes || []
      });
    } else {
      algebraContainer.innerHTML = fallbackAlgebra(solution);
    }
  }

  if (solution.diagram) {
    renderDiagram(target, solution.diagram, `${targetId}-diagram-0`);
  }

  if (Array.isArray(solution.diagrams)) {
    solution.diagrams.forEach((diagram, i) => {
      renderDiagram(target, diagram, `${targetId}-diagram-${i + 1}`);
    });
  }

  if (solution.type === "short-answer" && solution.finalAnswer) {
    const answer = document.createElement("div");
    answer.className = "short-final-answer";
    answer.innerHTML = solution.finalAnswer;
    target.appendChild(answer);
  }
}

function renderDiagram(parent, diagram, id) {
  const box = document.createElement("div");
  box.id = id;
  box.className = "diagram-box large";
  parent.appendChild(box);

  const config = diagram.config || {};

  if (diagram.title && !config.title) {
    config.title = diagram.title;
  }

  switch (diagram.engine) {
    case "coordinate-graph":
      if (typeof renderCoordinateGraph === "function") {
        renderCoordinateGraph(id, config);
      }
      break;

    case "geometry-engine":
      if (typeof renderGeometryDiagram === "function") {
        renderGeometryDiagram(id, config);
      }
      break;

    case "number-line":
      box.classList.remove("large");
      if (typeof renderNumberLine === "function") {
        renderNumberLine(id, config);
      }
      break;

    case "probability-tree":
      if (typeof renderProbabilityTree === "function") {
        renderProbabilityTree(id, config);
      }
      break;

    case "algebra-layout":
      box.classList.remove("large");
      box.classList.remove("diagram-box");
      if (typeof renderAlgebraLayout === "function") {
        renderAlgebraLayout(id, config);
      }
      break;

    default:
      box.innerHTML = `
        <div class="missing-engine">
          Missing or unknown diagram engine: ${escapeHTML(diagram.engine)}
        </div>
      `;
  }
}

function renderCriteriaTable(criteria) {
  if (!criteria.length) return "";

  let rows = criteria.map(row => `
    <tr>
      <td>${escapeHTML(row.text)}</td>
      <td class="marks">${escapeHTML(row.marks)}</td>
    </tr>
  `).join("");

  return `
    <table class="criteria-table">
      <tr>
        <th>Criteria</th>
        <th class="marks">Marks</th>
      </tr>
      ${rows}
    </table>
  `;
}

function renderListBlock(title, items) {
  if (!Array.isArray(items) || !items.length) return "";

  return `
    <div class="teacher-note">
      <strong>${escapeHTML(title)}:</strong>
      <ul>
        ${items.map(item => `<li>${escapeHTML(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function fallbackAlgebra(solution) {
  const steps = solution.steps || [];

  return `
    <div class="solution-box">
      ${steps.map(step => `
        <div class="solution-step">
          ${step.expression}
          ${step.reason ? `<span class="step-reason">${escapeHTML(step.reason)}</span>` : ""}
        </div>
      `).join("")}
      ${solution.finalAnswer ? `<div class="final-answer">${solution.finalAnswer}</div>` : ""}
    </div>
  `;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
