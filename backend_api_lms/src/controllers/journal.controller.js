/**
 * Journal Controller
 */

const journalService = require("../services/journal.service");
const { successResponse } = require("../utils/response");

async function getJournals(req, res, next) {
  try {
    const data = await journalService.listJournals(req.query);
    return successResponse(res, data, "Journals retrieved");
  } catch (error) {
    next(error);
  }
}

async function getJournalById(req, res, next) {
  try {
    const data = await journalService.getJournalById(req.params.id);
    return successResponse(res, data, "Journal retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getJournals,
  getJournalById,
};
