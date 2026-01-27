(() => {
  const c = document.getElementById("c");
  const ctx = c.getContext("2d");
  const btn = document.getElementById("b");

  let y = 250;
  let v = 0;
  let score = 0;
  let started = false;
  let over = false;

  const GRAV = 0.55;
  const JUMP = -9.0;

  const flap = () => {
    if (over) return;
    started = true;
    v = JUMP;
  };

  btn.addEventListener("click", flap);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      flap();
    }
  });

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);

    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, c.width, c.height);

    // bird
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(70, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // text
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 24px system-ui";
    ctx.fillText(String(score), 20, 40);

    if (!started) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px system-ui";
      ctx.fillText("Click/Tap or SPACE to start", 70, 260);
    }

    if (over) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 26px system-ui";
      ctx.fillText("Game Over", 140, 240);
      ctx.font = "bold 16px system-ui";
      ctx.fillText("Refresh to retry (placeholder runtime)", 85, 275);
    }
  }

  function tick() {
    if (started && !over) {
      v += GRAV;
      y += v;

      if (y < 15 || y > c.height - 15) {
        over = true;
      } else {
        // placeholder scoring: time-based
        score += 1;
      }
    }

    draw();
    requestAnimationFrame(tick);
  }

  tick();
})();
