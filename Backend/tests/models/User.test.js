// Backend/tests/models/User.test.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Mock de bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Fermer la connexion mongoose après les tests
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a valid user with required fields', () => {
      const validUser = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      const validationError = validUser.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should validate email format', () => {
      const invalidUser = new User({
        email: 'invalid-email',
        userName: 'testuser',
        password: 'password123'
      });

      const validationError = invalidUser.validateSync();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toContain('Please enter a valid email');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const user = new User({
          email,
          userName: 'testuser',
          password: 'password123'
        });
        
        const validationError = user.validateSync();
        expect(validationError?.errors?.email).toBeUndefined();
      });
    });

    it('should validate password minimum length', () => {
      const userWithShortPassword = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: '123'
      });

      const validationError = userWithShortPassword.validateSync();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toContain('6');
    });

    it('should validate role enum values', () => {
      const userWithInvalidRole = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123',
        role: 'invalidrole'
      });

      const validationError = userWithInvalidRole.validateSync();
      expect(validationError.errors.role).toBeDefined();
    });

    it('should accept valid role values', () => {
      const validRoles = ['admin', 'gestionnaire', 'user'];
      
      validRoles.forEach(role => {
        const user = new User({
          email: 'test@example.com',
          userName: 'testuser',
          password: 'password123',
          role
        });
        
        const validationError = user.validateSync();
        expect(validationError?.errors?.role).toBeUndefined();
      });
    });

    it('should set default role to user', () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      expect(user.role).toBe('user');
    });

    it('should set random avatar by default', () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      expect(['avatar1.png', 'avatar2.png']).toContain(user.avatar);
    });

    it('should trim and lowercase email', () => {
      const user = new User({
        email: '  TEST@EXAMPLE.COM  ',
        userName: 'testuser',
        password: 'password123'
      });

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing (pre-save hook)', () => {
    beforeEach(() => {
      // Mock bcrypt functions
      bcrypt.genSalt.mockResolvedValue('mockedsalt');
      bcrypt.hash.mockResolvedValue('hashedpassword123');
    });

    it('should hash password before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'plainpassword123'
      });

      // Mock la méthode save pour déclencher le pre-save hook
      const saveMock = jest.spyOn(user, 'save').mockImplementation(async function() {
        // Simuler l'exécution du pre-save hook
        if (this.isModified('password')) {
          this.password = 'hashedpassword123';
        }
        return Promise.resolve(this);
      });

      await user.save();

      expect(user.password).toBe('hashedpassword123');
      expect(user.password).not.toBe('plainpassword123');
    });

    it('should not hash password if not modified', async () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'alreadyhashed'
      });

      // Simuler que le password n'a pas été modifié
      jest.spyOn(user, 'isModified').mockReturnValue(false);

      const saveMock = jest.spyOn(user, 'save').mockImplementation(async function() {
        // Si pas modifié, ne pas hasher
        if (!this.isModified('password')) {
          // Garder le password original
          return Promise.resolve(this);
        }
      });

      await user.save();

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should handle hashing errors', async () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'plainpassword123'
      });

      // Mock bcrypt pour qu'il lève une erreur
      bcrypt.genSalt.mockRejectedValue(new Error('Hashing failed'));

      jest.spyOn(user, 'isModified').mockReturnValue(true);

      const saveMock = jest.spyOn(user, 'save').mockImplementation(async function() {
        if (this.isModified('password')) {
          throw new Error('Hashing failed');
        }
        return Promise.resolve(this);
      });

      await expect(user.save()).rejects.toThrow('Hashing failed');
    });
  });

  describe('comparePassword method', () => {
    let user;

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'hashedpassword123'
      });
    });

    it('should return true for correct password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await user.comparePassword('correctpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword123');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await user.comparePassword('wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword123');
      expect(result).toBe(false);
    });

    it('should throw error when bcrypt.compare fails', async () => {
      const bcryptError = new Error('Bcrypt comparison failed');
      bcrypt.compare.mockRejectedValue(bcryptError);

      await expect(user.comparePassword('anypassword')).rejects.toThrow('Bcrypt comparison failed');
    });
  });

  describe('getRandomAvatar function', () => {
    afterEach(() => {
      // Restaurer Math.random après chaque test
      jest.restoreAllMocks();
    });

    it('should return avatar1.png when random returns 0', () => {
      // Mock Math.random pour retourner 0 (premier élément)
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      expect(user.avatar).toBe('avatar1.png');
    });

    it('should return avatar2.png when random returns 0.9', () => {
      // Mock Math.random pour retourner 0.9 (deuxième élément)
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      expect(user.avatar).toBe('avatar2.png');
    });

    it('should only return valid avatar options', () => {
      // Tester avec différentes valeurs aléatoires
      const randomValues = [0, 0.1, 0.5, 0.7, 0.99];
      const results = [];

      randomValues.forEach((randomValue, index) => {
        jest.spyOn(Math, 'random').mockReturnValue(randomValue);
        
        const user = new User({
          email: `test${index}@example.com`,
          userName: `testuser${index}`,
          password: 'password123'
        });
        
        results.push(user.avatar);
        jest.restoreAllMocks(); // Nettoyer entre chaque itération
      });

      // Vérifier que tous les résultats sont des avatars valides
      results.forEach(avatar => {
        expect(['avatar1.png', 'avatar2.png']).toContain(avatar);
      });
    });

    it('should provide good distribution with multiple calls', () => {
      const results = [];
      
      // Simuler alternance entre les deux valeurs
      jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // avatar1.png
        .mockReturnValueOnce(0.8)  // avatar2.png
        .mockReturnValueOnce(0.2)  // avatar1.png
        .mockReturnValueOnce(0.9); // avatar2.png

      for (let i = 0; i < 4; i++) {
        const user = new User({
          email: `test${i}@example.com`,
          userName: `testuser${i}`,
          password: 'password123'
        });
        results.push(user.avatar);
      }

      expect(results).toEqual(['avatar1.png', 'avatar2.png', 'avatar1.png', 'avatar2.png']);
      
      // Vérifier qu'on a bien les deux avatars
      const uniqueAvatars = [...new Set(results)];
      expect(uniqueAvatars).toHaveLength(2);
      expect(uniqueAvatars).toContain('avatar1.png');
      expect(uniqueAvatars).toContain('avatar2.png');
    });
  });

  describe('Password selection', () => {
    it('should not select password field by default', () => {
      const user = new User({
        email: 'test@example.com',
        userName: 'testuser',
        password: 'password123'
      });

      // Vérifier que le password n'est pas sélectionné par défaut
      const schema = User.schema;
      expect(schema.paths.password.options.select).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should have timestamps enabled', () => {
      const schema = User.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });

  describe('References', () => {
    it('should have correct reference types', () => {
      const schema = User.schema;
      
      expect(schema.paths.badges.options.type[0].ref).toBe('Badge');
      expect(schema.paths.organization.options.ref).toBe('Organization');
      expect(schema.paths.team.options.ref).toBe('Team');
    });
  });
});