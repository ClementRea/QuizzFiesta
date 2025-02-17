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
          });

          const token = generateToken(user._id);

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
        next(error);
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

        // on trouve le user et on compare les mdp
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // On met à jour la connexion
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        user.password = undefined;

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