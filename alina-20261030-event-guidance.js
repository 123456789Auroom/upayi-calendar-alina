/* Shared text-only event guidance, rendered only for the opened day. */
(function () {
    'use strict';
    const fields = Object.freeze({meaning: 'Что означает', opportunity: 'Как использовать',
        actions: 'Что делать', avoid: 'Чего избегать', caution: 'На что обратить внимание', closing: 'Завершение'});
    function render(kind) {
        const guide = window.CALENDAR_GUIDANCE?.[kind];
        if (!guide || !Object.keys(fields).every(key => typeof guide[key] === 'string' && guide[key].trim())) return null;
        const details = document.createElement('details');
        details.className = 'event-guidance';
        const summary = document.createElement('summary');
        summary.textContent = 'Значение и порядок действий';
        details.appendChild(summary);
        for (const [key, label] of Object.entries(fields)) {
            const section = document.createElement('section');
            const heading = document.createElement('h4');
            heading.textContent = label;
            const paragraph = document.createElement('p');
            paragraph.textContent = guide[key];
            section.appendChild(heading);
            section.appendChild(paragraph);
            details.appendChild(section);
        }
        return details;
    }
    window.CalendarGuidance = Object.freeze({render});
})();
