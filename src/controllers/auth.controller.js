/**
 * Auth Controller
 */

const authService = require("../services/auth.service");
const { successResponse } = require("../utils/response");

async function login(req, res, next) {
  try {
    const { email, identifier, password } = req.body;
    const result = await authService.login(identifier || email, password);
    return successResponse(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    return successResponse(res, result, "User retrieved");
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await authService.listUsers();
    return successResponse(res, result, "Users retrieved");
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await authService.createUser(req.body);
    return successResponse(res, result, "User created", 201);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const result = await authService.updateUser(req.params.id, req.body);
    return successResponse(res, result, "User updated");
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    await authService.deleteUser(req.params.id, req.user.id);
    return successResponse(res, null, "User deleted");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
