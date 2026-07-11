import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  updateDoc,
  where,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyAdVUx01LVyEryGe68DBA1bKYy1nJpaoSM",
  authDomain: "spin-wheel-event.firebaseapp.com",
  projectId: "spin-wheel-event",
  storageBucket: "spin-wheel-event.firebasestorage.app",
  messagingSenderId: "648780092521",
  appId: "1:648780092521:web:860ba346bf462031797ef8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* Admin PIN */
const ADMIN_PIN = "1111";
let adminUnlocked = false;

/* Wheel segments */
const SEGMENTS = [
  {
    prizeId: "fifty_off",
    label: "50% Off\nVoucher",
    emoji: "🏷️",
    fill: "#5B7A4E",
    text: "#FFFFFF",
    result: "50% Off Voucher",
    note: "Show this screen to the cashier to redeem your 50% off voucher on your next purchase.",
    goodluck: false,
  },
  {
    prizeId: "good_luck",
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#F9F4EC",
    text: "#2B2B2B",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
  {
    prizeId: "soft_serve",
    label: "Free\nMini Waffle\nSoft Serve",
    emoji: "🍦",
    fill: "#C9963A",
    text: "#FFFFFF",
    result: "Free Mini Waffle Soft Serve",
    note: "Show this screen to the cashier to claim your free Mini Waffle Soft Serve!",
    goodluck: false,
  },
  {
    prizeId: "free_drink",
    label: "Free\n1 Drink",
    emoji: "🍵",
    fill: "#E8C9AA",
    text: "#2B2B2B",
    result: "Free 1 Drink",
    note: "Choose either a Houjicharamisu or Wakoucharamisu. Show this screen to the cashier to claim your free drink!",
    goodluck: false,
  },
  {
    prizeId: "fifty_off",
    label: "50% Off\nVoucher",
    emoji: "🏷️",
    fill: "#5B7A4E",
    text: "#FFFFFF",
    result: "50% Off Voucher",
    note: "Show this screen to the cashier to redeem your 50% off voucher on your next purchase.",
    goodluck: false,
  },
  {
    prizeId: "good_luck",
    label: "Good\nLuck",
    emoji: "🍀",
    fill: "#D4B896",
    text: "#2B2B2B",
    result: "Good Luck!",
    note: "",
    goodluck: true,
  },
  {
    prizeId: "free_drink",
    label: "Free\n1 Drink",
    emoji: "🍵",
    fill: "#8BAE7B",
    text: "#FFFFFF",
    result: "Free 1 Drink",
    note: "Choose either a Houjicharamisu or Wakoucharamisu. Show this screen to the cashier to claim your free drink!",
    goodluck: false,
  },
  {
    prizeId: "good_luck",
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
let prizeStatus = {};

/* Load prize data from Firestore */
async function loadPrizeStatus() {
  const snapshot = await getDocs(collection(db, "prizes"));

  prizeStatus = {};

  snapshot.forEach((docSnap) => {
    prizeStatus[docSnap.id] = docSnap.data();
  });

  drawWheel(currentRotation);
}

/* Check if prize is available */
function isPrizeAvailable(prizeId) {
  const prize = prizeStatus[prizeId];

  if (!prize) return false;
  if (prize.active === false) return false;
  if (Number(prize.won) >= Number(prize.limit)) return false;

  return true;
}

/* Get available wheel slice indexes */
function getAvailableSegmentIndexes() {
  const availableIndexes = [];

  SEGMENTS.forEach((segment, index) => {
    if (isPrizeAvailable(segment.prizeId)) {
      availableIndexes.push(index);
    }
  });

  return availableIndexes;
}

/* Pick random available winner */
function pickAvailableWinnerIndex() {
  const availableIndexes = getAvailableSegmentIndexes();

  if (availableIndexes.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableIndexes.length);
  return availableIndexes[randomIndex];
}

/* Reserve prize and save history */
async function reservePrize(segment) {
  const prizeRef = doc(db, "prizes", segment.prizeId);
  const historyRef = doc(collection(db, "spin_history"));

  await runTransaction(db, async (transaction) => {
    const prizeSnap = await transaction.get(prizeRef);

    if (!prizeSnap.exists()) {
      throw new Error("Prize does not exist in Firestore.");
    }

    const prize = prizeSnap.data();
    const currentWon = Number(prize.won || 0);
    const prizeLimit = Number(prize.limit || 0);

    if (prize.active === false) {
      throw new Error(`${segment.result} is inactive.`);
    }

    if (currentWon >= prizeLimit) {
      throw new Error(`${segment.result} has reached the limit.`);
    }

    transaction.update(prizeRef, {
      won: currentWon + 1,
    });

    transaction.set(historyRef, {
      prizeId: segment.prizeId,
      prizeName: segment.result,
      isGoodLuck: segment.goodluck,
      createdAt: serverTimestamp(),
      source: "spin_wheel_tablet",
    });
  });
}

/* Draw wheel */
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

    const available = isPrizeAvailable(seg.prizeId);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();

    ctx.fillStyle = available ? seg.fill : "#B8B8B8";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = available ? seg.text : "#FFFFFF";

    const displayLabel = available ? seg.label : "Sold\nOut";
    const lines = displayLabel.split("\n");

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
    ctx.fillText(available ? seg.emoji : "❌", R * 0.28, 8);

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

/* Spin logic */
async function spinWheel() {
  if (spinning) return;

  spinning = true;

  const btn = document.getElementById("spinBtn");
  btn.disabled = true;
  btn.textContent = "CHECKING PRIZES...";

  try {
    await loadPrizeStatus();

    const winner = pickAvailableWinnerIndex();

    if (winner === null) {
      alert("All prizes are finished. Please check the admin prize stock.");
      spinning = false;
      btn.disabled = false;
      btn.textContent = "SPIN THE WHEEL";
      return;
    }

    const winnerSegment = SEGMENTS[winner];

    await reservePrize(winnerSegment);
    await loadPrizeStatus();

    btn.textContent = "SPINNING...";

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
  } catch (error) {
    console.error(error);

    alert(
      "Something went wrong while saving the spin result. Please check Firestore setup."
    );

    spinning = false;
    btn.disabled = false;
    btn.textContent = "SPIN THE WHEEL";
  }
}

/* Show result popup */
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

  renderAdminDashboard().catch(console.error);
}

/* Admin dashboard helpers */
function getPrizeDisplayOrder() {
  return ["fifty_off", "soft_serve", "free_drink", "good_luck"];
}

function getPrizeFallbackName(prizeId) {
  const names = {
    fifty_off: "50% Off Voucher",
    soft_serve: "Free Mini Waffle Soft Serve",
    free_drink: "Free 1 Drink",
    good_luck: "Good Luck",
  };

  return names[prizeId] || prizeId;
}

function getTodayDateRange() {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );

  return {
    startOfToday,
    startOfTomorrow,
  };
}

async function renderAdminDashboard() {
  const adminStats = document.getElementById("adminStats");
  const historyList = document.getElementById("historyList");
  const adminTodayTotal = document.getElementById("adminTodayTotal");

  if (!adminStats || !historyList) return;

  await loadPrizeStatus();

  const { startOfToday, startOfTomorrow } = getTodayDateRange();

  const todayTotalQuery = query(
    collection(db, "spin_history"),
    where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
    where("createdAt", "<", Timestamp.fromDate(startOfTomorrow)),
    orderBy("createdAt", "asc")
  );

  const todayTotalSnapshot = await getDocs(todayTotalQuery);

  if (adminTodayTotal) {
    adminTodayTotal.textContent = `Total Spins Today: ${todayTotalSnapshot.size}`;
  }

  const order = getPrizeDisplayOrder();

  adminStats.innerHTML = order
    .map((prizeId) => {
      const prize = prizeStatus[prizeId];

      if (!prize) {
        return `
          <div class="admin-card">
            <div class="admin-card-title">${getPrizeFallbackName(prizeId)}</div>
            <div class="admin-card-info">Not found in Firestore</div>
          </div>
        `;
      }

      const won = Number(prize.won || 0);
      const prizeLimit = Number(prize.limit || 0);
      const remaining = Math.max(prizeLimit - won, 0);
      const percent =
        prizeLimit > 0 ? Math.min((won / prizeLimit) * 100, 100) : 0;

      return `
        <div class="admin-card">
          <div class="admin-card-title">
            ${prize.name || getPrizeFallbackName(prizeId)}
          </div>

          <div class="admin-card-info">
            Won: ${won} / ${prizeLimit} &nbsp; | &nbsp; Remaining: ${remaining}
          </div>

          <div class="admin-progress">
            <div class="admin-progress-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const historyQuery = query(
    collection(db, "spin_history"),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  const historySnapshot = await getDocs(historyQuery);

  if (historySnapshot.empty) {
    historyList.innerHTML = `<div class="history-empty">No spin history yet.</div>`;
    return;
  }

  let historyHtml = "";

  historySnapshot.forEach((docSnap) => {
    const item = docSnap.data();

    let timeText = "Just now";

    if (item.createdAt && item.createdAt.toDate) {
      timeText = item.createdAt.toDate().toLocaleString();
    }

    historyHtml += `
      <div class="history-item">
        <strong>${item.prizeName}</strong><br>
        ${timeText}
      </div>
    `;
  });

  historyList.innerHTML = historyHtml;
}

/* Reset prize counts */
async function resetPrizeCounts() {
  const pin = prompt("Enter 4-digit PIN to reset prize counts:");

  if (pin !== ADMIN_PIN) {
    alert("Incorrect PIN. Reset cancelled.");
    return;
  }

  const resetText = prompt(
    "Type RESET to confirm resetting all prize counts to 0:"
  );

  if (resetText !== "RESET") {
    alert("Reset cancelled. You must type RESET exactly.");
    return;
  }

  const resetBtn = document.getElementById("adminResetBtn");

  try {
    if (resetBtn) {
      resetBtn.disabled = true;
      resetBtn.textContent = "Resetting...";
    }

    const prizeIds = ["good_luck", "fifty_off", "soft_serve", "free_drink"];

    await Promise.all(
      prizeIds.map((prizeId) =>
        updateDoc(doc(db, "prizes", prizeId), {
          won: 0,
        })
      )
    );

    await loadPrizeStatus();
    await renderAdminDashboard();

    alert("Prize counts have been reset to 0.");
  } catch (error) {
    console.error(error);
    alert("Reset failed. Please check Firestore rules.");
  } finally {
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.textContent = "Reset Prize Counts";
    }
  }
}

/* CSV export helpers */
function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function downloadCsv(filename, rows) {
  const csvContent = rows
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportTodaySpinHistory() {
  const pin = prompt("Enter 4-digit PIN to export today's data:");

  if (pin !== ADMIN_PIN) {
    alert("Incorrect PIN. Export cancelled.");
    return;
  }

  const exportBtn = document.getElementById("adminExportBtn");

  try {
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.textContent = "Exporting...";
    }

    const now = new Date();
    const { startOfToday, startOfTomorrow } = getTodayDateRange();

    const todayQuery = query(
      collection(db, "spin_history"),
      where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
      where("createdAt", "<", Timestamp.fromDate(startOfTomorrow)),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(todayQuery);

    if (snapshot.empty) {
      alert("No spin history found for today.");
      return;
    }

    const rows = [
      ["No.", "Date", "Time", "Prize ID", "Prize Name", "Prize Type", "Source"],
    ];

    const summary = {
      total: 0,
      good_luck: 0,
      fifty_off: 0,
      soft_serve: 0,
      free_drink: 0,
    };

    let counter = 1;

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();

      let dateText = "";
      let timeText = "";

      if (item.createdAt && item.createdAt.toDate) {
        const createdDate = item.createdAt.toDate();

        dateText = createdDate.toISOString().slice(0, 10);
        timeText = createdDate.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
      }

      const prizeType = item.isGoodLuck === true ? "Good Luck" : "Prize";

      rows.push([
        counter,
        dateText,
        timeText,
        item.prizeId || "",
        item.prizeName || "",
        prizeType,
        item.source || "",
      ]);

      summary.total += 1;

      if (summary[item.prizeId] !== undefined) {
        summary[item.prizeId] += 1;
      }

      counter++;
    });

    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Total Spins", summary.total]);
    rows.push(["Good Luck", summary.good_luck]);
    rows.push(["50% Off Voucher", summary.fifty_off]);
    rows.push(["Free Mini Waffle Soft Serve", summary.soft_serve]);
    rows.push(["Free 1 Drink", summary.free_drink]);

    const datePart = now.toISOString().slice(0, 10);
    downloadCsv(`spin-history-summary-${datePart}.csv`, rows);

    alert("Today's filtered spin history CSV has been downloaded.");
  } catch (error) {
    console.error(error);
    alert("Export failed. Please check Firestore rules or index settings.");
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = "Export Today CSV";
    }
  }
}

/* Button events */
document.getElementById("spinBtn").addEventListener("click", spinWheel);

document.getElementById("closeBtn").addEventListener("click", async () => {
  document.getElementById("overlay").classList.remove("show");

  const btn = document.getElementById("spinBtn");
  btn.disabled = false;
  btn.textContent = "SPIN THE WHEEL";

  currentRotation = -Math.PI / 2;

  await loadPrizeStatus();
});

const adminToggleBtn = document.getElementById("adminToggleBtn");
const adminCloseBtn = document.getElementById("adminCloseBtn");
const adminPanel = document.getElementById("adminPanel");
const adminResetBtn = document.getElementById("adminResetBtn");
const adminExportBtn = document.getElementById("adminExportBtn");

if (adminToggleBtn && adminPanel) {
  adminToggleBtn.addEventListener("click", async () => {
    if (!adminUnlocked) {
      const pin = prompt("Enter 4-digit admin PIN:");

      if (pin !== ADMIN_PIN) {
        alert("Incorrect PIN.");
        return;
      }

      adminUnlocked = true;
    }

    adminPanel.classList.add("show");
    await renderAdminDashboard();
  });
}

if (adminCloseBtn && adminPanel) {
  adminCloseBtn.addEventListener("click", () => {
    adminPanel.classList.remove("show");
  });
}

if (adminResetBtn) {
  adminResetBtn.addEventListener("click", resetPrizeCounts);
}

if (adminExportBtn) {
  adminExportBtn.addEventListener("click", exportTodaySpinHistory);
}

/* First load */
const btn = document.getElementById("spinBtn");

btn.disabled = true;
btn.textContent = "LOADING...";

loadPrizeStatus()
  .then(() => {
    btn.disabled = false;
    btn.textContent = "SPIN THE WHEEL";
    renderAdminDashboard().catch(console.error);
  })
  .catch((error) => {
    console.error(error);
    btn.disabled = true;
    btn.textContent = "FIRESTORE ERROR";
    alert("Could not connect to Firestore. Please check your Firebase setup.");
    drawWheel(currentRotation);
  });