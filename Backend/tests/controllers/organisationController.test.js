const organisationController = require('../../controllers/organisationController');
const Organisation = require('../../models/Organisation');

// Mock models
jest.mock('../../models/Organisation');
jest.mock('../../models/User');
// Properly mock multer and diskStorage for controller compatibility
jest.mock('multer', () => {
  const multerMock = () => ({
    single: () => (req, res, next) => {
      req.file = { filename: 'test-logo.jpg' };
      next();
    }
  });
  multerMock.diskStorage = jest.fn(() => ({}));
  return multerMock;
});

describe('Organisation Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'user123' },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getOrganisations', () => {
    it('devrait récupérer toutes les organisations avec pagination', async () => {
      req.query = { page: '2', limit: '5' };

      const mockOrganisations = [
        { _id: 'org1', name: 'Org 1' },
        { _id: 'org2', name: 'Org 2' }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOrganisations)
      };

      Organisation.find.mockReturnValue(mockQuery);
      Organisation.countDocuments.mockResolvedValue(20);

      await organisationController.getOrganisations(req, res, next);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        total: 20,
        page: 2,
        totalPages: 4,
        data: { organisations: mockOrganisations }
      });
    });
  });

  describe('updateOrganisation', () => {
    it('devrait retourner 403 si l\'utilisateur n\'est pas le propriétaire', async () => {
      req.params.id = 'org123';
      req.body = { name: 'Updated Org' };

      const mockOrganisation = {
        _id: 'org123',
        ownerId: 'otheruser123'
      };

      Organisation.findById.mockResolvedValue(mockOrganisation);

      await organisationController.updateOrganisation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour modifier cette organisation'
      });
    });
  });

  describe('deleteOrganisation', () => {
    it('devrait supprimer une organisation avec succès', async () => {
      req.params.id = 'org123';

      const mockOrganisation = {
        _id: 'org123',
        ownerId: 'user123'
      };

      Organisation.findById.mockResolvedValue(mockOrganisation);
      Organisation.findByIdAndDelete.mockResolvedValue(mockOrganisation);

      await organisationController.deleteOrganisation(req, res, next);

      expect(Organisation.findByIdAndDelete).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Organisation supprimée avec succès'
      });
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas le propriétaire', async () => {
      req.params.id = 'org123';

      const mockOrganisation = {
        _id: 'org123',
        ownerId: 'otheruser123'
      };

      Organisation.findById.mockResolvedValue(mockOrganisation);

      await organisationController.deleteOrganisation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour supprimer cette organisation'
      });
    });

    it('devrait retourner 404 si l\'organisation n\'existe pas', async () => {
      req.params.id = 'nonexistent';

      Organisation.findById.mockResolvedValue(null);

      await organisationController.deleteOrganisation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Organisation non trouvée'
      });
    });
  });
});