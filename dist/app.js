const CONFIG = {
  weddingDate: new Date("2026-12-06T10:30:00+07:00"),
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const routeName = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
let pathGuest = "";
try {
  pathGuest = decodeURIComponent(routeName || "").trim();
} catch {
  pathGuest = "";
}
if (pathGuest.toLowerCase() === "index.html") pathGuest = "";
const queryGuest = new URLSearchParams(window.location.search).get("guest")?.trim() || "";
const guestName = pathGuest || queryGuest;
const guestBuilder = $("#guestBuilder");
const isBuilderPage = !guestName;
document.body.classList.toggle("is-builder", isBuilderPage);
guestBuilder.hidden = !isBuilderPage;

if (isBuilderPage) {
  const guestForm = $("#guestLinkForm");
  const guestInput = $("#guestNameInput");
  const result = $("#guestLinkResult");
  const linkOutput = $("#guestLinkOutput");
  const previewLink = $("#previewGuestLink");
  const status = $("#builderStatus");

  guestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = guestInput.value.trim().replace(/\s+/g, " ");
    if (!name) return;

    const personalLink = `${window.location.origin}/${encodeURIComponent(name)}`;
    linkOutput.value = personalLink;
    previewLink.href = personalLink;
    result.hidden = false;
    status.textContent = `Đã tạo link riêng cho ${name}.`;
  });

  $("#copyGuestLink").addEventListener("click", async () => {
    if (!linkOutput.value) return;
    try {
      await navigator.clipboard.writeText(linkOutput.value);
      status.textContent = "Đã sao chép link thiệp. Bạn có thể gửi cho khách mời.";
    } catch {
      linkOutput.focus();
      linkOutput.select();
      document.execCommand("copy");
      status.textContent = "Đã sao chép link thiệp. Bạn có thể gửi cho khách mời.";
    }
  });
}

const personalizedGuest = guestName || "Bạn thân mến";
$("#coverGuest").textContent = personalizedGuest;
$("#heroGuest").textContent = personalizedGuest;

const cover = $("#cover");
$("#openInvitation").addEventListener("click", () => {
  cover.classList.add("is-hidden");
  document.body.classList.add("is-open");
  window.setTimeout(() => $("#home").scrollIntoView({ behavior: "smooth", block: "start" }), 180);
});

function renderCalendar() {
  const calendar = $("#calendar");
  const year = CONFIG.weddingDate.getFullYear();
  const month = CONFIG.weddingDate.getMonth();
  const targetDay = CONFIG.weddingDate.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayStart = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let index = 0; index < mondayStart; index += 1) {
    const empty = document.createElement("span");
    empty.className = "empty";
    empty.textContent = "";
    calendar.append(empty);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("span");
    cell.textContent = day;
    if (day === targetDay) {
      cell.className = "wedding-day";
      cell.setAttribute("aria-label", `Ngày cưới ${day} tháng ${month + 1}`);
    }
    calendar.append(cell);
  }
}
renderCalendar();

function updateCountdown() {
  const remaining = CONFIG.weddingDate.getTime() - Date.now();
  const safe = Math.max(0, remaining);
  const units = {
    days: Math.floor(safe / 86400000),
    hours: Math.floor((safe / 3600000) % 24),
    minutes: Math.floor((safe / 60000) % 60),
    seconds: Math.floor((safe / 1000) % 60),
  };
  Object.entries(units).forEach(([key, value]) => {
    const node = $(`[data-unit="${key}"]`);
    if (node) node.textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.1 });
$$('.reveal').forEach((element) => observer.observe(element));

$$('[data-choice]').forEach((button) => {
  button.addEventListener("click", () => {
    $$('[data-choice]').forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

const lightbox = $("#lightbox");
const lightboxImage = $("#lightboxImage");
const lightboxCaption = $("#lightboxCaption");
$$('.gallery-item').forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImage.src = item.dataset.image;
    lightboxImage.alt = item.querySelector("img").alt;
    lightboxCaption.textContent = item.dataset.caption;
    lightbox.hidden = false;
  });
});

const giftModal = $("#giftModal");
$("#openGift").addEventListener("click", () => { giftModal.hidden = false; });
$$('[data-close]').forEach((button) => {
  button.addEventListener("click", () => { $(`#${button.dataset.close}`).hidden = true; });
});
$$('.modal').forEach((modal) => modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.hidden = true;
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") $$('.modal').forEach((modal) => { modal.hidden = true; });
});

$("#focusRsvp").addEventListener("click", () => $("#rsvp").scrollIntoView({ behavior: "smooth" }));

const form = $("#rsvpForm");
const wishList = $("#wishList");
const formNote = $("#formNote");
const toast = $("#toast");
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const sender = $("#sender").value.trim();
  const nickname = $("#nickname").value.trim();
  const message = $("#message").value.trim() || "Chúc hai bạn trăm năm hạnh phúc!";
  const choice = $(".choice.active").dataset.choice;
  const attendance = $("#attendance").value;
  const wish = document.createElement("article");
  wish.className = "wish-card";
  wish.innerHTML = `<p>“${message.replace(/[<>]/g, "")}”</p><span>— ${sender.replace(/[<>]/g, "")}${nickname ? ` · ${nickname}` : ""} · gửi đến ${choice}</span>`;
  wishList.prepend(wish);
  formNote.textContent = `Cảm ơn ${sender}! Chúng mình đã nhận được lời chúc và ghi nhận: ${attendance.toLowerCase()}.`;
  form.reset();
  $$(".choice").forEach((item) => item.classList.remove("active"));
  $(".choice").classList.add("active");
  showToast("Đã gửi lời chúc đến cô dâu chú rể ♡");
  window.setTimeout(() => wish.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
});

const musicToggle = $("#musicToggle");
let audioContext;
let oscillator;
musicToggle.addEventListener("click", () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 261.63;
    gain.gain.value = 0.015;
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-pressed", "true");
    showToast("Nhạc nền đã bật");
  } else if (audioContext.state === "running") {
    audioContext.suspend();
    musicToggle.classList.remove("is-playing");
    musicToggle.setAttribute("aria-pressed", "false");
  } else {
    audioContext.resume();
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-pressed", "true");
  }
});
