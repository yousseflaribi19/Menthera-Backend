const UserService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// PAS BESOIN DU mot de passe pour afficher le profil
class UserController {
  /**
   * @desc    Mettre à jour le profil utilisateur (name, avatar)
   * @route   PUT /api/v1/user/profile
   * @access  Private
   */
  static async updateProfile(req, res, next) {
    try {
      const user = await UserService.updateProfile(req.user._id, req.body);
      const response = ApiResponse.success({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }, 'Profil mis à jour avec succès');
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  
  /**
   * @desc    Voir le profil utilisateur connecté
   * @route   GET /api/v1/user/me
   * @access  Private
   */
static async getCurrentUser(req, res, next) {
  try {
    // Récupère l'utilisateur simple (pas besoin populate)
    const userDoc = await UserService.getUserById(req.user._id);

    // Nouveau calcul premium avec les nouveaux champs du modèle
    let isPremium = false;
    if (userDoc.isPremium === true) {
      // Si la date d'expiration est définie, vérifie la validité
      if (!userDoc.premiumExpiresAt || new Date(userDoc.premiumExpiresAt) > new Date()) {
        isPremium = true;
      }
    }

    // Tu peux donc répondre comme ça, plus besoin du tier si tu ne le gères plus
    const response = ApiResponse.success({
      id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      isEmailVerified: userDoc.isEmailVerified,
      authProvider: userDoc.authProvider,
      lastLogin: userDoc.lastLogin,
      createdAt: userDoc.createdAt,
      isPremium,                         
      premiumExpiresAt: userDoc.premiumExpiresAt, 
      stripeSubscriptionId: userDoc.stripeSubscriptionId,

      lastEmotion: userDoc.lastEmotion,
      emotionHistory: userDoc.emotionHistory ?? [],
      activeExercises: userDoc.activeExercises ?? [],
      lastSummary: userDoc.lastSummary ?? null,
      lastDangerLevel: userDoc.lastDangerLevel ?? null
    });

    res.status(response.statusCode).json(response);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    next(error);
  }
}



  /**
   * @desc    Changer le mot de passe
   * @route   PUT /api/v1/user/change-password
   * @access  Private
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await UserService.updatePassword(req.user._id, oldPassword, newPassword);
      const response = ApiResponse.success(null, 'Mot de passe changé avec succès');
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
