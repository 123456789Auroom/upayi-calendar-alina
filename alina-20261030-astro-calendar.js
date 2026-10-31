/* Local astronomy and practical observance guidance. Does not mutate practices or completion keys. */
(function () {
    'use strict';
    const dataset = window.CALENDAR_ASTRO;
    if (!dataset || !dataset.eclipses_global || !dataset.intervals_utc) return;
    const zone = dataset.timezone;
    const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const localTime = value => formatter.format(new Date(value));
    const localDate = value => {
        const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    };
    const dayBefore = value => new Date(Date.parse(value) - 1).toISOString();
    const dates = new Map();
    const eclipses = dataset.eclipses_global.map(event => ({...event, local_date: localDate(event.maximum_utc)})).sort((a, b) =>
        Date.parse(a.maximum_utc) - Date.parse(b.maximum_utc));
    for (const eclipse of eclipses) {
        const list = dates.get(eclipse.local_date) || [];
        list.push(eclipse);
        dates.set(eclipse.local_date, list);
    }
    const prepared = new WeakMap();
    const corridors = eclipses.slice(0, -1).map((first, index) => ({first, second: eclipses[index + 1]}))
        .filter(({first, second}) => {
            const gap = Date.parse(second.maximum_utc) - Date.parse(first.maximum_utc);
            return gap > 0 && gap <= 18 * 86400000;
        });
    const inCorridor = (pair, day) => pair.first.local_date < day && day < pair.second.local_date;
    const corridorText = pair => `Первое затмение: ${localTime(pair.first.maximum_utc)}; второе: ${localTime(pair.second.maximum_utc)}. Промежуток заканчивается с наступлением дня второго затмения, ${pair.second.local_date}; само затмение показано отдельно. Время максимумов не является временем местных контактов.`;
    function intervalOnDay(interval, isoDate) {
        if (prepared.has(interval)) {
            const [start, end] = prepared.get(interval);
            return start <= isoDate && isoDate <= end;
        }
        const start = localDate(interval.start_utc);
        const end = localDate(dayBefore(interval.end_utc));
        prepared.set(interval, [start, end]);
        return start <= isoDate && isoDate <= end;
    }
    function recordsFor(isoDate) {
        const output = [];
        const add = (kind, text) => output.push({kind, text});
        for (const eclipse of dates.get(isoDate) || []) {
            const kind = eclipse.kind === 'solar' ? 'Солнечное' : 'Лунное';
            const types = {total: 'полное', partial: 'частное', annular: 'кольцеобразное',
                'annular-total': 'гибридное', penumbral: 'полутеневое'};
            add(eclipse.kind === 'solar' ? 'solar_eclipse' : 'lunar_eclipse', `${kind} затмение — ${types[eclipse.type] || eclipse.type}. Глобальный максимум по местному времени: ${localTime(eclipse.maximum_utc)}. ` +
                'Встреча: спокойный распорядок и привычная молитва или джапа. В течение события: по возможности оставить время для тишины и не перегружать себя необязательными начинаниями. После: вернуться к обычному ритму и завершить практику благодарностью. Личные упайи продолжаются по своему расписанию.');
        }
        // A corridor is the civil days strictly BETWEEN two global
        // eclipses in one season. Do not invent days around isolated eclipses.
        for (const pair of corridors) {
            const {first} = pair;
            if (first.local_date === isoDate) add('eclipse_corridor', 'Предстоящий промежуток между затмениями. ' + corridorText(pair));
            if (inCorridor(pair, isoDate)) {
                add('eclipse_corridor', 'Коридор между глобальными затмениями (соседние максимумы не далее 18 суток): сохранять устойчивый распорядок, завершать начатое и наблюдать за самочувствием. ' +
                    'Новые важные решения лучше принимать без спешки; уже назначенные практики не отменяются. ' +
                    corridorText(pair));
                break;
            }
        }
        const periods = dataset.intervals_utc;
        for (const period of periods.mercury_retrograde || []) {
            if (!intervalOnDay(period, isoDate)) continue;
            let message = 'Ретроградный Меркурий: проверять договорённости, адреса и документы; полезно возвращаться к незавершённому. ' +
                'Поездки и сделки не запрещены: перепроверять условия и оставлять запас времени.';
            if (isoDate === localDate(period.start_utc)) {
                message += ` Сегодня начинается ретроградный период: ${localTime(period.start_utc)}. Заканчивается: ${localTime(period.end_utc)}.`;
            }
            add('mercury_retrograde', message);
        }
        for (const period of periods.moon_vrischika || []) {
            if (!intervalOnDay(period, isoDate)) continue;
            let message = 'Луна во Вришчике (нича): полезны спокойные привычные дела и внимательное отношение к реакциям. ' +
                'Не делать поспешных выводов из сильных эмоций; личная садхана идёт своим чередом.';
            message += ` Вход: ${localTime(period.start_utc)}. Выход: ${localTime(period.end_utc)}.`;
            add('moon_vrischika', message);
        }
        const extraPeriods = {
            moon_vrishabha: 'Луна в Тельце (Вришабха, экзальтация)',
            amavasya: 'Амавасья — 30-я титхи',
            purnima: 'Пурнима — 15-я титхи',
            moon_jupiter_same_sign: 'Транзитные Луна и Юпитер в одном сидерическом знаке'
        };
        for (const [key, title] of Object.entries(extraPeriods)) {
            for (const period of periods[key] || []) {
                if (intervalOnDay(period, isoDate)) add(key, `${title}. С ${localTime(period.start_utc)} до ${localTime(period.end_utc)}.`);
            }
        }
        for (const event of dataset.moon_jupiter_conjunctions || []) {
            if (localDate(event.maximum_utc) === isoDate) add('moon_jupiter_conjunction',
                `Точное соединение транзитных Луны и Юпитера по долготе: ${localTime(event.maximum_utc)}. Геоцентрическое событие, без орба.`);
        }
        return output;
    }
    const eventsFor = day => recordsFor(day).map(event => event.text);
    const badgeLabels = {
        mercury_retrograde: 'Меркурий ретро', moon_vrischika: 'Луна: Скорпион · нича',
        moon_vrishabha: 'Луна: Телец · экзальтация', amavasya: 'Амавасья', purnima: 'Пурнима',
        moon_jupiter_same_sign: 'Луна + Юпитер · один знак'
    };
    const badgeCache = new Map();
    function badgesFor(day) {
        if (badgeCache.has(day)) return [...badgeCache.get(day)];
        const badges = [];
        for (const eclipse of dates.get(day) || []) badges.push(eclipse.kind === 'solar' ? 'Солнечное затмение' : 'Лунное затмение');
        if (corridors.some(pair => inCorridor(pair, day))) badges.push('Коридор затмений');
        for (const [key, label] of Object.entries(badgeLabels)) {
            if ((dataset.intervals_utc[key] || []).some(period => intervalOnDay(period, day))) badges.push(label);
        }
        if ((dataset.moon_jupiter_conjunctions || []).some(event => localDate(event.maximum_utc) === day)) badges.push('Луна + Юпитер · точно');
        badgeCache.set(day, badges);
        return [...badges];
    }
    function decorateGrid() {
        const year = typeof currentYear !== 'undefined' ? Number(currentYear) : NaN;
        const month = typeof currentMonth !== 'undefined' ? Number(currentMonth) : NaN;
        if (!Number.isInteger(year) || !Number.isInteger(month)) return;
        document.querySelectorAll('#calendarGrid .day-card, #monthGrid .day-card').forEach(card => {
            card.querySelectorAll('.astro-grid-markers').forEach(marker => marker.remove());
            const number = Number(card.querySelector('.day-num')?.textContent?.trim());
            if (!Number.isInteger(number) || number < 1 || card.classList.contains('other-month') || card.style.pointerEvents === 'none') return;
            const day = `${year}-${String(month).padStart(2, '0')}-${String(number).padStart(2, '0')}`;
            const labels = badgesFor(day);
            if (!labels.length) return;
            const group = document.createElement('div');
            group.className = 'astro-grid-markers';
            for (const label of labels) {
                const badge = document.createElement('span');
                badge.className = 'astro-day-marker';
                badge.textContent = label;
                group.appendChild(badge);
            }
            card.appendChild(group);
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
        const opened = originalOpen.apply(this, arguments);
        const modal = document.getElementById('dayModal');
        if (!modal) return opened;
        const existing = modal.querySelector('#astroDayPanel');
        if (existing) existing.remove();
        const events = recordsFor(day.date);
        if (!events.length) return opened;
        const panel = document.createElement('section');
        panel.id = 'astroDayPanel';
        panel.className = 'astro-day-panel';
        const title = document.createElement('h3');
        title.textContent = 'Небесные события';
        panel.appendChild(title);
        const list = document.createElement('ul');
        for (const event of events) {
            const entry = document.createElement('li');
            entry.textContent = event.text;
            const guidance = window.CalendarGuidance?.render(event.kind);
            if (guidance) entry.appendChild(guidance);
            list.appendChild(entry);
        }
        panel.appendChild(list);
        const anchor = modal.querySelector('#mUpayasList');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor);
        else modal.querySelector('.modal-content')?.appendChild(panel);
        return opened;
    };
    window.CalendarAstronomy = Object.freeze({eventsFor, recordsFor, badgesFor, decorateGrid});
})();
