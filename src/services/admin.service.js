const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const WeeklySummary = require('../models/WeeklySummary.model');
const Notification = require('../models/Notification.model');

async function getDashboardStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const totalSubscriptions = await Subscription.countDocuments();

    const subs = await Subscription.find({});
    const premiumUsers = subs.filter(s => s.isActive && (!s.expiresAt || s.expiresAt > new Date())).length;

    const weeklySummaries = await WeeklySummary.countDocuments();
    const notifications = await Notification.countDocuments();

    return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        premiumUsers,
        totalSubscriptions,
        weeklySummaries,
        notifications
    };
}

async function listUsers({ page = 1, limit = 50, q = '', excludeUserId = null }) {
    const skip = (page - 1) * limit;

    // ✅ CONSTRUIRE LA REQUÊTE AVEC EXCLUSION
    const query = {
        $and: [
            q ? {
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
            } : {},
            excludeUserId ? { _id: { $ne: excludeUserId } } : {} // Exclure l'admin connecté
        ]
    };

    const [items, total] = await Promise.all([
        User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ]);

    return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}


async function getUserById(id) {
    return User.findById(id).select('-password');
}

async function createUser(payload) {
    const user = new User(payload);
    return user.save();
}

async function updateUser(id, payload) {
    const opts = { new: true, runValidators: true };
    return User.findByIdAndUpdate(id, payload, opts).select('-password');
}

async function deleteUser(id) {
    return User.findByIdAndDelete(id);
}

module.exports = {
    getDashboardStats,
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
