export function countVacationChargeableDays(startDate: string, endDate: string) {
    if (!startDate || !endDate || endDate < startDate) return 0;

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const holidays = getMexicoFederalHolidayDates(start.getFullYear(), end.getFullYear());
    let total = 0;
    const cursor = new Date(start);

    while (cursor <= end) {
        const dateKey = formatDateKey(cursor);

        if (!isWeekend(cursor) && !holidays.has(dateKey)) {
            total += 1;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return total;
}

export function getMexicoFederalHolidayDates(startYear: number, endYear = startYear) {
    const holidays = new Set<string>();

    for (let year = startYear; year <= endYear; year += 1) {
        [
            new Date(year, 0, 1),
            firstMondayOfMonth(year, 1),
            thirdMondayOfMonth(year, 2),
            new Date(year, 4, 1),
            new Date(year, 8, 16),
            thirdMondayOfMonth(year, 10),
            new Date(year, 11, 25)
        ].forEach((date) => holidays.add(formatDateKey(date)));

        if ((year - 2024) % 6 === 0) {
            holidays.add(formatDateKey(new Date(year, 9, 1)));
        }
    }

    return holidays;
}

function parseLocalDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isWeekend(date: Date) {
    return date.getDay() === 0 || date.getDay() === 6;
}

function firstMondayOfMonth(year: number, month: number) {
    return nthWeekdayOfMonth(year, month, 1, 1);
}

function thirdMondayOfMonth(year: number, month: number) {
    return nthWeekdayOfMonth(year, month, 1, 3);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
    const date = new Date(year, month, 1);

    while (date.getDay() !== weekday) {
        date.setDate(date.getDate() + 1);
    }

    date.setDate(date.getDate() + (occurrence - 1) * 7);
    return date;
}
