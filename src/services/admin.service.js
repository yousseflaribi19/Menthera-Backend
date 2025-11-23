const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const WeeklySummary = require('../models/WeeklySummary.model');
const Notification = require('../models/Notification.model');
const Session = require('../models/Session.model');
const AdviceRating = require('../models/AdviceRating.model');

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

// New function to calculate average voice messages per user
async function getAverageVoiceMessagesPerUser() {
    // Get all sessions with user and messages populated
    const sessions = await Session.find({}).select('user messages');
    
    // Count voice messages per user
    const userMessageCounts = {};
    let totalMessages = 0;
    let totalUsersWithMessages = 0;
    
    for (const session of sessions) {
        if (!session.user || !session.messages) continue;
        
        const userId = session.user.toString();
        const voiceMessages = session.messages.filter(m => m.type === 'audio' && m.role === 'user').length;
        
        if (voiceMessages > 0) {
            if (!userMessageCounts[userId]) {
                userMessageCounts[userId] = 0;
                totalUsersWithMessages++;
            }
            userMessageCounts[userId] += voiceMessages;
            totalMessages += voiceMessages;
        }
    }
    
    const average = totalUsersWithMessages > 0 ? totalMessages / totalUsersWithMessages : 0;
    
    return {
        averageVoiceMessagesPerUser: parseFloat(average.toFixed(2)),
        totalVoiceMessages: totalMessages,
        usersWithVoiceMessages: totalUsersWithMessages
    };
}

// New function to get community emotion trends
async function getCommunityEmotionTrends(period = 'week') {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 7);
    }
    
    // Get sessions within date range
    const sessions = await Session.find({
        createdAt: { $gte: startDate, $lte: now }
    }).select('messages createdAt');
    
    // Count emotions by period
    const emotionData = {
        day: {},
        week: {},
        month: {}
    };
    
    const emotionLabels = ['joie', 'tristesse', 'colere', 'anxiete', 'peur', 'neutre'];
    
    // Initialize counts
    emotionLabels.forEach(emotion => {
        emotionData.day[emotion] = 0;
        emotionData.week[emotion] = 0;
        emotionData.month[emotion] = 0;
    });
    
    // Process messages
    for (const session of sessions) {
        if (!session.messages) continue;
        
        const sessionDate = new Date(session.createdAt);
        const sessionPeriod = {
            day: sessionDate.toDateString() === now.toDateString() ? 'day' : null,
            week: sessionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) ? 'week' : null,
            month: sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear() ? 'month' : null
        };
        
        for (const message of session.messages) {
            if (message.emotionAtTurn) {
                const emotion = message.emotionAtTurn;
                if (sessionPeriod.day) emotionData.day[emotion]++;
                if (sessionPeriod.week) emotionData.week[emotion]++;
                if (sessionPeriod.month) emotionData.month[emotion]++;
            }
        }
    }
    
    return {
        period: period,
        startDate: startDate,
        endDate: now,
        emotions: emotionData[period]
    };
}

// New function to get emotional curve for a specific user
async function getUserEmotionalCurve(userId) {
    // Get all sessions for the user ordered by date
    const sessions = await Session.find({ user: userId })
        .select('messages createdAt emotion')
        .sort({ createdAt: 1 });
    
    // Extract emotion data points
    const emotionCurve = [];
    
    for (const session of sessions) {
        // Use session-level emotion if available
        if (session.emotion) {
            emotionCurve.push({
                date: session.createdAt,
                emotion: session.emotion,
                type: 'session'
            });
        }
        
        // Also check individual messages for more granular data
        if (session.messages) {
            for (const message of session.messages) {
                if (message.emotionAtTurn) {
                    emotionCurve.push({
                        date: message.createdAt || session.createdAt,
                        emotion: message.emotionAtTurn,
                        type: 'message'
                    });
                }
            }
        }
    }
    
    // Sort by date
    emotionCurve.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
        userId: userId,
        emotionCurve: emotionCurve,
        totalDataPoints: emotionCurve.length
    };
}

// New function to get message counts over time periods
async function getMessagesOverTime(period = 'week') {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 7);
    }
    
    // Get sessions within date range
    const sessions = await Session.find({
        createdAt: { $gte: startDate, $lte: now }
    }).select('messages createdAt');
    
    // Initialize counters
    let totalMessages = 0;
    let audioMessages = 0;
    let textMessages = 0;
    
    // Group by date
    const messagesByDate = {};
    
    // Process sessions
    for (const session of sessions) {
        if (!session.messages) continue;
        
        for (const message of session.messages) {
            totalMessages++;
            if (message.type === 'audio') {
                audioMessages++;
            } else if (message.type === 'text') {
                textMessages++;
            }
            
            // Group by date
            const dateKey = new Date(message.createdAt || session.createdAt).toISOString().split('T')[0];
            if (!messagesByDate[dateKey]) {
                messagesByDate[dateKey] = { total: 0, audio: 0, text: 0 };
            }
            messagesByDate[dateKey].total++;
            if (message.type === 'audio') {
                messagesByDate[dateKey].audio++;
            } else if (message.type === 'text') {
                messagesByDate[dateKey].text++;
            }
        }
    }
    
    return {
        period: period,
        startDate: startDate,
        endDate: now,
        totalMessages: totalMessages,
        audioMessages: audioMessages,
        textMessages: textMessages,
        messagesByDate: messagesByDate
    };
}

// New function to get general rating statistics
async function getGeneralRatingStats() {
    // Get all ratings
    const ratings = await AdviceRating.find({}).select('rating createdAt');
    
    // Initialize counters
    let totalRatings = 0;
    let sumRatings = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Group by date
    const ratingsByDate = {};
    
    // Process ratings
    for (const rating of ratings) {
        totalRatings++;
        sumRatings += rating.rating;
        ratingDistribution[rating.rating]++;
        
        // Group by date
        const dateKey = new Date(rating.createdAt).toISOString().split('T')[0];
        if (!ratingsByDate[dateKey]) {
            ratingsByDate[dateKey] = { count: 0, sum: 0 };
        }
        ratingsByDate[dateKey].count++;
        ratingsByDate[dateKey].sum += rating.rating;
    }
    
    // Calculate average
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    
    // Calculate daily averages
    const dailyAverages = {};
    for (const [date, data] of Object.entries(ratingsByDate)) {
        dailyAverages[date] = data.sum / data.count;
    }
    
    return {
        totalRatings: totalRatings,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution: ratingDistribution,
        ratingsByDate: ratingsByDate,
        dailyAverages: dailyAverages
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
    getAverageVoiceMessagesPerUser,
    getCommunityEmotionTrends,
    getUserEmotionalCurve,
    getMessagesOverTime,
    getGeneralRatingStats,
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};