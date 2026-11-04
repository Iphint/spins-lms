/**
 * Material Controller
 */

const materialService = require("../services/material.service");
const { successResponse } = require("../utils/response");

async function getMaterials(req, res, next) {
  try {
    const data = await materialService.listMaterials(req.query);
    return successResponse(res, data, "Materials retrieved");
  } catch (error) {
    next(error);
  }
}

async function bulkCreateMaterials(req, res, next) {
  try {
    const result = await materialService.bulkCreateMaterials(req.body);
    return successResponse(res, result, `${result.length} materials created`);
  } catch (error) {
    next(error);
  }
}

async function getMaterialById(req, res, next) {
  try {
    const data = await materialService.getMaterialById(req.params.id);
    return successResponse(res, data, "Material retrieved");
  } catch (error) {
    next(error);
  }
}

async function createMaterial(req, res, next) {
  try {
    const data = await materialService.createMaterial(req.body, req.user);
    return successResponse(res, data, "Material created");
  } catch (error) {
    next(error);
  }
}

async function updateMaterial(req, res, next) {
  try {
    const data = await materialService.updateMaterial(req.params.id, req.body);
    return successResponse(res, data, "Material updated");
  } catch (error) {
    next(error);
  }
}

async function deleteMaterial(req, res, next) {
  try {
    await materialService.deleteMaterial(req.params.id);
    return successResponse(res, null, "Material deleted");
  } catch (error) {
    next(error);
  }
}

async function deployMaterialToClasses(req, res, next) {
  try {
    const data = await materialService.deployMaterialToClasses(req.body);
    return successResponse(res, data, "Material deployed to classes successfully");
  } catch (error) {
    next(error);
  }
}

async function cloneCurriculum(req, res, next) {
  try {
    const data = await materialService.cloneCurriculum(req.body);
    return successResponse(res, data, "Curriculum cloned successfully");
  } catch (error) {
    next(error);
  }
}

async function applyTemplateCurriculum(req, res, next) {
  try {
    const data = await materialService.applyTemplateCurriculum(req.body);
    return successResponse(res, data, "Template curriculum applied successfully");
  } catch (error) {
    next(error);
  }
}

async function uploadMaterialFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file yang diunggah" });
    }
    const fileUrl = `/uploads/materials/${req.file.filename}`;
    return successResponse(
      res,
      {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
      "File materi berhasil diunggah",
      201
    );
  } catch (error) {
    next(error);
  }
}

async function getCurriculumTemplates(req, res, next) {
  try {
    const data = materialService.getCurriculumTemplates();
    return successResponse(res, data, "Curriculum templates retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMaterials,
  bulkCreateMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  deployMaterialToClasses,
  cloneCurriculum,
  applyTemplateCurriculum,
  uploadMaterialFile,
  getCurriculumTemplates,
};
