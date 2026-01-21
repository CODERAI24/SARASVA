import { getAppState, setAppState } from "../../storage/appState.js";

/* ------------------ helpers ------------------ */

function activeSubjects(state) {
  return (state.subjects || []).filter(s => !s.archived);
}

function subjectName(state, id) {
  return state.subjects.find(s => s.id === id)?.name || id;
}

function overallProgress(chapter) {
  return Math.round((chapter.theory + chapter.practice) / 2);
}

function priorityScore(chapter) {
  const completion = (chapter.theory + chapter.practice) / 2;
  return Math.round((100 - completion) * chapter.weight);
}

/* ------------------ render ------------------ */

export function renderExams() {
  const state = getAppState();
  const exams = state.exams || [];
  const subjects = activeSubjects(state);

  /* Smart insights */
  const attention = [];

  exams.forEach(exam => {
    (exam.subjects || []).forEach(subj => {
      (subj.chapters || []).forEach(ch => {
        if (priorityScore(ch) > 40) {
          attention.push({
            exam: exam.name,
            subject: subjectName(state, subj.subjectId),
            chapter: ch.name,
            score: priorityScore(ch)
          });
        }
      });
    });
  });

  const attentionHtml = attention.length
    ? `
      <h3>Needs Attention</h3>
      <ul>
        ${attention.map(a => `
          <li>
            ${a.exam} → ${a.subject} → ${a.chapter}
            (Priority ${a.score})
          </li>
        `).join("")}
      </ul>
      <hr />
    `
    : "";

  /* Exams UI */
  const examHtml = exams.map(exam => {
    const subjectHtml = (exam.subjects || []).map(subj => {
      const chapters = subj.chapters || [];

      const chapterList = chapters.length
        ? chapters.map(ch => `
            <li>
              ${ch.name} —
              Theory: ${ch.theory}% |
              Practice: ${ch.practice}% |
              <strong>${overallProgress(ch)}%</strong>
            </li>
          `).join("")
        : "<li>No chapters yet.</li>";

      return `
        <div style="margin-left:16px;">
          <h4>${subjectName(state, subj.subjectId)}</h4>

          <form
            class="chapter-form"
            data-exam="${exam.id}"
            data-subject="${subj.subjectId}"
          >
            <input placeholder="Chapter name" required />
            <input type="number" placeholder="Theory %" min="0" max="100" required />
            <input type="number" placeholder="Practice %" min="0" max="100" required />
            <button>Add Chapter</button>
          </form>

          <ul>${chapterList}</ul>
        </div>
      `;
    }).join("");

    const subjectOptions = subjects
      .map(s => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    return `
      <section style="margin-bottom:24px;">
        <h3>${exam.name}</h3>

        <form class="exam-subject-form" data-exam="${exam.id}">
          <select required>
            <option value="">Add subject</option>
            ${subjectOptions}
          </select>
          <button>Add</button>
        </form>

        ${subjectHtml || "<p>No subjects yet.</p>"}
      </section>
    `;
  }).join("");

  return `
    <h2>Exam Preparation</h2>
    ${attentionHtml}

    <form id="exam-form">
      <input id="exam-name" placeholder="Exam name" required />
      <button>Add Exam</button>
    </form>

    ${examHtml || "<p>No exams added yet.</p>"}
  `;
}

/* ------------------ events ------------------ */

export function attachExamEvents() {

  /* Add exam */
  const examForm = document.getElementById("exam-form");
  if (examForm) {
    examForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("exam-name").value.trim();
      if (!name) return;

      const state = getAppState();
      state.exams = state.exams || [];

      state.exams.push({
        id: Date.now().toString(),
        name,
        subjects: [],
        createdAt: Date.now()
      });

      setAppState(state);
      location.reload(); // temporary, safe
    });
  }

  /* Add subject to exam */
  document.querySelectorAll(".exam-subject-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const examId = form.dataset.exam;
      const subjectId = form.querySelector("select").value;
      if (!subjectId) return;

      const state = getAppState();
      const exam = state.exams.find(e => e.id === examId);
      if (!exam) return;

      if (!exam.subjects.find(s => s.subjectId === subjectId)) {
        exam.subjects.push({
          subjectId,
          chapters: []
        });
      }

      setAppState(state);
      location.reload();
    });
  });

  /* Add chapter */
  document.querySelectorAll(".chapter-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const examId = form.dataset.exam;
      const subjectId = form.dataset.subject;

      const [nameInput, theoryInput, practiceInput] = form.querySelectorAll("input");

      const chapter = {
        id: Date.now().toString(),
        name: nameInput.value.trim(),
        theory: parseInt(theoryInput.value, 10),
        practice: parseInt(practiceInput.value, 10),
        weight: 1
      };

      const state = getAppState();
      const exam = state.exams.find(e => e.id === examId);
      const subj = exam.subjects.find(s => s.subjectId === subjectId);

      subj.chapters.push(chapter);

      setAppState(state);
      location.reload();
    });
  });
}
