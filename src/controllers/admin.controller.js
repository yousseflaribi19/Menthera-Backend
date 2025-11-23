const AdminService = require('../services/admin.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

async function dashboard(req, res, next){
  try {
    const stats = await AdminService.getDashboardStats();
    return res.json(ApiResponse.success(stats, 'Dashboard stats'));
  } catch (err) { next(err); }
}

// New endpoint for average voice messages per user
async function averageVoiceMessages(req, res, next){
  try {
    const stats = await AdminService.getAverageVoiceMessagesPerUser();
    return res.json(ApiResponse.success(stats, 'Average voice messages per user'));
  } catch (err) { next(err); }
}

// New endpoint for community emotion trends
async function communityEmotionTrends(req, res, next){
  try {
    const period = req.query.period || 'week';
    const stats = await AdminService.getCommunityEmotionTrends(period);
    return res.json(ApiResponse.success(stats, `Community emotion trends for ${period}`));
  } catch (err) { next(err); }
}

// New endpoint for user emotional curve
async function userEmotionalCurve(req, res, next){
  try {
    const userId = req.params.userId;
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    const stats = await AdminService.getUserEmotionalCurve(userId);
    return res.json(ApiResponse.success(stats, 'User emotional curve'));
  } catch (err) { next(err); }
}

// New endpoint for messages over time
async function messagesOverTime(req, res, next){
  try {
    const period = req.query.period || 'week';
    const stats = await AdminService.getMessagesOverTime(period);
    return res.json(ApiResponse.success(stats, `Messages over time for ${period}`));
  } catch (err) { next(err); }
}

// New endpoint for general rating statistics
async function generalRatingStats(req, res, next){
  try {
    const stats = await AdminService.getGeneralRatingStats();
    return res.json(ApiResponse.success(stats, 'General rating statistics'));
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
  averageVoiceMessages,
  communityEmotionTrends,
  userEmotionalCurve,
  messagesOverTime,
  generalRatingStats,
  usersList,
  getUser,
  createUser,
  updateUser,
  deleteUser
};