/* ==========================================================================
   НАСТРОЙКИ — меняйте только этот блок
   ========================================================================== */

const CONFIG = {
  groom: 'Эрланбек',
  bride: 'Карлыгач',

  // Дата и время торжества по местному времени
  date: { year: 2026, month: 9, day: 19, hour: 17, minute: 0 },
  utcOffset: '+06:00',            // Кыргызстан — постоянный UTC+6

  addressLines: ['«Аяна» ресторану', 'Кулунду айылы'],
  mapUrl: 'https://maps.app.goo.gl/f3nGcSwc5a7Rcfxj8',

  audioSrc: 'audio/wedding-song.mp3',   // положите свой файл сюда; пустая строка — кнопка не появится

  // URL веб-приложения Google Apps Script (см. README, шаг 4)
  rsvpUrl: 'https://script.google.com/macros/s/AKfycbzTcR-BoSdXlfsXId2vo0qKbmLWSl9LqXXddliXei8jiIPLQBzLKwEqTTopJm2z8WbL/exec',

  maxGuests: 10
};

const TEXT = {
  months: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
           'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  weekdays: ['ДҮ', 'ШЕ', 'ША', 'БЕ', 'ЖМ', 'ИШ', 'ЖК'],
  musicOn: 'Музыканы кошуу',
  musicOff: 'Музыканы өчүрүү',
  errName: 'Аты-жөнүңүздү жазыңыз',
  errAttending: 'Жообуңузду тандаңыз',
  errSide: 'Кимдин конугузун тандаңыз',
  errSend: 'Жооп жөнөтүлгөн жок. Интернетти текшерип, кайра аракет кылыңыз',
  sending: 'Жөнөтүлүүдө…',
  submit: 'Жооп жөнөтүү',
  thanksYes: 'Рахмат! Сизди тойдо күтөбүз.',
  thanksNo: 'Рахмат жообуңуз үчүн. Сизди сагынабыз.'
};

/* ==========================================================================
   Дальше менять не нужно
   ========================================================================== */

const pad = n => String(n).padStart(2, '0');
const $ = id => document.getElementById(id);

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const D = CONFIG.date;
const eventAt = new Date(
  `${D.year}-${pad(D.month)}-${pad(D.day)}T${pad(D.hour)}:${pad(D.minute)}:00${CONFIG.utcOffset}`
);

if (Number.isNaN(eventAt.getTime())) {
  console.error('CONFIG.date курамы туура эмес');
}

/* ---------- статический текст ---------- */

function fillStatic() {
  $('groomName').textContent = CONFIG.groom;
  $('brideName').textContent = CONFIG.bride;
  $('footerNames').textContent = `${CONFIG.groom} & ${CONFIG.bride}`;
  document.title = `${CONFIG.groom} & ${CONFIG.bride} | Үйлөнүү тойго чакыруу`;

  const dateLine = `${D.day}-${TEXT.months[D.month - 1]}, ${D.year}-жыл`;
  const timeLine = `саат ${pad(D.hour)}:${pad(D.minute)}`;
  $('heroDate').textContent = `${dateLine} · ${timeLine}`;
  $('calLine').textContent = `${dateLine} · ${timeLine}`;
  $('calMonth').textContent = `${TEXT.months[D.month - 1]} ${D.year}`;

  $('addr').innerHTML = CONFIG.addressLines
    .map(line => line.replace(/[<>&]/g, ''))
    .join('<br>');

  const map = $('mapLink');
  if (CONFIG.mapUrl) {
    map.href = CONFIG.mapUrl;
  } else {
    map.hidden = true;
  }

  const sideBtns = document.querySelectorAll('#side .choice__btn');
  if (sideBtns.length === 2) {
    sideBtns[0].textContent = CONFIG.groom;
    sideBtns[1].textContent = CONFIG.bride;
  }

  // инициалы в вензеле на конверте
  $('crestGroom').textContent = CONFIG.groom.charAt(0);
  $('crestBride').textContent = CONFIG.bride.charAt(0);
}

/* ---------- обратный отсчёт ---------- */

const cdCells = {};

function setNum(el, value) {
  const next = String(value);
  if (el.textContent === next) return;
  el.textContent = next;
  if (calm) return;
  el.classList.remove('is-tick');
  void el.offsetWidth;           // перезапуск анимации
  el.classList.add('is-tick');
}

function tick() {
  const diff = eventAt.getTime() - Date.now();
  if (diff <= 0) {
    $('count').hidden = true;
    $('countDone').hidden = false;
    return false;
  }
  const s = Math.floor(diff / 1000);
  setNum(cdCells.days, Math.floor(s / 86400));
  setNum(cdCells.hours, Math.floor((s % 86400) / 3600));
  setNum(cdCells.min, Math.floor((s % 3600) / 60));
  setNum(cdCells.sec, s % 60);
  return true;
}

function startCountdown() {
  cdCells.days = $('cdDays');
  cdCells.hours = $('cdHours');
  cdCells.min = $('cdMin');
  cdCells.sec = $('cdSec');

  if (!tick()) return;
  const id = setInterval(() => {
    if (!tick()) clearInterval(id);
  }, 1000);
}

/* ---------- календарь ---------- */

function buildCalendar() {
  const box = $('cal');
  const frag = document.createDocumentFragment();

  TEXT.weekdays.forEach(wd => {
    const cell = document.createElement('span');
    cell.className = 'cal__wd';
    cell.textContent = wd;
    frag.appendChild(cell);
  });

  const first = new Date(D.year, D.month - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(D.year, D.month, 0).getDate();

  for (let i = 0; i < offset; i++) {
    frag.appendChild(document.createElement('span'));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('span');
    cell.className = day === D.day ? 'cal__day cal__day--mark' : 'cal__day';
    cell.textContent = day;
    // дни проявляются волной
    cell.style.transitionDelay = `${Math.min(day * 14, 500)}ms`;
    frag.appendChild(cell);
  }

  box.appendChild(frag);
}

/* ---------- конверт ---------- */

// Заполняется в initMusic: конверт дёргает её при открытии.
// Нажатие на печать — законный жест, после него браузер разрешает звук.
let startMusic = () => {};

function initEnvelope() {
  const env = $('env');
  const seal = $('sealBtn');
  if (!env || !seal) return;

  document.body.classList.add('is-sealed');

  let opened = false;

  function open() {
    if (opened) return;
    opened = true;

    env.classList.add('is-open');
    document.body.classList.remove('is-sealed');
    startMusic();

    const hide = () => { env.hidden = true; };
    calm ? hide() : setTimeout(hide, 1000);
  }

  seal.addEventListener('click', open);
}

/* ---------- музыка ---------- */

function initMusic() {
  if (!CONFIG.audioSrc) return;

  const audio = $('audio');
  const btn = $('musicBtn');
  const label = $('musicLabel');

  audio.src = CONFIG.audioSrc;
  audio.volume = 0.5;
  btn.hidden = false;

  // файл не найден или формат не поддерживается — прячем кнопку
  audio.addEventListener('error', () => { btn.hidden = true; });

  let stoppedByUser = false;

  function markOn() {
    btn.setAttribute('aria-pressed', 'true');
    label.textContent = TEXT.musicOff;
  }

  function markOff() {
    btn.setAttribute('aria-pressed', 'false');
    label.textContent = TEXT.musicOn;
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      stoppedByUser = false;
      audio.play().then(markOn).catch(() => { btn.hidden = true; });
    } else {
      stoppedByUser = true;
      audio.pause();
      markOff();
    }
  });

  // плеер могли остановить кнопками гарнитуры или из шторки — подхватываем
  audio.addEventListener('play', markOn);
  audio.addEventListener('pause', markOff);

  // Автозапуск браузеры блокируют, но после первого касания экрана он разрешён.
  // Ловим самый ранний жест гостя и включаем музыку — кнопка остаётся для управления.
  const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];

  function tryAutoplay() {
    if (stoppedByUser || !audio.paused) return;
    audio.play().then(markOn).catch(() => {});
  }

  startMusic = tryAutoplay;

  function onFirstGesture(e) {
    events.forEach(type => window.removeEventListener(type, onFirstGesture));
    // нажатие на саму кнопку обрабатывает её собственный click — иначе включим и сразу выключим
    const t = e && e.target;
    if (t && t.closest && t.closest('#musicBtn')) return;
    tryAutoplay();
  }

  events.forEach(type =>
    window.addEventListener(type, onFirstGesture, { once: true, passive: true })
  );
}

/* ---------- проявление фото (blur-up) ---------- */

function initPhotos() {
  document.querySelectorAll('.ph').forEach(ph => {
    const img = ph.querySelector('img');
    if (!img) return;

    const done = () => ph.classList.add('is-loaded');

    if (img.complete && img.naturalWidth) {
      done();
    } else {
      img.addEventListener('load', done, { once: true });
      // битый файл: заглушку всё равно убираем, иначе останется мутное пятно
      img.addEventListener('error', done, { once: true });
    }
  });
}

/* ---------- появление блоков ---------- */

function initReveal() {
  const items = document.querySelectorAll('[data-anim]');

  if (calm || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = Number(el.dataset.delay || 0);
      if (delay) el.style.transitionDelay = `${delay}ms`;
      el.classList.add('is-in');
      obs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(el => io.observe(el));
}

/* ---------- параллакс и полоса прокрутки ---------- */

function initScrollFx() {
  const bar = $('progress').firstElementChild;
  const layers = calm ? [] : Array.from(document.querySelectorAll('[data-par]'));
  let queued = false;

  // максимальный сдвиг — 10% высоты кадра; в CSS у картинки запас 12%
  const LIMIT = 0.10;

  function frame() {
    queued = false;

    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${scrollable > 0 ? doc.scrollTop / scrollable : 0})`;

    const vh = window.innerHeight;
    layers.forEach(img => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;

      // -1 — кадр только входит снизу, +1 — уже уходит вверх
      const mid = box.top + box.height / 2;
      const progress = Math.max(-1, Math.min(1, (vh / 2 - mid) / (vh / 2 + box.height / 2)));
      const speed = Math.min(Number(img.dataset.par) || 0, LIMIT);

      img.style.transform = `translate3d(0, ${(progress * speed * box.height).toFixed(2)}px, 0)`;
    });
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
}

/* ---------- лайтбокс ---------- */

function initLightbox() {
  const shots = Array.from(document.querySelectorAll('.ph[data-full]'));
  if (!shots.length) return;

  const lb = $('lb');
  const lbImg = $('lbImg');
  const lbCap = $('lbCap');
  const lbCount = $('lbCount');
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + shots.length) % shots.length;
    const ph = shots[index];

    lbImg.classList.remove('is-ready');
    lbImg.src = ph.dataset.full;
    lbImg.alt = ph.querySelector('img')?.alt || '';
    lbCap.textContent = ph.dataset.cap || '';
    lbCount.textContent = `${index + 1} / ${shots.length}`;

    if (lbImg.complete && lbImg.naturalWidth) {
      lbImg.classList.add('is-ready');
    } else {
      lbImg.addEventListener('load', () => lbImg.classList.add('is-ready'), { once: true });
    }
  }

  function open(i, from) {
    opener = from || null;
    lb.hidden = false;
    document.body.classList.add('is-locked');
    show(i);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('lbClose').focus();
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    const hide = () => { lb.hidden = true; lbImg.removeAttribute('src'); };
    calm ? hide() : setTimeout(hide, 300);
    if (opener) opener.focus();
  }

  shots.forEach((ph, i) => {
    ph.addEventListener('click', () => open(i, ph));
    ph.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i, ph);
      }
    });
  });

  $('lbClose').addEventListener('click', close);
  $('lbPrev').addEventListener('click', () => show(index - 1));
  $('lbNext').addEventListener('click', () => show(index + 1));

  // клик по фону закрывает, по самой картинке — нет
  lb.addEventListener('click', e => {
    if (e.target === lb || e.target.classList.contains('lb__figure')) close();
  });

  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // листание свайпом
  let startX = null;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(dx > 0 ? index - 1 : index + 1);
    startX = null;
  }, { passive: true });
}

/* ---------- форма ---------- */

// rid — метка одной отправки. При повторе из-за обрыва связи она та же,
// поэтому сервер запишет гостя один раз.
const state = {
  attending: null,
  side: null,
  guests: 1,
  sent: false,
  rid: Math.random().toString(36).slice(2) + Date.now().toString(36)
};

function bindChoice(groupId, onPick) {
  const group = $(groupId);
  group.addEventListener('click', e => {
    const btn = e.target.closest('.choice__btn');
    if (!btn) return;
    group.querySelectorAll('.choice__btn').forEach(b => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    onPick(btn.dataset.value);
    $('msg').textContent = '';
  });
}

function setGuests(value) {
  state.guests = Math.min(CONFIG.maxGuests, Math.max(1, value));
  $('guests').textContent = state.guests;
  $('minus').disabled = state.guests <= 1;
  $('plus').disabled = state.guests >= CONFIG.maxGuests;
}

async function sendRsvp(payload) {
  const body = JSON.stringify(payload);

  try {
    const res = await fetch(CONFIG.rsvpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'unknown');
    return;
  } catch (err) {
    // Некоторые мобильные браузеры не дают прочитать ответ Apps Script (CORS после
    // редиректа). Повторяем вслепую: запись пройдёт, подтверждение не увидим.
    // Повтор с тем же payload.rid — сервер отбросит дубль.
    console.warn('повтор в режиме no-cors:', err);
    await fetch(CONFIG.rsvpUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });
  }
}

function initForm() {
  const form = $('form');
  const nameInput = $('name');
  const msg = $('msg');
  const submit = $('submit');

  bindChoice('attending', value => {
    state.attending = value === 'yes';
    $('guestsField').hidden = !state.attending;
    $('sideField').hidden = !state.attending;
    if (!state.attending) {
      state.side = null;
      $('side').querySelectorAll('.choice__btn')
        .forEach(b => b.setAttribute('aria-pressed', 'false'));
    }
  });

  bindChoice('side', value => { state.side = value; });

  $('minus').addEventListener('click', () => setGuests(state.guests - 1));
  $('plus').addEventListener('click', () => setGuests(state.guests + 1));
  setGuests(1);

  nameInput.addEventListener('input', () => {
    nameInput.classList.remove('field__input--error');
    msg.textContent = '';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (state.sent) return;

    const name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add('field__input--error');
      msg.textContent = TEXT.errName;
      nameInput.focus();
      return;
    }
    if (state.attending === null) {
      msg.textContent = TEXT.errAttending;
      return;
    }
    if (state.attending && !state.side) {
      msg.textContent = TEXT.errSide;
      return;
    }
    if (!CONFIG.rsvpUrl) {
      msg.textContent = TEXT.errSend;
      console.error('CONFIG.rsvpUrl бош — Apps Script дарегин коюңуз');
      return;
    }

    submit.disabled = true;
    submit.textContent = TEXT.sending;
    msg.textContent = '';

    try {
      await sendRsvp({
        rid: state.rid,
        name: name,
        attending: state.attending,
        guests: state.attending ? state.guests : 0,
        side: state.attending ? (state.side === 'groom' ? CONFIG.groom : CONFIG.bride) : ''
      });
      state.sent = true;
      form.hidden = true;
      $('thanksText').textContent = state.attending ? TEXT.thanksYes : TEXT.thanksNo;
      $('thanks').hidden = false;
      $('thanks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error(err);
      msg.textContent = TEXT.errSend;
      submit.disabled = false;
      submit.textContent = TEXT.submit;
    }
  });
}

/* ---------- старт ---------- */

fillStatic();
startCountdown();
buildCalendar();
initMusic();
initEnvelope();
initPhotos();
initReveal();
initScrollFx();
initLightbox();
initForm();
