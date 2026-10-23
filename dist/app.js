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

  const excelInput = $("#guestExcel");
  const bulkStatus = $("#bulkStatus");
  const bulkResults = $("#bulkResults");
  const guestLinkRows = $("#guestLinkRows");
  let spreadsheetLibrary;
  let bulkLinks = [];

  function loadSpreadsheetLibrary() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!spreadsheetLibrary) {
      spreadsheetLibrary = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
        script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("Không thể khởi tạo thư viện Excel."));
        script.onerror = () => reject(new Error("Không tải được bộ đọc Excel. Hãy kiểm tra kết nối mạng rồi thử lại."));
        document.head.append(script);
      });
    }
    return spreadsheetLibrary;
  }

  function normalizeColumnName(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function createGuestUrl(name) {
    return `${window.location.origin}/${encodeURIComponent(name)}`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temporary = document.createElement("textarea");
      temporary.value = text;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
    }
  }

  function renderGuestLinks(guests) {
    bulkLinks = guests.map((name) => ({ name, url: createGuestUrl(name) }));
    guestLinkRows.replaceChildren();

    bulkLinks.forEach(({ name, url }) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.className = "bulk-name-cell";
      nameCell.textContent = name;

      const linkCell = document.createElement("td");
      linkCell.className = "bulk-url-cell";
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = url;
      linkCell.append(link);

      const actionCell = document.createElement("td");
      const copyButton = document.createElement("button");
      copyButton.className = "row-copy-button";
      copyButton.type = "button";
      copyButton.textContent = "Sao chép";
      copyButton.setAttribute("aria-label", `Sao chép link của ${name}`);
      copyButton.addEventListener("click", async () => {
        await copyText(url);
        bulkStatus.textContent = `Đã sao chép link của ${name}.`;
      });
      actionCell.append(copyButton);
      row.append(nameCell, linkCell, actionCell);
      guestLinkRows.append(row);
    });

    $("#bulkCount").textContent = `${bulkLinks.length} khách mời`;
    bulkResults.hidden = false;
  }

  $("#downloadExcelTemplate").addEventListener("click", async () => {
    const templateButton = $("#downloadExcelTemplate");
    templateButton.disabled = true;
    bulkStatus.textContent = "Đang chuẩn bị file Excel mẫu…";
    try {
      const XLSX = await loadSpreadsheetLibrary();
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([["Họ và tên"]]);
      worksheet["!cols"] = [{ wch: 32 }];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách khách");
      XLSX.writeFile(workbook, "mau-danh-sach-khach-moi.xlsx", { compression: true });
      bulkStatus.textContent = "Đã tải file mẫu. Điền tên khách bên dưới cột “Họ và tên” rồi chọn file để tạo link.";
    } catch (error) {
      bulkStatus.textContent = error.message || "Chưa thể tạo file mẫu. Hãy kiểm tra kết nối mạng rồi thử lại.";
    } finally {
      templateButton.disabled = false;
    }
  });

  excelInput.addEventListener("change", async () => {
    const file = excelInput.files?.[0];
    if (!file) return;
    excelInput.value = "";
    bulkResults.hidden = true;
    bulkStatus.textContent = `Đang đọc ${file.name}…`;

    try {
      const XLSX = await loadSpreadsheetLibrary();
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("File Excel chưa có trang tính nào.");

      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false });
      const recognizedHeaders = new Set(["hovaten", "hoten", "fullname", "name"]);
      const headerRow = rows.findIndex((row) => row.some((cell) => recognizedHeaders.has(normalizeColumnName(cell))));
      if (headerRow < 0) throw new Error("Không tìm thấy cột “Họ và tên”. Hãy thêm tiêu đề này ở hàng đầu của bảng.");

      const nameColumn = rows[headerRow].findIndex((cell) => recognizedHeaders.has(normalizeColumnName(cell)));
      const guests = rows.slice(headerRow + 1)
        .map((row) => String(row[nameColumn] ?? "").trim().replace(/\s+/g, " "))
        .filter(Boolean);
      if (!guests.length) throw new Error("Cột “Họ và tên” chưa có dữ liệu khách mời.");
      if (guests.length > 2000) throw new Error("File có hơn 2.000 khách. Hãy chia thành nhiều file nhỏ hơn.");

      renderGuestLinks(guests);
      bulkStatus.textContent = `Đã tạo ${guests.length} link. File được xử lý trên thiết bị của bạn.`;
    } catch (error) {
      bulkStatus.textContent = error.message || "Không đọc được file. Hãy thử lại với định dạng Excel hoặc CSV.";
    }
  });

  $("#copyAllGuestLinks").addEventListener("click", async () => {
    if (!bulkLinks.length) return;
    const rows = ["Họ và tên\tLink thiệp", ...bulkLinks.map(({ name, url }) => `${name}\t${url}`)];
    await copyText(rows.join("\n"));
    bulkStatus.textContent = `Đã sao chép danh sách ${bulkLinks.length} link.`;
  });

  $("#downloadGuestLinks").addEventListener("click", () => {
    if (!bulkLinks.length) return;
    const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      ["Họ và tên", "Link thiệp"],
      ...bulkLinks.map(({ name, url }) => [name, url]),
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = "danh-sach-link-thiep-cuoi.csv";
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  });
}

const personalizedGuest = guestName || "Bạn thân mến";
$("#coverGuest").textContent = personalizedGuest;
$("#heroGuest").textContent = personalizedGuest;

const cover = $("#cover");
$("#openInvitation").addEventListener("click", () => {
  cover.classList.add("is-hidden");
  document.body.classList.add("is-open");
  startBackgroundMusic();
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
const musicPlayer = $("#musicPlayer");
const musicFrame = $("#musicFrame");
const musicEmbedUrl = "https://www.youtube-nocookie.com/embed/7o5XAg_EeLw?autoplay=1&playsinline=1&rel=0";

function startBackgroundMusic() {
  if (!musicPlayer.hidden) return;
  musicPlayer.hidden = false;
  musicFrame.src = musicEmbedUrl;
  musicToggle.classList.add("is-playing");
  musicToggle.setAttribute("aria-pressed", "true");
  musicToggle.setAttribute("aria-expanded", "true");
  musicToggle.setAttribute("aria-label", "Tắt nhạc nền I Do");
  showToast("Đang phát I Do — 911 & Đức Phúc");
}

function stopBackgroundMusic() {
  if (musicPlayer.hidden) return;
  musicFrame.src = "about:blank";
  musicPlayer.hidden = true;
  musicToggle.classList.remove("is-playing");
  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.setAttribute("aria-expanded", "false");
  musicToggle.setAttribute("aria-label", "Phát nhạc nền I Do");
}

musicToggle.addEventListener("click", () => {
  if (musicPlayer.hidden) startBackgroundMusic();
  else stopBackgroundMusic();
});
