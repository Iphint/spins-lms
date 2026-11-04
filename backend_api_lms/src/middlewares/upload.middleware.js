const multer = require("multer");
const path = require("path");
const fs = require("fs");

const worksheetsDir = path.join(__dirname, "../../public/uploads/worksheets");
const materialsDir = path.join(__dirname, "../../public/uploads/materials");
const schedulesDir = path.join(__dirname, "../../public/uploads/schedules");
const rostersDir = path.join(__dirname, "../../public/uploads/rosters");
if (!fs.existsSync(worksheetsDir)) {
  fs.mkdirSync(worksheetsDir, { recursive: true });
}
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}
if (!fs.existsSync(schedulesDir)) {
  fs.mkdirSync(schedulesDir, { recursive: true });
}
if (!fs.existsSync(rostersDir)) {
  fs.mkdirSync(rostersDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const url = (req.baseUrl || "") + (req.originalUrl || "");
    if (url.includes("schedule")) {
      cb(null, schedulesDir);
    } else if (url.includes("roster") || url.includes("student")) {
      cb(null, rostersDir);
    } else if (url.includes("material")) {
      cb(null, materialsDir);
    } else {
      cb(null, worksheetsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = [
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md",
    ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".sql", ".c", ".cpp", ".java", ".zip"
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file ${ext} tidak didukung. Format yang diizinkan: PDF, Dokumen, Gambar, dan Berkas Kode.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

module.exports = upload;
