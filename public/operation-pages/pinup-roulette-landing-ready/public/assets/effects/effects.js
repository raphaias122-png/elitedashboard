(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = Math.min(window.innerWidth, window.innerHeight) < 700;
  var canvas = null;
  var ctx = null;
  var flash = null;
  var particles = [];
  var raf = 0;
  var audioCtx = null;
  var spinTickTimers = [];
  var leadTimer = null;
  var firstAutoSpinTimer = null;
  var secondAutoSpinTimer = null;
  var userStartedWheel = false;
  var lastTime = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.6);

  var colors = ["#fff27a", "#ff394a", "#18f7ff", "#ff9f1c", "#ffffff", "#8cff4a"];

  function ensureLayer() {
    if (canvas || reduceMotion) return;

    canvas = document.createElement("canvas");
    canvas.className = "fx-layer is-idle";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    flash = document.createElement("div");
    flash.className = "fx-flash";
    flash.setAttribute("aria-hidden", "true");
    document.body.appendChild(flash);

    ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    resize();
    window.addEventListener("resize", resize, { passive: true });
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.35 : 1.6);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function burst(x, y, amount, power, fullScreen) {
    ensureLayer();
    if (!canvas) return;

    var cap = isMobile ? 210 : 360;
    var count = Math.min(amount, cap - particles.length);
    var now = performance.now();

    for (var i = 0; i < count; i += 1) {
      var angle = fullScreen ? rand(-Math.PI, Math.PI) : (Math.PI * 2 * i) / count + rand(-0.28, 0.28);
      var speed = rand(power * 0.28, power);
      var square = Math.random() > 0.45;
      particles.push({
        x: fullScreen ? rand(0, window.innerWidth) : x,
        y: fullScreen ? rand(0, window.innerHeight * 0.8) : y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0.4, 2.2),
        size: rand(isMobile ? 2 : 2.5, isMobile ? 5.5 : 7.5),
        life: rand(620, fullScreen ? 1420 : 1050),
        age: 0,
        color: colors[(Math.random() * colors.length) | 0],
        spin: rand(-0.22, 0.22),
        rot: rand(0, Math.PI),
        square: square,
        born: now,
      });
    }

    startRender();
  }

  function flashScreen() {
    if (!flash) return;
    flash.classList.add("is-active");
    window.setTimeout(function () {
      flash.classList.remove("is-active");
    }, 90);
  }

  function startRender() {
    if (!canvas || raf) return;
    canvas.classList.remove("is-idle");
    lastTime = performance.now();
    raf = requestAnimationFrame(render);
  }

  function render(now) {
    var dt = Math.min(32, now - lastTime);
    lastTime = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";

    for (var i = particles.length - 1; i >= 0; i -= 1) {
      var p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }

      p.vy += 0.018 * dt;
      p.vx *= 0.992;
      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);
      p.rot += p.spin * (dt / 16.67);

      var t = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, t);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = isMobile ? 10 : 16;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.square) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.56, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (particles.length) {
      raf = requestAnimationFrame(render);
      return;
    }

    raf = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    canvas.classList.add("is-idle");
  }

  function audio() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, start, duration, type, volume, endFreq) {
    var ac = audio();
    if (!ac) return;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function clickTick(time, intensity) {
    var ac = audio();
    if (!ac) return;
    var osc = ac.createOscillator();
    var snap = ac.createOscillator();
    var filter = ac.createBiquadFilter();
    var gain = ac.createGain();

    osc.type = "square";
    snap.type = "triangle";
    osc.frequency.setValueAtTime(820 + intensity * 420, time);
    osc.frequency.exponentialRampToValueAtTime(260 + intensity * 140, time + 0.038);
    snap.frequency.setValueAtTime(1800 + intensity * 900, time);
    snap.frequency.exponentialRampToValueAtTime(700, time + 0.018);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(520, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.032 + intensity * 0.025, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(filter);
    snap.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc.start(time);
    snap.start(time);
    osc.stop(time + 0.055);
    snap.stop(time + 0.035);
  }

  function startSpinSound() {
    var ac = audio();
    if (!ac) return;
    stopSpinSound();

    var duration = 3000;
    var elapsed = 0;
    var index = 0;

    while (elapsed < duration) {
      var progress = elapsed / duration;
      var interval = 34 + progress * progress * 138 + Math.random() * (5 + progress * 16);
      var when = ac.currentTime + elapsed / 1000;
      var timer = window.setTimeout(
        (function (scheduledTime, p, i) {
          return function () {
            clickTick(scheduledTime, Math.max(0.18, 1 - p) * (i % 2 ? 0.86 : 1));
          };
        })(when, progress, index),
        elapsed
      );
      spinTickTimers.push(timer);
      elapsed += interval;
      index += 1;
    }
  }

  function stopSpinSound() {
    while (spinTickTimers.length) {
      window.clearTimeout(spinTickTimers.pop());
    }
  }

  function winSound(finalWin) {
    var ac = audio();
    if (!ac) return;
    var now = ac.currentTime;
    var notes = finalWin ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 554.37, 659.25];
    for (var i = 0; i < notes.length; i += 1) {
      tone(notes[i], now + i * 0.075, finalWin ? 0.24 : 0.18, i % 2 ? "triangle" : "sine", finalWin ? 0.06 : 0.045, notes[i] * 1.015);
    }
    if (finalWin) tone(98, now, 0.36, "sine", 0.075, 49);
  }

  function wheelCenter() {
    var el = document.querySelector(".wheel-center-btn") || document.querySelector("#wheel-container");
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function ensurePrizePointer() {
    var wrap = document.querySelector("#wheel-container .wheel-wrap");
    if (!wrap || wrap.querySelector(".wheel-prize-pointer")) return;

    var pointer = document.createElement("img");
    pointer.className = "wheel-prize-pointer";
    pointer.src = "./img/wheel-arrow-clean.png";
    pointer.alt = "";
    pointer.setAttribute("aria-hidden", "true");
    wrap.appendChild(pointer);
  }

  function selectionBurst(finalWin) {
    var center = wheelCenter();
    burst(center.x, center.y, isMobile ? 78 : 130, finalWin ? 8.6 : 6.5, false);
    if (finalWin) {
      flashScreen();
      burst(window.innerWidth / 2, window.innerHeight * 0.45, isMobile ? 145 : 245, 7.8, true);
    }
    winSound(finalWin);
  }

  function runWheel(instance, isAuto) {
    if (!instance || instance.isWheelSpinning || instance.attemptsLeft <= 0) return;

    if (!isAuto) {
      userStartedWheel = true;
    }

    instance.spinWheel(instance.getSpinAngle(), !!isAuto);
  }

  function scheduleFirstAutoSpin(instance) {
    if (firstAutoSpinTimer || !instance || instance.attemptsLeft !== 2) return;

    firstAutoSpinTimer = window.setTimeout(function () {
      firstAutoSpinTimer = null;

      if (!userStartedWheel && instance.attemptsLeft === 2 && !instance.isWheelSpinning) {
        console.info("[Wheel AutoSpin] primeiro giro automatico");
        runWheel(instance, true);
      }
    }, 15000);
  }

  function scheduleSecondAutoSpin(instance) {
    if (secondAutoSpinTimer || !instance || instance.attemptsLeft !== 1) return;

    secondAutoSpinTimer = window.setTimeout(function () {
      secondAutoSpinTimer = null;

      if (instance.attemptsLeft === 1 && !instance.isWheelSpinning) {
        console.info("[Wheel AutoSpin] segundo giro automatico");
        runWheel(instance, true);
      }
    }, 5000);
  }

  function cancelSecondAutoSpin() {
    if (!secondAutoSpinTimer) return;
    window.clearTimeout(secondAutoSpinTimer);
    secondAutoSpinTimer = null;
  }

  function formatCountdown(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function startLeadCountdown(popup) {
    var time = popup.querySelector("[data-lead-countdown]");
    var secondsLeft = 15 * 60;

    if (leadTimer) window.clearInterval(leadTimer);
    if (time) time.textContent = formatCountdown(secondsLeft);

    leadTimer = window.setInterval(function () {
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (time) time.textContent = formatCountdown(secondsLeft);
      if (!secondsLeft && leadTimer) {
        window.clearInterval(leadTimer);
        leadTimer = null;
      }
    }, 1000);
  }

  function showLeadPopup() {
    var existing = document.querySelector(".lead-win-popup");
    if (existing) existing.remove();

    var popup = document.createElement("div");
    popup.className = "lead-win-popup";
    popup.innerHTML = [
      '<div class="lead-win-popup__card" role="dialog" aria-modal="true" aria-label="Bonus Pin-Up Casino">',
      '  <div class="lead-win-popup__timer">Oferta valida por <strong data-lead-countdown>15:00</strong> minutos!</div>',
      '  <button class="lead-win-popup__close" type="button" aria-label="Cerrar">&times;</button>',
      '  <img class="lead-win-popup__logo" src="./img/logo/logo.svg" alt="PIN-UP Casino">',
      '  <p class="lead-win-popup__eyebrow">Ganaste tu bono exclusivo!</p>',
      '  <img class="lead-win-popup__prize" src="./img/title/title-modal.png" alt="5 000 000 CLP + 250 FS">',
      '  <p class="lead-win-popup__deposit">120% DE BONO EN TU PRIMER DEPÓSITO</p>',
      '  <p class="lead-win-popup__copy">Activa tu premio ahora y crea tu cuenta para recibir el bono dentro del casino.</p>',
      '  <a class="lead-win-popup__button js-final-register-button" data-track-lead="true" href="https://toptdspup.com/auuSYQo3/" rel="nofollow noopener"><span>Registrarme</span></a>',
      '  <p class="lead-win-popup__trust">Registro rapido. Bono disponible por tiempo limitado.</p>',
      "</div>",
    ].join("");

    document.body.appendChild(popup);
    startLeadCountdown(popup);

    popup.querySelector(".lead-win-popup__close").addEventListener("click", function () {
      popup.classList.remove("is-open");
    });

    requestAnimationFrame(function () {
      popup.classList.add("is-open");
    });
  }

  function hookWheel() {
    if (!window.wheelInstances || !window.wheelInstances.length) {
      window.setTimeout(hookWheel, 60);
      return;
    }

    ensurePrizePointer();

    window.wheelInstances.forEach(function (instance) {
      if (instance.__fxHooked) return;
      instance.__fxHooked = true;

      var originalSpinWheel = instance.spinWheel;
      var callbacks = instance.settings.callbacks || {};
      var beforePenultimate = callbacks.beforePenultimateSpin;
      var beforeLast = callbacks.beforeLastSpin;
      var afterPenultimate = callbacks.afterPenultimateSpin;
      var afterLast = callbacks.afterLastSpin;

      instance.spinWheel = function (angle, isAuto) {
        if (!isAuto) {
          userStartedWheel = true;
          cancelSecondAutoSpin();
        }

        return originalSpinWheel.call(this, angle, isAuto);
      };

      callbacks.beforePenultimateSpin = function () {
        startSpinSound();
        return beforePenultimate && beforePenultimate.call(this);
      };
      callbacks.beforeLastSpin = function () {
        startSpinSound();
        return beforeLast && beforeLast.call(this);
      };
      callbacks.afterPenultimateSpin = function () {
        stopSpinSound();
        selectionBurst(false);
        var result = afterPenultimate && afterPenultimate.call(this);
        scheduleSecondAutoSpin(instance);
        return result;
      };
      callbacks.afterLastSpin = function () {
        stopSpinSound();
        selectionBurst(true);
        cancelSecondAutoSpin();
        var wrap = document.querySelector(".wheel-wrap");
        if (wrap) wrap.classList.add("wheel-wrap__last-spin");
        window.setTimeout(showLeadPopup, 1150);
      };

      scheduleFirstAutoSpin(instance);
    });
  }

  document.addEventListener(
    "pointerdown",
    function () {
      audio();
      ensureLayer();
    },
    { passive: true, once: true }
  );

  document.addEventListener("DOMContentLoaded", function () {
    ensureLayer();
    hookWheel();
    window.setTimeout(ensurePrizePointer, 120);
  });
})();
