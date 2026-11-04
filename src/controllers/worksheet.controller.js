/**
 * Worksheet Controller
 */

const worksheetService = require("../services/worksheet.service");
const { successResponse } = require("../utils/response");

async function getWorksheets(req, res, next) {
  try {
    const data = await worksheetService.listWorksheets(req.query);
    return successResponse(res, data, "Worksheets retrieved");
  } catch (error) {
    next(error);
  }
}

async function getWorksheetById(req, res, next) {
  try {
    const data = await worksheetService.getWorksheetById(req.params.id);
    return successResponse(res, data, "Worksheet retrieved");
  } catch (error) {
    next(error);
  }
}

async function createWorksheet(req, res, next) {
  try {
    const data = await worksheetService.createWorksheet(req.body, req.user);
    return successResponse(res, data, "Worksheet created", 201);
  } catch (error) {
    next(error);
  }
}

async function updateWorksheet(req, res, next) {
  try {
    const data = await worksheetService.updateWorksheet(req.params.id, req.body);
    return successResponse(res, data, "Worksheet updated");
  } catch (error) {
    next(error);
  }
}

async function deleteWorksheet(req, res, next) {
  try {
    await worksheetService.deleteWorksheet(req.params.id);
    return successResponse(res, null, "Worksheet deleted");
  } catch (error) {
    next(error);
  }
}

async function uploadWorksheetFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file yang diunggah" });
    }
    const fileUrl = `/uploads/worksheets/${req.file.filename}`;
    return successResponse(
      res,
      {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
      "File berhasil diunggah",
      201
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWorksheets,
  getWorksheetById,
  createWorksheet,
  updateWorksheet,
  deleteWorksheet,
  uploadWorksheetFile,
};
