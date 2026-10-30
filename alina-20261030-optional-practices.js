/* Access to practices not assigned to a daily card. Separate completion store. */
(function () {
    'use strict';
    const settings = window.CALENDAR_OPTIONAL;
    if (!settings || typeof UPAYAS_DEFS !== 'object') return;
    const days = settings.person === 'aelita' || settings.person === 'yadviga' ? PANCHANGA_DATA : RAW_DATA;
    if (!Array.isArray(days)) return;
    const scheduled = new Set(days.flatMap(day => day[settings.dayKey] || []));
    const definitions = Object.entries(UPAYAS_DEFS).filter(([id]) =>
        settings.ids.includes(id) && !scheduled.has(id));
    if (!definitions.length) return;
    const key = `optional-practices:${settings.person}:v1`;
    const root = document.createElement('section');
    root.className = 'optional-practices-panel';
    const heading = document.createElement('h2');
    heading.textContent = 'Дополнительные практики';
    root.appendChild(heading);
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Закрыть';
    root.appendChild(close);
    const intro = document.createElement('p');
    intro.textContent = 'Разовые и выполняемые по обстоятельствам практики. Откройте описание и при желании запишите дату выполнения.';
    root.appendChild(intro);
    let saved = {};
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
    } catch (error) {
        console.error('Не удалось прочитать записи практик', error);
    }
    const list = document.createElement('div');
    for (const [id, definition] of definitions) {
        const entry = document.createElement('details');
        const title = document.createElement('summary');
        title.textContent = definition.title || id;
        entry.appendChild(title);
        for (const field of ['time', 'props', 'sankalpa', 'actions', 'mantras']) {
            if (!definition[field]) continue;
            const line = document.createElement('p');
            line.className = 'optional-practices-text';
            line.textContent = definition[field];
            entry.appendChild(line);
        }
        const form = document.createElement('form');
        const label = document.createElement('label');
        label.textContent = 'Дата выполнения ';
        const date = document.createElement('input');
        date.type = 'date';
        date.min = '2025-01-01';
        date.max = '2035-12-31';
        date.required = true;
        label.appendChild(date);
        form.appendChild(label);
        const button = document.createElement('button');
        button.type = 'submit';
        button.textContent = 'Записать выполнение';
        form.appendChild(button);
        const history = document.createElement('p');
        function renderHistory() {
            history.textContent = (saved[id] || []).length ? `Записано: ${saved[id].join(', ')}` : '';
        }
        renderHistory();
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (!date.validity.valid || !/^\d{4}-\d{2}-\d{2}$/.test(date.value)) return;
            const next = {...saved, [id]: [...new Set([...(saved[id] || []), date.value])].sort()};
            try {
                localStorage.setItem(key, JSON.stringify(next));
            } catch (error) {
                console.error('Не удалось сохранить выполнение', error);
                alert('Запись не сохранена: хранилище браузера недоступно.');
                return;
            }
            saved = next;
            renderHistory();
        });
        entry.append(form, history);
        list.appendChild(entry);
    }
    root.appendChild(list);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'optional-practices-toggle';
    toggle.textContent = 'Дополнительные практики';
    toggle.setAttribute('aria-expanded', 'false');
    root.hidden = true;
    toggle.addEventListener('click', () => {
        root.hidden = !root.hidden;
        toggle.setAttribute('aria-expanded', String(!root.hidden));
        if (!root.hidden) root.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    close.addEventListener('click', () => {
        root.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
    });
    const calendar = document.querySelector('.calendar-container');
    if (calendar) calendar.before(toggle);
    else document.body.appendChild(toggle);
    document.body.appendChild(root);
})();
