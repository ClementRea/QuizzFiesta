const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h'}
    );
};

//REGISTER
exports.register = async (req, res, next) => {
  try {
      const { email, password, userName, role } = req.body;

      // On vérifie s'il exite déja un user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({
              status: 'error',
              message: 'Email already registered',
          });
      }else{            
        // On crée un nouveau user
        const user = await User.create({
            email,
            password,
            userName,
            role,
            lastLogin: new Date()
        });

        const token = generateToken(user._id);

        // On retire le mot de passe de la réponse
        user.password = undefined;
        
        res.status(201).json({
            status: 'success register',
            token,
            data: {
                user
            }
        });
      }
  } catch (error) {
      next("Erreur Back formulaire", error);
  }
};

//LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // On vérifie si l'email et le mdp sont fournis
    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide email and password'
        });
    }

    // On trouve le user et on compare les mdp
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid email or password'
        });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    user.password = undefined;

    console.log("success login")
    res.status(200).json({
        status: 'success login',
        token,
        data: {
            user
        }
    });
  } catch (error) {
      next(error);
  }
};

// Déconnexion
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};