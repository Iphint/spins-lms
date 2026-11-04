/**
 * Academic Year Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { NotFoundError } = require("../utils/errors");

async function listAcademicYears() {
  return cache.remember("academic_years:list", 600, async () => {
    return prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });
  });
}

async function getActiveAcademicYear() {
  return cache.remember("academic_years:active", 600, async () => {
    return prisma.academicYear.findFirst({ where: { isActive: true } });
  });
}

async function getAcademicYearById(id) {
  return cache.remember(`academic_years:detail:${id}`, 600, async () => {
    const data = await prisma.academicYear.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundError("Academic year not found");
    }
    return data;
  });
}

module.exports = {
  listAcademicYears,
  getActiveAcademicYear,
  getAcademicYearById,
};
