/**
 * Journal Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { NotFoundError } = require("../utils/errors");

async function listJournals(query = {}) {
  const { classId } = query;
  const cacheKey = `journals:list:${classId || "all"}`;
  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (classId) where.classId = classId;

    return prisma.journal.findMany({
      where,
      orderBy: { date: "desc" },
    });
  });
}

async function getJournalById(id) {
  return cache.remember(`journals:detail:${id}`, 600, async () => {
    const data = await prisma.journal.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundError("Journal not found");
    }
    return data;
  });
}

module.exports = {
  listJournals,
  getJournalById,
};
