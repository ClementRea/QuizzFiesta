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
    // Filtrer les champs autorisés (sans avatar car on le gère séparément)
    const filteredBody = filterObj(req.body, 'userName', 'email');
    
    // Ajouter l'avatar si un fichier a été uploadé
    if (req.file) {
      filteredBody.avatar = req.file.filename; // Stocke juste le nom du fichier
    }
    
    // Si changement de mot de passe
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
      
      // Mise à jour des autres champs
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
    
    // Mise à jour sans changement de mot de passe
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