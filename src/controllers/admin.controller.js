const AdminService = require('../services/admin.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

async function dashboard(req, res, next){
  try {
    const stats = await AdminService.getDashboardStats();
    return res.json(ApiResponse.success(stats, 'Dashboard stats'));
  } catch (err) { next(err); }
}

async function usersList(req, res, next){
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const q = req.query.q || '';
    const data = await AdminService.listUsers({ page, limit, q });
    return res.json(ApiResponse.success(data, 'Users list'));
  } catch (err) { next(err); }
}

async function getUser(req, res, next){
  try {
    const user = await AdminService.getUserById(req.params.id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return res.json(ApiResponse.success(user, 'User retrieved'));
  } catch (err) { next(err); }
}

async function createUser(req, res, next){
  try {
    const payload = req.body;
    const user = await AdminService.createUser(payload);
    return res.status(201).json(ApiResponse.created(user, 'Utilisateur créé'));
  } catch (err) { next(err); }
}

async function updateUser(req, res, next){
  try {
    const user = await AdminService.updateUser(req.params.id, req.body);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return res.json(ApiResponse.success(user, 'Utilisateur mis à jour'));
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next){
  try {
    const user = await AdminService.deleteUser(req.params.id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return res.json(ApiResponse.success(null, 'Utilisateur supprimé'));
  } catch (err) { next(err); }
}

module.exports = {
  dashboard,
  usersList,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
