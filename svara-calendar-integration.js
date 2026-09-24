(() => {
  'use strict';

  const NAKSHATRAS = [
    ['Ашвини','Кету','Огонь'],['Бхарани','Венера','Земля'],['Криттика','Солнце','Огонь'],
    ['Рохини','Луна','Земля'],['Мригашира','Марс','Воздух'],['Ардра','Раху','Вода'],
    ['Пунарвасу','Юпитер','Вода'],['Пушья','Сатурн','Вода'],['Ашлеша','Меркурий','Вода'],
    ['Магха','Кету','Огонь'],['Пурвапхалгуни','Венера','Огонь'],['Уттарапхалгуни','Солнце','Огонь'],
    ['Хаста','Луна','Огонь'],['Читра','Марс','Огонь'],['Свати','Раху','Воздух'],
    ['Вишакха','Юпитер','Огонь'],['Анурадха','Сатурн','Вода'],['Джйештха','Меркурий','Вода'],
    ['Мула','Кету','Огонь'],['Пурвашадха','Венера','Огонь'],['Уттарашадха','Солнце','Огонь'],
    ['Шравана','Луна','Вода'],['Дхаништха','Марс','Эфир'],['Шатабхиша','Раху','Эфир'],
    ['Пурвабхадрапада','Юпитер','Огонь'],['Уттарабхадрапада','Сатурн','Эфир'],['Ревати','Меркурий','Эфир']
  ];
  const SIGNS = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

  const config = window.SVARA_CONFIG || {};
  const data = window.SVARA_DATA || {};
  const state = { selectedDate: config.initialDate || null };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function isDateKey(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || ''); }
  function toDateKey(value) {
    if (isDateKey(value)) return value;
    if (value && isDateKey(value.date)) return value.date;
    if (value && Number.isInteger(value.y) && Number.isInteger(value.m) && Number.isInteger(value.d)) {
      return `${value.y}-${String(value.m).padStart(2,'0')}-${String(value.d).padStart(2,'0')}`;
    }
    return null;
  }
  function fromDateKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }
  function offsetDateKey(key, days) {
    const date = fromDateKey(key);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function formatDate(key) {
    const [year, month, day] = key.split('-').map(Number);
    return `${day} ${MONTHS[month - 1]} ${year}`;
  }
  function getDay(key) { return isDateKey(key) ? data[key] || null : null; }
  function channel(day) {
    const ida = day && day.svara === 'ida';
    return {
      id: ida ? 'ida' : 'pingala',
      className: ida ? 'is-ida' : 'is-pingala',
      emoji: ida ? '🌙' : '☀️',
      name: ida ? 'Ида' : 'Пингала',
      nadi: ida ? 'Чандра Нади' : 'Сурья Нади',
      nostril: ida ? 'левая' : 'правая',
      leg: ida ? 'левую' : 'правую',
      oppositeSide: ida ? 'правый' : 'левый',
      shortActivity: ida
        ? 'Подходит для медитации, учёбы, молитвы, примирения и спокойного планирования.'
        : 'Подходит для действия, спорта, переговоров, решений и задач, требующих воли.',
      description: ida
        ? 'Лунный, охлаждающий и собирающий канал: мягкость, восприимчивость, внутренняя работа.'
        : 'Солнечный, согревающий и динамичный канал: решимость, действие, физическая активность.'
    };
  }
  function nakshatra(day) {
    const entry = NAKSHATRAS[day?.nakIdx];
    return entry ? { name: entry[0], lord: entry[1], element: entry[2] } : { name: '—', lord: '—', element: '—' };
  }
  function sign(day) { return SIGNS[day?.signIdx] || '—'; }
  function metric(label, value) {
    return `<div class="svara-metric"><span class="svara-label">${escapeHtml(label)}</span><span class="svara-value">${escapeHtml(value || '—')}</span></div>`;
  }

  function marker(dateKey) {
    const day = getDay(dateKey);
    if (!day) return '';
    const info = channel(day);
    return `<span class="svara-day-marker ${info.className}" title="Утренняя Свара: ${info.name}; восход ${escapeHtml(day.sunrise)}">${info.emoji} ${info.name}</span>`;
  }

  function summary(dateKey) {
    const day = getDay(dateKey);
    if (!day) return '<div class="svara-empty">Расчёт Свара недоступен для этой даты.</div>';
    const info = channel(day);
    const nak = nakshatra(day);
    return `<section class="svara-summary ${info.className}" data-svara-date="${dateKey}">
      <div class="svara-summary-head">
        <div><div class="svara-eyebrow">Свара при пробуждении · ${escapeHtml(config.locationName || '')}</div><h3>${info.emoji} ${info.name} — ${info.nadi}</h3></div>
        <span class="svara-channel-badge ${info.className}">${info.nostril} ноздря</span>
      </div>
      <div class="svara-summary-grid">
        <div class="svara-summary-item"><span class="svara-label">Восход</span><span class="svara-value">${escapeHtml(day.sunrise)}</span></div>
        <div class="svara-summary-item"><span class="svara-label">Титхи</span><span class="svara-value">${escapeHtml(day.tName)} · ${day.paksha === 'shukla' ? 'Шукла' : 'Кришна'}</span></div>
        <div class="svara-summary-item"><span class="svara-label">Накшатра</span><span class="svara-value">${nak.name} · пада ${escapeHtml(day.pada)}</span></div>
      </div>
      <p class="svara-guidance"><strong>Утром:</strong> проверьте поток дыхания, первой опустите ${info.leg} ногу. Если активна другая ноздря — полежите на ${info.oppositeSide} боку 5–10 минут. ${info.shortActivity}</p>
      <button type="button" class="svara-open-deep" onclick="SvaraCalendarIntegration.openDeep('${dateKey}')">Открыть глубокий разбор Свары →</button>
    </section>`;
  }

  function neighbors(dateKey) {
    let html = '';
    for (let offset = -3; offset <= 3; offset += 1) {
      const key = offsetDateKey(dateKey, offset);
      const day = getDay(key);
      if (!day) continue;
      const info = channel(day);
      const selected = key === dateKey ? ' is-selected' : '';
      const date = fromDateKey(key);
      html += `<button type="button" class="svara-neighbor ${info.className}${selected}" style="--svara-channel-color:var(--svara-${info.id})" onclick="SvaraCalendarIntegration.selectDate('${key}')">
        <span class="svara-neighbor-date">${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)}</span>
        <span class="svara-neighbor-channel">${info.emoji} ${info.name}</span>
      </button>`;
    }
    return html;
  }

  function deepView(dateKey) {
    const day = getDay(dateKey);
    if (!day) return `<div class="svara-empty">Для ${escapeHtml(dateKey || 'выбранной даты')} нет расчёта Свара. Доступный диапазон: 2025–2035.</div>`;
    const info = channel(day);
    const nak = nakshatra(day);
    const longitude = Number.isFinite(day.moonLon) ? `${day.moonLon.toFixed(2)}°` : '—';
    const illumination = Number.isFinite(day.illum) ? `${day.illum}%` : '—';
    return `<div class="svara-deep-shell" style="--svara-channel-color:var(--svara-${info.id})">
      <section class="svara-deep-card ${info.className}">
        <div class="svara-deep-head">
          <div><div class="svara-eyebrow">Глубокий срез · ${escapeHtml(config.locationName || '')}</div><h2>${info.emoji} ${info.name} — ${info.nadi}</h2><div class="svara-deep-date">${formatDate(dateKey)} · ${escapeHtml(day.vara)} (${escapeHtml(day.varaSa)})</div></div>
          <span class="svara-channel-badge ${info.className}">${info.nostril} ноздря</span>
        </div>
        <p class="svara-guidance">${info.description} ${info.shortActivity}</p>
        <div class="svara-metrics-grid">
          ${metric('Солнце', `↑ ${day.sunrise} · ↓ ${day.sunset}`)}
          ${metric('Луна', `↑ ${day.moonrise}`)}
          ${metric('Титхи / пакша', `${day.tName} · ${day.paksha === 'shukla' ? 'Шукла' : 'Кришна'}`)}
          ${metric('Фаза', `${day.pEmoji || ''} ${day.pName || '—'} · ${illumination}`)}
          ${metric('Накшатра', `${nak.name}, пада ${day.pada}`)}
          ${metric('Управитель / элемент', `${nak.lord} · ${nak.element}`)}
          ${metric('Луна в знаке', `${sign(day)} ${day.signDeg ?? '—'}°`)}
          ${metric('Сидерическая долгота', longitude)}
          ${metric('Управитель дня', day.varaLord)}
        </div>
        <ol class="svara-practice-steps">
          <li>На пробуждении спокойно проверьте, какая ноздря пропускает воздух свободнее.</li>
          <li>Если активна ${info.nostril} ноздря, первой опустите на пол ${info.leg} ногу.</li>
          <li>При несовпадении полежите на ${info.oppositeSide} боку 5–10 минут без форсированного дыхания.</li>
        </ol>
        <div class="svara-neighbors" aria-label="Свара соседних дней">${neighbors(dateKey)}</div>
      </section>
      <div class="svara-reference-grid">
        <section class="svara-reference-card"><h3>🌙 Ида</h3><p>Левый, лунный канал. Традиционно связывается с охлаждением, восприимчивостью, обучением, молитвой и спокойными долговременными делами.</p></section>
        <section class="svara-reference-card"><h3>☀️ Пингала</h3><p>Правый, солнечный канал. Традиционно связывается с теплом, решимостью, физическим усилием, управлением и активными краткосрочными задачами.</p></section>
        <section class="svara-reference-card"><h3>⚪ Сушумна</h3><p>Равный поток через обе ноздри считается переходным состоянием. Его обычно оставляют для внутренней практики, а важные внешние начинания откладывают.</p></section>
      </div>
      <p class="svara-caveat">Расчёт указывает традиционно ожидаемый канал на восходе. Фактическую активность ноздри нужно проверять телесно; не используйте эту подсказку как медицинскую диагностику.</p>
    </div>`;
  }

  function getCalendarPosition() {
    const year = typeof currentYear !== 'undefined' ? Number(currentYear) : Number.NaN;
    const month = typeof currentMonth !== 'undefined' ? Number(currentMonth) : Number.NaN;
    return { year, month };
  }

  function resolveInitialDate() {
    if (state.selectedDate && getDay(state.selectedDate)) return state.selectedDate;
    if (typeof selectedDayData !== 'undefined' && selectedDayData) {
      const selected = toDateKey(selectedDayData);
      if (getDay(selected)) return selected;
    }
    const today = toDateKey(new Date());
    if (getDay(today)) return today;
    const { year, month } = getCalendarPosition();
    const candidate = Number.isFinite(year) && Number.isFinite(month) ? `${year}-${String(month).padStart(2,'0')}-01` : null;
    if (getDay(candidate)) return candidate;
    return Object.keys(data)[0] || null;
  }

  function renderDeep(dateKey) {
    const target = document.getElementById('svaraDeepContent');
    if (!target) return;
    state.selectedDate = dateKey || resolveInitialDate();
    target.innerHTML = deepView(state.selectedDate);
  }

  function selectDate(dateKey) {
    const resolvedDate = getDay(dateKey) ? dateKey : resolveInitialDate();
    if (!resolvedDate) return;
    state.selectedDate = resolvedDate;
    renderDeep(resolvedDate);
  }

  function openDeep(dateKey) {
    selectDate(dateKey);
    const button = document.querySelector('[data-svara-tab-button]');
    if (typeof window.switchTab === 'function' && button) {
      window.switchTab(config.tabArgument || 'tab-svara', button);
    } else {
      button?.click();
    }
    document.getElementById('tab-svara')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function syncModal(dayOrKey) {
    const dateKey = toDateKey(dayOrKey);
    if (!dateKey) return;
    state.selectedDate = dateKey;
    const modalBox = document.querySelector('#dayModal .modal-box, #dayModal .modal-content, #dayModal > div');
    if (!modalBox) return;
    let host = document.getElementById('svaraModalSummary');
    if (!host) {
      host = document.createElement('div');
      host.id = 'svaraModalSummary';
      const anchor = document.getElementById('mVaraSubtitle')?.parentElement || modalBox.firstElementChild;
      if (anchor && anchor.parentElement === modalBox) anchor.insertAdjacentElement('afterend', host);
      else modalBox.insertBefore(host, modalBox.firstChild);
    }
    host.innerHTML = summary(dateKey);
  }

  function decorateGrid() {
    const selector = config.gridSelector || '#monthGrid';
    document.querySelectorAll(`${selector} .day-card`).forEach(card => {
      if (card.querySelector('.svara-day-marker')) return;
      const number = Number(card.querySelector('.day-num')?.textContent?.trim());
      if (!Number.isInteger(number) || card.classList.contains('other-month') || card.style.pointerEvents === 'none') return;
      const { year, month } = getCalendarPosition();
      if (!Number.isInteger(year) || !Number.isInteger(month)) return;
      const key = `${year}-${String(month).padStart(2,'0')}-${String(number).padStart(2,'0')}`;
      const html = marker(key);
      if (!html) return;
      const badges = card.querySelector('.day-badges');
      if (badges) badges.insertAdjacentHTML('beforebegin', html);
      else card.insertAdjacentHTML('beforeend', html);
    });
  }

  function installHooks() {
    if (typeof window.renderCalendar === 'function' && !window.renderCalendar.__svaraWrapped) {
      const originalRender = window.renderCalendar;
      const wrappedRender = function(...args) {
        const result = originalRender.apply(this, args);
        decorateGrid();
        return result;
      };
      wrappedRender.__svaraWrapped = true;
      window.renderCalendar = wrappedRender;
    }
    if (typeof window.openDayModal === 'function' && !window.openDayModal.__svaraWrapped) {
      const originalOpen = window.openDayModal;
      const wrappedOpen = function(day, ...args) {
        const result = originalOpen.call(this, day, ...args);
        syncModal(day);
        return result;
      };
      wrappedOpen.__svaraWrapped = true;
      window.openDayModal = wrappedOpen;
    }
  }

  function validate() {
    const keys = Object.keys(data);
    const required = ['svara','sunrise','sunset','moonrise','tName','paksha','nakIdx','pada','signIdx'];
    const invalid = keys.filter(key => !isDateKey(key) || required.some(field => data[key]?.[field] === undefined));
    return { count: keys.length, first: keys[0] || null, last: keys[keys.length - 1] || null, invalidCount: invalid.length, locationId: config.locationId || null };
  }

  function init() {
    installHooks();
    decorateGrid();
    renderDeep(resolveInitialDate());
    const report = validate();
    if (report.count !== 4017 || report.invalidCount) console.error('Svara data validation failed', report);
  }

  window.SvaraCalendarIntegration = { init, marker, summary, deepView, selectDate, openDeep, syncModal, decorateGrid, validate, getDay };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
