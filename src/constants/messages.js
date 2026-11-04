/**
 * Standard API messages
 */
const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    INVALID_CREDENTIALS: "Email atau password salah",
    ACCOUNT_INACTIVE: "Akun tidak aktif. Hubungi admin.",
    TOKEN_REQUIRED: "Authentication required. Please login.",
    TOKEN_INVALID: "Invalid or expired token. Please login again.",
    ADMIN_REQUIRED: "Admin access required",
    USER_NOT_FOUND: "User not found",
    EMAIL_EXISTS: "Email sudah terdaftar",
    PASSWORD_MIN_LENGTH: "Password minimal 6 karakter",
    CANNOT_DELETE_SELF: "Tidak dapat menghapus akun sendiri",
  },
  COMMON: {
    NOT_FOUND: "Data tidak ditemukan",
    CREATED: "Data berhasil dibuat",
    UPDATED: "Data berhasil diperbarui",
    DELETED: "Data berhasil dihapus",
    FETCHED: "Data berhasil diambil",
  },
};

module.exports = MESSAGES;
