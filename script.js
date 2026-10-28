"use strict";

/* ===== TIỆN ÍCH ===== */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
// localStorage bọc try/catch để không lỗi khi trình duyệt chặn lưu trữ
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } }
};

/* ===== 1. ĐỔI GIAO DIỆN: GIẤY CŨ / ĐÊM ===== */
const themeBtn = $("#theme-toggle");
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === "night" ? "☀️" : "🌙";
  store.set("theme", theme);
}
themeBtn.addEventListener("click", () =>
  setTheme(document.documentElement.dataset.theme === "night" ? "sepia" : "night"));
setTheme(store.get("theme") || "sepia");

/* ===== 2. MENU HAMBURGER ===== */
const burger = $("#burger"), navList = $("#nav-list");
burger.addEventListener("click", () => {
  const open = navList.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
  burger.textContent = open ? "✕" : "☰";
});
$$(".nav__link").forEach(link => link.addEventListener("click", () => {
  navList.classList.remove("is-open");
  burger.textContent = "☰";
}));

/* ===== 3. HIỆU ỨNG GÕ CHỮ (điểm sáng tạo) ===== */
const roles = {
  vi: ["sinh viên Công nghệ thông tin", "người học an ninh mạng", "người học DevOps"],
  en: ["an IT student", "a cybersecurity learner", "a DevOps learner"]
};
const typingEl = $("#typing");
let lang = "vi", roleIdx = 0, charIdx = 0, deleting = false;

function typeLoop() {
  const word = roles[lang][roleIdx];
  charIdx += deleting ? -1 : 1;
  typingEl.textContent = word.slice(0, charIdx);
  let delay = deleting ? 45 : 90;
  if (!deleting && charIdx === word.length) { deleting = true; delay = 1600; }
  else if (deleting && charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles[lang].length; delay = 400; }
  setTimeout(typeLoop, delay);
}

/* ===== 4. SONG NGỮ VI / EN =====
   Bản gốc tiếng Việt được lưu vào data-vi lúc tải trang, bản tiếng Anh lấy từ data-en */
const langBtn = $("#lang-toggle");
$$("[data-en]").forEach(el => { el.dataset.vi = el.innerHTML; });
$$("[data-en-ph]").forEach(el => { el.dataset.viPh = el.placeholder; });

function setLang(next) {
  lang = next;
  document.documentElement.lang = next;
  $$("[data-en]").forEach(el => { el.innerHTML = next === "en" ? el.dataset.en : el.dataset.vi; });
  $$("[data-en-ph]").forEach(el => { el.placeholder = next === "en" ? el.dataset.enPh : el.dataset.viPh; });
  langBtn.textContent = next === "en" ? "VI" : "EN";
  store.set("lang", next);
  roleIdx = 0; charIdx = 0; deleting = false;      // gõ lại từ đầu bằng ngôn ngữ mới
  $$(".is-invalid", form).forEach(validateField); // cập nhật lại thông báo lỗi
}
langBtn.addEventListener("click", () => setLang(lang === "vi" ? "en" : "vi"));

/* ===== 5. SCROLL REVEAL (điểm sáng tạo) ===== */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-visible");
    obs.unobserve(e.target);
  });
}, { threshold: 0.12 });
$$(".reveal").forEach(el => revealObserver.observe(el));

/* ===== 6. HIGHLIGHT MENU THEO SECTION ĐANG XEM ===== */
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$(".nav__link").forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach(s => sectionObserver.observe(s));

/* ===== 7. MODAL CHI TIẾT DỰ ÁN =====
   Đọc dữ liệu từ chính thẻ dự án, nên chỉ cần sửa HTML */
const modal = $("#modal");
function openModal(card) {
  const img = $(".project__img", card);
  $("#modal-img").src = img.src;
  $("#modal-img").alt = img.alt;
  $("#modal-title").textContent = $(".project__title", card).textContent;
  $("#modal-desc").textContent = $(".project__detail", card).textContent;
  $("#modal-tags").innerHTML = $(".chips", card).innerHTML;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
$$(".js-open-modal").forEach(btn => btn.addEventListener("click", () => openModal(btn.closest(".project"))));
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ===== 8. FORM LIÊN HỆ + VALIDATION ===== */
const form = $("#contact-form"), success = $("#form-success");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MSG = {
  vi: { name: "Vui lòng nhập họ tên (ít nhất 2 ký tự).", emailEmpty: "Vui lòng nhập email.", emailBad: "Email không đúng định dạng.", message: "Tin nhắn cần ít nhất 10 ký tự." },
  en: { name: "Please enter your name (at least 2 characters).", emailEmpty: "Please enter your email.", emailBad: "Invalid email format.", message: "Message must be at least 10 characters." }
};
// Mỗi hàm trả về khóa lỗi (chuỗi rỗng = hợp lệ)
const validators = {
  name:    v => v.trim().length < 2 ? "name" : "",
  email:   v => !v.trim() ? "emailEmpty" : !EMAIL.test(v.trim()) ? "emailBad" : "",
  message: v => v.trim().length < 10 ? "message" : ""
};
function validateField(input) {
  const key = validators[input.name](input.value);
  $(`[data-error-for="${input.name}"]`).textContent = key ? MSG[lang][key] : "";
  input.classList.toggle("is-invalid", Boolean(key));
  return !key;
}
$$("input, textarea", form).forEach(input => {
  input.addEventListener("blur", () => validateField(input));
  input.addEventListener("input", () => input.classList.contains("is-invalid") && validateField(input));
});
form.addEventListener("submit", e => {
  e.preventDefault();
  success.hidden = true;
  const ok = $$("input, textarea", form).map(validateField).every(Boolean); // map để hiện hết lỗi cùng lúc
  if (!ok) return;

  // Chưa có server nên mở ứng dụng email của người gửi với nội dung đã điền
  const { name, email, message } = form.elements;
  const subject = encodeURIComponent(`Portfolio - ${name.value.trim()}`);
  const body = encodeURIComponent(`${message.value.trim()}\n\n${name.value.trim()} (${email.value.trim()})`);
  success.hidden = false;
  window.location.href = `mailto:ngocduy1301py@gmail.com?subject=${subject}&body=${body}`;
  form.reset();
});

/* ===== KHỞI ĐỘNG ===== */
setLang(store.get("lang") || "vi");
typeLoop();