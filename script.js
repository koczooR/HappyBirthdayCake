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
  const totalCandles = candles.length;

  if (!window.candleLightingData) {
    window.candleLightingData = { litCount: 0 };
  }

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
        window.candleLightingData.litCount++;
        updateOverlayOpacity();

        if (window.candleLightingData.litCount === totalCandles) {
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

            if (window.microphonePermissionGranted) {
              const blowInstruction = document.querySelector(".blow-instruction");
              if (blowInstruction) {
                blowInstruction.classList.add("show");
              }
            }
          }, 500);
        }
      }
    });
  });

  function updateOverlayOpacity() {
    const progress = window.candleLightingData.litCount / totalCandles;
    const opacity = 1 - progress;
    overlay.style.setProperty("--overlay-opacity", opacity);
  }
}

function initBlowOutCandles() {
  const candles = document.querySelectorAll(".candle-svg");
  const overlay = document.querySelector(".darkness-overlay");

  const threshold = 0.1; // Niższy threshold dla telefonów
  const cooldown = 3000;
  let lastBlowTime = 0;
  let audioContext = null;
  let isListening = false;

  function startAudioDetection() {
    if (isListening) return;

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Włączone dla lepszej kompatybilności z mobile
        },
      })
      .then((stream) => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Wznów AudioContext na mobile (wymóg dla iOS/Android)
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        isListening = true;

        window.microphonePermissionGranted = true;

        function detectBlow() {
          if (!isListening) return;

          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;
          let max = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const value = Math.abs((dataArray[i] - 128) / 128);
            sum += value * value;
            max = Math.max(max, value);
          }
          const rms = Math.sqrt(sum / dataArray.length);

          const now = Date.now();
          // Niższy próg dla max (0.3 zamiast 0.5) dla lepszej czułości na mobile
          if ((rms > threshold || max > 0.3) && now - lastBlowTime > cooldown) {
            console.log("Wykryto dmuchnięcie! RMS:", rms, "MAX:", max);
            lastBlowTime = now;
            blowOutCandles();
          }

          requestAnimationFrame(detectBlow);
        }

        detectBlow();
      })
      .catch((err) => {
        console.error("Błąd dostępu do mikrofonu:", err);
        alert("Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.");
      });
  }

  const startEvents = ["click", "touchstart", "mousedown"];
  startEvents.forEach((event) => {
    document.addEventListener(event, startAudioDetection, { once: true });
  });

  function blowOutCandles() {
    candles.forEach((candle) => candle.classList.remove("lit"));

    overlay.style.setProperty("--overlay-opacity", 1);

    if (window.candleLightingData) {
      window.candleLightingData.litCount = 0;
    }

    document.body.style.cursor = "none";
    const lighterCursor = document.querySelector(".lighter-cursor");
    if (lighterCursor) {
      lighterCursor.style.opacity = "1";
    }

    const blowInstruction = document.querySelector(".blow-instruction");
    const message = document.querySelector(".message");

    if (blowInstruction) {
      blowInstruction.classList.remove("show");
    }

    if (message) {
      message.classList.remove("show");
    }
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
