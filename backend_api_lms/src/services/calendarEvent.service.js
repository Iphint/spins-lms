/**
 * Calendar Event Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { NotFoundError } = require("../utils/errors");

async function listCalendarEvents(query = {}) {
  const { month, year } = query;
  const cacheKey = `calendar_events:list:${month || "all"}:${year || "all"}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (month && year) {
      const m = String(month).padStart(2, "0");
      where.date = { startsWith: `${year}-${m}` };
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { date: "asc" },
    });
  });
}

async function getCalendarEventById(id) {
  return cache.remember(`calendar_events:detail:${id}`, 600, async () => {
    const data = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundError("Calendar event not found");
    }
    return data;
  });
}

module.exports = {
  listCalendarEvents,
  getCalendarEventById,
};
