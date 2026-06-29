const SEGMENTS = [
  {
    label: "50% Off\nVoucher",
    emoji: "🏷️",
    fill: "#5B7A4E",
    text: "#FFFFFF",
    result: "50% Off Voucher",
    note: "Show this screen to the cashier to redeem your 50% off voucher on your next purchase.",
    goodluck: false,
  },
  {
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#F9F4EC",
    text: "#2B2B2B",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
  {
    label: "Free\nMini Waffle\nSoft Serve",
    emoji: "🍦",
    fill: "#C9963A",
    text: "#FFFFFF",
    result: "Free Mini Waffle Soft Serve",
    note: "Show this screen to the cashier to claim your free Mini Waffle Soft Serve!",
    goodluck: false,
  },
  {
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#E8C9AA",
    text: "#2B2B2B",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
  {
    label: "50% Off\nVoucher",
    emoji: "🏷️",
    fill: "#5B7A4E",
    text: "#FFFFFF",
    result: "50% Off Voucher",
    note: "Show this screen to the cashier to redeem your 50% off voucher on your next purchase.",
    goodluck: false,
  },
  {
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#D4B896",
    text: "#2B2B2B",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
  {
    label: "Free\n1 Drink",
    emoji: "🍵",
    fill: "#8BAE7B",
    text: "#FFFFFF",
    result: "Free 1 Drink",
    note: "Choose either a Houjicharamisu or Wakoucharamisu. Show this screen to the cashier to claim your free drink!",
    goodluck: false,
  },
  {
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#3D5C36",
    text: "#FFFFFF",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
];

const N = SEGMENTS.length;
const arc = (2 * Math.PI) / N;

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const SIZE = canvas.width;
const cx = SIZE / 2;
const cy = SIZE / 2;
const R = SIZE / 2 - 8;

let currentRotation = -Math.PI / 2;
let spinning = false;

function drawWheel(rotation) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  ctx.beginPath();
  ctx.arc(cx, cy, R + 6, 0, 2 * Math.PI);
  ctx.fillStyle = "#C9963A";
  ctx.fill();

  for (let i = 0; i < N; i++) {
    const start = rotation + i * arc;
    const end = start + arc;
    const seg = SEGMENTS[i];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.fill;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = seg.text;

    const lines = seg.label.split("\n");
    const lineH = lines.length > 2 ? 22 : 26;
    const baseX = R * 0.84;

    lines.forEach((line, li) => {
      const isFirst = li === 0;

      ctx.font = isFirst
        ? `700 ${lines.length > 2 ? 17 : 20}px 'DM Sans', sans-serif`
        : `500 ${lines.length > 2 ? 14 : 17}px 'DM Sans', sans-serif`;

      const y = (li - (lines.length - 1) / 2) * lineH;
      ctx.fillText(line, baseX, y + 5);
    });

    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.fillText(seg.emoji, R * 0.28, 8);

    ctx.restore();
  }

  const grad = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.08)");

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 4);
}

function spinWheel() {
  if (spinning) return;

  spinning = true;

  const btn = document.getElementById("spinBtn");
  btn.disabled = true;

  const winner = Math.floor(Math.random() * N);

  const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
  const targetAngle = -(winner * arc + arc / 2) - Math.PI / 2;

  let fullTarget =
    extraSpins + ((targetAngle - currentRotation) % (2 * Math.PI));

  if (fullTarget < extraSpins - 0.1) {
    fullTarget += 2 * Math.PI;
  }

  const startRotation = currentRotation;
  const duration = 4500 + Math.random() * 1000;
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOut(t);

    currentRotation = startRotation + fullTarget * eased;
    drawWheel(currentRotation);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      showResult(winner);
    }
  }

  requestAnimationFrame(frame);
}

function showResult(idx) {
  const seg = SEGMENTS[idx];

  document.getElementById("resEmoji").textContent = seg.emoji;
  document.getElementById("resTitle").textContent = seg.result;

  const noteEl = document.getElementById("resNote");
  const glNote = document.getElementById("glNote");

  if (seg.goodluck) {
    noteEl.textContent =
      "Don't be sad — as a thank-you, we're giving you a 20% off voucher for your next visit! 💚";
    glNote.textContent =
      "Show this screen to the cashier to claim your 20% off voucher.";
  } else {
    noteEl.textContent = seg.note;
    glNote.textContent = "";
  }

  document.getElementById("overlay").classList.add("show");
}

document.getElementById("spinBtn").addEventListener("click", spinWheel);

document.getElementById("closeBtn").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("show");

  const btn = document.getElementById("spinBtn");
  btn.disabled = false;

  currentRotation = -Math.PI / 2;
  drawWheel(currentRotation);
});

drawWheel(currentRotation);
