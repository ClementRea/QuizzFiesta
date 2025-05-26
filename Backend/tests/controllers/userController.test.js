
const { getMe, updateMe } = require('../../controllers/userController');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('UserController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      user: { id: 'user123' },
      body: {},
      file: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('getMe', () => {
    it('should return user data when user is found', async () => {
      const mockUser = {
        id: 'user123',
        userName: 'testuser',
        email: 'test@example.com'
      };
      
      User.findById.mockResolvedValue(mockUser);

      await getMe(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockUser
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      User.findById.mockResolvedValue(null);

      await getMe(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      User.findById.mockRejectedValue(dbError);

      await getMe(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('should update user without password change', async () => {
      req.body = {
        userName: 'newusername',
        email: 'newemail@example.com'
      };

      const mockUpdatedUser = {
        id: 'user123',
        userName: 'newusername',
        email: 'newemail@example.com'
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      await updateMe(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { userName: 'newusername', email: 'newemail@example.com' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockUpdatedUser
        }
      });
    });

    it('should update user with avatar when file is uploaded', async () => {
      req.body = { userName: 'newusername' };
      req.file = { filename: 'avatar123.jpg' };

      const mockUpdatedUser = {
        id: 'user123',
        userName: 'newusername',
        avatar: 'avatar123.jpg'
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      await updateMe(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { userName: 'newusername', avatar: 'avatar123.jpg' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update password when current and new passwords are provided', async () => {
      req.body = {
        userName: 'newusername',
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      };

      const mockUser = {
        id: 'user123',
        userName: 'oldusername',
        password: 'hashedoldpass',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await updateMe(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldpass123');
      expect(mockUser.userName).toBe('newusername');
      expect(mockUser.save).toHaveBeenCalled();
      
      expect(mockUser.password).toBeUndefined();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockUser
        }
      });
    });

    it('should return 400 when current password is incorrect', async () => {
      req.body = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass123'
      };

      const mockUser = {
        id: 'user123',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await updateMe(req, res, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpass');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Le mot de passe actuel est incorrect'
      });
    });

    it('should return 404 when user is not found during password change', async () => {
      req.body = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await updateMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    });

    it('should return 404 when user is not found during regular update', async () => {
      req.body = { userName: 'newusername' };
      User.findByIdAndUpdate.mockResolvedValue(null);

      await updateMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    });

    it('should filter out unauthorized fields', async () => {
      req.body = {
        userName: 'newusername',
        email: 'newemail@example.com',
        role: 'admin',
        id: 'hacker123'
      };
    
      const mockUpdatedUser = { 
        id: 'user123',
        userName: 'newusername',
        email: 'newemail@example.com'
      };
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);
    
      await updateMe(req, res, next);
    
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { userName: 'newusername', email: 'newemail@example.com' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockUpdatedUser
        }
      });
    });

    it('should call next with error when database error occurs', async () => {
      req.body = { userName: 'newusername' };
      const dbError = new Error('Database error');
      User.findByIdAndUpdate.mockRejectedValue(dbError);

      await updateMe(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});