jest.mock('multer', () => {
  const fn = () => ({ single: () => (req, res, cb) => cb(null) });
  fn.diskStorage = () => ({});
  return fn;
});
jest.mock('../../middlewares/imageCompressionMiddleware', () => ({ compressImage: (req, res, next) => next() }));

const organisationController = require('../../controllers/organisationController');
const Organisation = require('../../models/Organisation');
const User = require('../../models/User');

describe('organisationController (integration)', () => {
  let owner;
  let res;
  let next;

  beforeEach(async () => {
    await Organisation.deleteMany({});
    await User.deleteMany({});
    owner = await User.create({ email: 'owner@example.com', userName: 'owner', password: 'pass1234' });
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  describe('getOrganisations', () => {
    it('liste paginée', async () => {
      await Organisation.create({ name: 'Org1', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      await Organisation.create({ name: 'Org2', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { query: { page: '1', limit: '1' } };
      await organisationController.getOrganisations(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(1);
      expect(payload.total).toBe(2);
    });
  });

  describe('getOrganisationById', () => {
    it('404 si absent', async () => {
      const req = { params: { id: owner._id.toString() } };
      await organisationController.getOrganisationById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('retourne organisation', async () => {
      const org = await Organisation.create({ name: 'Org', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() } };
      await organisationController.getOrganisationById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getMyOrganisations', () => {
    it('retourne created et member', async () => {
      const other = await User.create({ email: 'other@example.com', userName: 'other', password: 'pass1234' });
      await Organisation.create({ name: 'Mine', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      await Organisation.create({ name: 'OtherOwned', createdBy: other._id, ownerId: other._id, members: [other._id, owner._id] });
      const req = { user: { _id: owner._id } };
      await organisationController.getMyOrganisations(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.totalCreated).toBe(1);
      expect(payload.data.totalMember).toBe(1);
    });
  });

  describe('addMembersToOrganisation', () => {
    it('ajoute membres', async () => {
      const newUser = await User.create({ email: 'u1@example.com', userName: 'u1', password: 'pass1234' });
      const org = await Organisation.create({ name: 'OrgAdd', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() }, body: { memberIds: [newUser._id.toString()] }, user: { _id: owner._id } };
      await organisationController.addMembersToOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const updated = await Organisation.findById(org._id);
      expect(updated.members.length).toBe(2);
    });
    it('refus non propriétaire', async () => {
      const other = await User.create({ email: 'o2@example.com', userName: 'o2', password: 'pass1234' });
      const victim = await User.create({ email: 'v@example.com', userName: 'v', password: 'pass1234' });
      const org = await Organisation.create({ name: 'OrgNo', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() }, body: { memberIds: [victim._id.toString()] }, user: { _id: other._id } };
      await organisationController.addMembersToOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('removeMembersFromOrganisation', () => {
    it('retire membre', async () => {
      const m = await User.create({ email: 'rm@example.com', userName: 'rm', password: 'pass1234' });
      const org = await Organisation.create({ name: 'OrgRem', createdBy: owner._id, ownerId: owner._id, members: [owner._id, m._id] });
      const req = { params: { id: org._id.toString() }, body: { memberIds: [m._id.toString()] }, user: { _id: owner._id } };
      await organisationController.removeMembersFromOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const updated = await Organisation.findById(org._id);
      expect(updated.members.length).toBe(1);
    });
    it('interdit retrait propriétaire', async () => {
      const org = await Organisation.create({ name: 'OrgOwner', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() }, body: { memberIds: [owner._id.toString()] }, user: { _id: owner._id } };
      await organisationController.removeMembersFromOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteOrganisation', () => {
    it('suppression propriétaire', async () => {
      const org = await Organisation.create({ name: 'Del', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() }, user: { _id: owner._id } };
      await organisationController.deleteOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('403 non propriétaire', async () => {
      const other = await User.create({ email: 'oth@example.com', userName: 'oth', password: 'pass1234' });
      const org = await Organisation.create({ name: 'DelNo', createdBy: owner._id, ownerId: owner._id, members: [owner._id] });
      const req = { params: { id: org._id.toString() }, user: { _id: other._id } };
      await organisationController.deleteOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('404 introuvable', async () => {
      const req = { params: { id: owner._id.toString() }, user: { _id: owner._id } };
      await organisationController.deleteOrganisation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});