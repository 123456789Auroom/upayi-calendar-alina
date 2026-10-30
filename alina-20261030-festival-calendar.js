/* City-verified festival observances, separate from personal practice completion. */
(function () {
    'use strict';
    const festivalData = window.CALENDAR_FESTIVALS;
    if (!festivalData || !Array.isArray(festivalData.events)) return;
    const byDate = new Map();
    for (const event of festivalData.events) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(event.local_date)) continue;
        const events = byDate.get(event.local_date) || [];
        events.push({...event});
        byDate.set(event.local_date, events);
    }
    function decorateGrid() {
        const year = typeof currentYear !== 'undefined' ? Number(currentYear) : Number.NaN;
        const month = typeof currentMonth !== 'undefined' ? Number(currentMonth) : Number.NaN;
        if (!Number.isInteger(year) || !Number.isInteger(month)) return;
        document.querySelectorAll('#calendarGrid .day-card, #monthGrid .day-card').forEach(card => {
            if (card.querySelector('.festival-day-marker')) return;
            const number = Number(card.querySelector('.day-num')?.textContent?.trim());
            if (!Number.isInteger(number) || card.classList.contains('other-month') || card.style.pointerEvents === 'none') return;
            const key = `${year}-${String(month).padStart(2, '0')}-${String(number).padStart(2, '0')}`;
            const entries = byDate.get(key) || [];
            if (!entries.length) return;
            const badge = document.createElement('span');
            badge.className = 'festival-day-marker';
            const named = entries.find(event => event.kind !== 'chaturthi_continuation');
            badge.textContent = named ? `🪔 ${named.title.split(' — ')[0]}` : '◌ Шукла Чатуртхи';
            card.appendChild(badge);
        });
    }
    const originalRender = window.renderCalendar;
    if (typeof originalRender === 'function') {
        window.renderCalendar = function () {
            const value = originalRender.apply(this, arguments);
            decorateGrid();
            return value;
        };
        decorateGrid();
    }
    const originalOpen = window.openDayModal;
    if (typeof originalOpen !== 'function') return;
    window.openDayModal = function (day) {
        const value = originalOpen.apply(this, arguments);
        const modal = document.getElementById('dayModal');
        if (!modal) return value;
        modal.querySelector('#festivalDayPanel')?.remove();
        const entries = byDate.get(day.date) || [];
        if (!entries.length) return value;
        const section = document.createElement('section');
        section.id = 'festivalDayPanel';
        section.className = 'astro-day-panel';
        const heading = document.createElement('h3');
        heading.textContent = 'Праздничный календарь';
        section.appendChild(heading);
        for (const event of entries) {
            const paragraph = document.createElement('p');
            paragraph.textContent = event.title + ` · ${event.local_date}`;
            if (event.end_date) paragraph.textContent += ` · Завершение: ${event.end_date}`;
            if (event.start_date) paragraph.textContent += ` · Начало: ${event.start_date}`;
            section.appendChild(paragraph);
            const guidance = window.CalendarGuidance?.render(event.kind);
            if (guidance) section.appendChild(guidance);
        }
        const anchor = modal.querySelector('#mUpayasList');
        if (anchor?.parentNode) anchor.parentNode.insertBefore(section, anchor);
        else modal.appendChild(section);
        return value;
    };
    window.CalendarFestivals = Object.freeze({eventsFor: date => (byDate.get(date) || []).map(event => event.title)});
})();
