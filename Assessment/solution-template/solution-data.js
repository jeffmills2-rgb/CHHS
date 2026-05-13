/*
  CHHS Worked Solution Data
  Edit this file to change the worked solutions.
*/

const workedSolutionData = {
  documentTitle: "Year 7 Integer Worked Solutions",
  school: "CHHS",
  course: "Year 7 Mathematics",
  year: "2026",
  mode: "teacher",
  questions: [
    {
      questionNumber: "1",
      questionText: "What is the missing value on each number line?",
      criteria: [
        { text: "Identifies correct interval size", marks: 1 },
        { text: "Identifies correct missing values", marks: 2 }
      ],
      solution: {
        type: "mixed",
        steps: [
          {
            expression: "-40 - 7 = -47",
            reason: "The number line decreases by 7 each tick"
          },
          {
            expression: "-79 + 8 = -71, -71 + 8 = -63, -63 + 8 = -55, -55 + 8 = -47",
            reason: "The number line increases by 8 each tick"
          }
        ],
        finalAnswer: "(a) -47, (b) -47",
        diagram: {
          engine: "integer-number-line-solution",
          config: {
            title: "Missing integer values",
            xmin: -90,
            xmax: -5,
            tickStep: 1,
            labels: [-87, -79, -71, -63, -55, -47, -40, -33, -23, -15, -5],
            points: [
              { x: -47, kind: "end", label: "-47", dy: 42 }
            ],
            jumps: [],
            answerMarker: {
              x: -47,
              text: "-47"
            },
            explanation: "Use the equal intervals on each number line to find the missing value."
          }
        }
      }
    },
    {
      questionNumber: "2",
      questionText: "Peter has a bank balance of -$32.",
      criteria: [
        { text: "Correctly interprets a negative bank balance", marks: 1 },
        { text: "Correctly calculates the new balance", marks: 1 }
      ],
      solution: {
        type: "mixed",
        steps: [
          {
            expression: "-32",
            reason: "A negative balance means Peter owes money"
          },
          {
            expression: "-32 + 50 = 18",
            reason: "Add the $50 payment to the starting balance"
          }
        ],
        finalAnswer: "(a) Peter could owe the bank $32. (b) $18",
        diagram: {
          engine: "integer-number-line-solution",
          config: {
            title: "-32 + 50",
            xmin: -35,
            xmax: 20,
            tickStep: 5,
            labels: [-32, 0, 18],
            points: [
              { x: -32, kind: "start", label: "-32", dy: 42 },
              { x: 0, kind: "end", label: "0", dy: 42 },
              { x: 18, kind: "end", label: "18", dy: 42 }
            ],
            jumps: [
              { from: -32, to: 0, label: "+32" },
              { from: 0, to: 18, label: "+18", height: 72 }
            ],
            answerMarker: {
              x: 18,
              text: "$18"
            },
            explanation: "Start at -32, move forward 32 to 0, then move forward the remaining 18."
          }
        }
      }
    }
  ]
};

renderWorkedSolution("app", workedSolutionData);
