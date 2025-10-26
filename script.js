function initCakeAnimation() {
  const layers = document.querySelectorAll(".cake-layer");
  const delayBetweenLayers = 700;

  layers.forEach((layer, index) => {
    setTimeout(() => {
      layer.classList.add("active");
    }, index * delayBetweenLayers);
  });
}

function initLighterCursor() {
  const overlay = document.querySelector(".darkness-overlay");
  const lighterCursor = document.querySelector(".lighter-cursor");

  document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    overlay.style.setProperty("--mouse-x", `${x}%`);
    overlay.style.setProperty("--mouse-y", `${y}%`);

    lighterCursor.style.left = `${e.clientX}px`;
    lighterCursor.style.top = `${e.clientY}px`;
  });
}

function initCandleLighting() {
  const candles = document.querySelectorAll(".candle-svg");
  const overlay = document.querySelector(".darkness-overlay");
  let litCount = 0;
  const totalCandles = candles.length;

  overlay.addEventListener("mousemove", (e) => {
    const rect = e.target.getBoundingClientRect();
    candles.forEach((candle) => {
      const flameGroup = candle.querySelector(".flame-group");
      if (!flameGroup) return;

      const flameRect = flameGroup.getBoundingClientRect();
      const flameX = flameRect.left + flameRect.width / 2;
      const flameY = flameRect.top + flameRect.height / 2;

      const distance = Math.sqrt(Math.pow(e.clientX - flameX, 2) + Math.pow(e.clientY - flameY, 2));

      if (distance < 30 && !candle.classList.contains("lit")) {
        candle.classList.add("lit");
        litCount++;
        updateOverlayOpacity();

        if (litCount === totalCandles) {
          document.body.style.cursor = "auto";
          const lighterCursor = document.querySelector(".lighter-cursor");
          lighterCursor.style.opacity = "0";

          if (typeof confetti !== "undefined") {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, shapes: ["circle"], particleCount: 100 };

            const interval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              confetti({
                ...defaults,
                origin: { x: Math.random(), y: Math.random() * 0.5 },
              });
            }, 500);
          }

          setTimeout(() => {
            const message = document.querySelector(".message");
            message.classList.add("show");
          }, 500);
        }
      }
    });
  });

  function updateOverlayOpacity() {
    const progress = litCount / totalCandles;
    const opacity = 1 - progress;
    overlay.style.setProperty("--overlay-opacity", opacity);
  }
}

function initBlowOutCandles() {
  const candles = document.querySelectorAll(".candle-svg");
  const overlay = document.querySelector(".darkness-overlay");

  const threshold = 0.25;
  const cooldown = 3000;
  let lastBlowTime = 0;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const data = new Uint8Array(analyser.fftSize);

      source.connect(analyser);

      function detectBlow() {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        const volume = Math.sqrt(sum / data.length);

        const now = Date.now();
        if (volume > threshold && now - lastBlowTime > cooldown) {
          lastBlowTime = now;
          blowOutCandles();
        }

        requestAnimationFrame(detectBlow);
      }

      detectBlow();
    })
    .catch((err) => {
      console.warn("Brak dostępu do mikrofonu:", err);
    });

  function blowOutCandles() {
    candles.forEach((candle) => candle.classList.remove("lit"));
    overlay.style.setProperty("--overlay-opacity", 0.9);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initCakeAnimation();
  }, 300);

  initLighterCursor();

  setTimeout(() => {
    initCandleLighting();
    initBlowOutCandles();
  }, 5500);
});
