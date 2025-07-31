const User = require('../models/User');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = async (req, res, next) => {
  try {
    console.log('User ID from token:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    if (req.user.role === 'user' && req.user.id !== req.params.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé : vous ne pouvez consulter que votre propre profil.'
      });
    }

    const user = await User.findById(req.params.id).select('-refreshTokens -tokenVersion -suspiciousActivity');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const filteredBody = filterObj(req.body, 'userName', 'email');
    
    if (req.file) {
      filteredBody.avatar = req.file.filename;
    }
    
    if (req.body.currentPassword && req.body.newPassword) {
      const user = await User.findById(req.user.id).select('+password');
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Utilisateur non trouvé'
        });
      }
      
      const isPasswordCorrect = await user.comparePassword(req.body.currentPassword);
      
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: 'error',
          message: 'Le mot de passe actuel est incorrect'
        });
      }
      
      user.password = req.body.newPassword;
      
      Object.keys(filteredBody).forEach(key => {
        user[key] = filteredBody[key];
      });
      
      await user.save();
      
      user.password = undefined;
      
      return res.status(200).json({
        status: 'success',
        data: {
          user
        }
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error in updateMe:', error);
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    let query = {};
    let selectFields = '-refreshTokens -tokenVersion -suspiciousActivity';

    if (req.user.role === 'gestionnaire') {
      if (!req.user.organization) {
        return res.status(403).json({
          status: 'error',
          message: 'Gestionnaire sans organisation assignée.'
        });
      }
      query.organization = req.user.organization;
    }

    const users = await User.find(query).select(selectFields).populate('organization', 'name');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!['user', 'gestionnaire', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Rôle invalide.'
      });
    }

    if (req.user.id === targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous ne pouvez pas modifier votre propre rôle.'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé.'
      });
    }

    if (req.user.role === 'gestionnaire') {
      if (!req.user.organization || !targetUser.organization || 
          targetUser.organization.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Vous ne pouvez modifier que les utilisateurs de votre organisation.'
        });
      }
      
      if (role === 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Seul un administrateur peut attribuer le rôle admin.'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { role },
      { new: true, runValidators: true }
    ).select('-refreshTokens -tokenVersion -suspiciousActivity');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user.id === targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous ne pouvez pas supprimer votre propre compte.'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé.'
      });
    }

    if (req.user.role === 'gestionnaire') {
      if (!req.user.organization || !targetUser.organization || 
          targetUser.organization.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Vous ne pouvez supprimer que les utilisateurs de votre organisation.'
        });
      }
      
      if (targetUser.role === 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Vous ne pouvez pas supprimer un administrateur.'
        });
      }
    }

    await User.findByIdAndDelete(targetUserId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    next(error);
  }
};

exports.getUsersByOrganization = async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId;

    if (req.user.role === 'gestionnaire') {
      if (!req.user.organization || req.user.organization.toString() !== organizationId) {
        return res.status(403).json({
          status: 'error',
          message: 'Vous ne pouvez consulter que les utilisateurs de votre organisation.'
        });
      }
    }

    const users = await User.find({ organization: organizationId })
      .select('-refreshTokens -tokenVersion -suspiciousActivity')
      .populate('organization', 'name');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Error in getUsersByOrganization:', error);
    next(error);
  }
};