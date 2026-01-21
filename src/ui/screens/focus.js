let timer = null;
let secondsLeft = 0;

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function renderFocus() {
  return `
    <h2>Focus Mode</h2>

    <label>
      Focus duration (minutes):
      <input type="number" id="focus-minutes" min="1" value="25" />
    </label>

    <br /><br />

    <label>
      <input type="checkbox" id="strict-mode" />
      Enable Strict Focus Mode
    </label>

    <br /><br />

    <button id="start-focus">Start Focus</button>
    <button id="stop-focus" disabled>Stop</button>

    <h3 id="focus-timer">00:00</h3>
  `;
}


export function attachFocusEvents() {
  const startBtn = document.getElementById("start-focus");
  const stopBtn = document.getElementById("stop-focus");
  const timerEl = document.getElementById("focus-timer");

  if (!startBtn || !stopBtn || !timerEl) return;

  startBtn.addEventListener("click", () => {
    const mins = parseInt(document.getElementById("focus-minutes").value, 10);
    if (!mins || mins <= 0) return;

    secondsLeft = mins * 60;
    timerEl.textContent = formatTime(secondsLeft);

    startBtn.disabled = true;
    stopBtn.disabled = false;

    timer = setInterval(() => {
      secondsLeft--;
      timerEl.textContent = formatTime(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timer);
        timer = null;
        alert("Focus session completed 🎉");
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    }, 1000);
  });

 stopBtn.addEventListener("click", () => {
    const strict = document.getElementById("strict-mode").checked;

    if (strict) {
        const confirm1 = confirm("You are in Strict Focus Mode. Do you really want to stop?");
        if (!confirm1) return;

        const confirm2 = confirm("Stopping early reduces discipline. Stop anyway?");
        if (!confirm2) return;
    }

    clearInterval(timer);
    timer = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    timerEl.textContent = "00:00";
    });

}
