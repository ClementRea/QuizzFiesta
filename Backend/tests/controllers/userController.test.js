const { getMe, updateMe } = require("../../controllers/userController");
const User = require("../../models/User");
const userController = require("../../controllers/userController");
const Organisation = require("../../models/Organisation");

describe("UserController (integration)", () => {
  let user;
  let res;
  let next;

  beforeEach(async () => {
    await User.deleteMany({});
    user = await User.create({
      email: "test@example.com",
      userName: "tester",
      password: "password123",
    });
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("getMe", () => {
    it("retourne le user courant", async () => {
      const req = { user: { id: user._id.toString() } };
      await getMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.status).toBe("success");
      expect(payload.data.user.email).toBe("test@example.com");
    });

    it("404 si user inexistant", async () => {
      const req = { user: { id: user._id.toString() } };
      await User.deleteMany({});
      await getMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User not found" }),
      );
    });
  });

  describe("updateMe", () => {
    it("met à jour userName & email", async () => {
      const req = {
        user: { id: user._id.toString() },
        body: { userName: "newname", email: "new@example.com" },
      };
      await updateMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const updated = await User.findById(user._id);
      expect(updated.userName).toBe("newname");
      expect(updated.email).toBe("new@example.com");
    });

    it("change le mot de passe si currentPassword correct", async () => {
      const req = {
        user: { id: user._id.toString() },
        body: {
          currentPassword: "password123",
          newPassword: "newpass456",
          userName: "withpass",
        },
      };
      await updateMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.user.userName).toBe("withpass");
    });

    it("400 si currentPassword incorrect", async () => {
      const req = {
        user: { id: user._id.toString() },
        body: { currentPassword: "wrong", newPassword: "newpass456" },
      };
      await updateMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Le mot de passe actuel est incorrect",
        }),
      );
    });

    it("404 si user inexistant", async () => {
      const req = {
        user: { id: user._id.toString() },
        body: { userName: "ghost" },
      };
      await User.deleteMany({});
      await updateMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getUserById", () => {
    it("refuse accès si simple user consulte autre profil", async () => {
      const other = await User.create({
        email: "o@example.com",
        userName: "other",
        password: "pass1234",
      });
      const req = {
        user: { id: user._id.toString(), role: "user" },
        params: { id: other._id.toString() },
      };
      await userController.getUserById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("404 si user demandé inexistant", async () => {
      const req = {
        user: { id: user._id.toString(), role: "user" },
        params: { id: user._id.toString() },
      };
      await User.deleteMany({});
      await userController.getUserById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("succès si user consulte lui-même", async () => {
      const req = {
        user: { id: user._id.toString(), role: "user" },
        params: { id: user._id.toString() },
      };
      await userController.getUserById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllUsers", () => {
    it("gestionnaire sans organisation => 403", async () => {
      const req = {
        user: {
          id: user._id.toString(),
          role: "gestionnaire",
          organization: undefined,
        },
      };
      await userController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("admin récupère tous les users", async () => {
      const admin = await User.create({
        email: "admin@example.com",
        userName: "admin",
        password: "pass1234",
        role: "admin",
      });
      await User.create({
        email: "u2@example.com",
        userName: "u2",
        password: "pass1234",
      });
      const req = { user: { id: admin._id.toString(), role: "admin" } };
      await userController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(3);
    });

    it("gestionnaire voit seulement utilisateurs de son orga", async () => {
      const org = await Organisation.create({
        name: "OrgA",
        createdBy: user._id,
      });
      const manager = await User.create({
        email: "man@example.com",
        userName: "man",
        password: "pass1234",
        role: "gestionnaire",
        organization: org._id,
      });
      await User.create({
        email: "memberA@example.com",
        userName: "memberA",
        password: "pass1234",
        organization: org._id,
      });

      const otherOrg = await Organisation.create({
        name: "OrgB",
        createdBy: user._id,
      });
      await User.create({
        email: "other@org.com",
        userName: "otherOrg",
        password: "pass1234",
        organization: otherOrg._id,
      });
      const req = {
        user: {
          id: manager._id.toString(),
          role: "gestionnaire",
          organization: org._id,
        },
      };
      await userController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBe(2);
    });
  });

  describe("updateUserRole", () => {
    it("400 rôle invalide", async () => {
      const admin = await User.create({
        email: "a@example.com",
        userName: "a",
        password: "pass1234",
        role: "admin",
      });
      const target = await User.create({
        email: "t@example.com",
        userName: "t",
        password: "pass1234",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: target._id.toString() },
        body: { role: "superhero" },
      };
      await userController.updateUserRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("400 auto-modification rôle interdite", async () => {
      const admin = await User.create({
        email: "aa@example.com",
        userName: "aa",
        password: "pass1234",
        role: "admin",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: admin._id.toString() },
        body: { role: "user" },
      };
      await userController.updateUserRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 si target introuvable", async () => {
      const admin = await User.create({
        email: "adm@example.com",
        userName: "adm",
        password: "pass1234",
        role: "admin",
      });
      const fakeId = user._id.toString();
      await User.deleteMany({ _id: fakeId });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: fakeId },
        body: { role: "user" },
      };
      await userController.updateUserRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("gestionnaire ne peut attribuer admin", async () => {
      const org = await Organisation.create({
        name: "OrgX",
        createdBy: user._id,
      });
      const manager = await User.create({
        email: "mX@example.com",
        userName: "mX",
        password: "pass1234",
        role: "gestionnaire",
        organization: org._id,
      });
      const target = await User.create({
        email: "member@example.com",
        userName: "member",
        password: "pass1234",
        organization: org._id,
      });
      const req = {
        user: {
          id: manager._id.toString(),
          role: "gestionnaire",
          organization: org._id,
        },
        params: { id: target._id.toString() },
        body: { role: "admin" },
      };
      await userController.updateUserRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("admin change rôle avec succès", async () => {
      const admin = await User.create({
        email: "a2@example.com",
        userName: "a2",
        password: "pass1234",
        role: "admin",
      });
      const target = await User.create({
        email: "t2@example.com",
        userName: "t2",
        password: "pass1234",
        role: "user",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: target._id.toString() },
        body: { role: "gestionnaire" },
      };
      await userController.updateUserRole(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const updated = await User.findById(target._id);
      expect(updated.role).toBe("gestionnaire");
    });
  });

  describe("deleteUser", () => {
    it("400 self-delete interdit", async () => {
      const admin = await User.create({
        email: "dself@example.com",
        userName: "dself",
        password: "pass1234",
        role: "admin",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: admin._id.toString() },
      };
      await userController.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 cible introuvable", async () => {
      const admin = await User.create({
        email: "d404@example.com",
        userName: "d404",
        password: "pass1234",
        role: "admin",
      });
      const fakeId = user._id.toString();
      await User.deleteMany({ _id: fakeId });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: fakeId },
      };
      await userController.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("admin supprime un user", async () => {
      const admin = await User.create({
        email: "dadmin@example.com",
        userName: "dadmin",
        password: "pass1234",
        role: "admin",
      });
      const victim = await User.create({
        email: "victim@example.com",
        userName: "victim",
        password: "pass1234",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { id: victim._id.toString() },
      };
      await userController.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ status: "success", data: null });
    });
  });

  describe("getUsersByOrganization", () => {
    it("gestionnaire accès refusé autre orga", async () => {
      const orgA = await Organisation.create({
        name: "OA",
        createdBy: user._id,
      });
      const orgB = await Organisation.create({
        name: "OB",
        createdBy: user._id,
      });
      const manager = await User.create({
        email: "gm@example.com",
        userName: "gm",
        password: "pass1234",
        role: "gestionnaire",
        organization: orgA._id,
      });
      const req = {
        user: {
          id: manager._id.toString(),
          role: "gestionnaire",
          organization: orgA._id,
        },
        params: { organizationId: orgB._id.toString() },
      };
      await userController.getUsersByOrganization(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("admin liste organisation", async () => {
      const org = await Organisation.create({
        name: "ORG",
        createdBy: user._id,
      });
      await User.create({
        email: "m1@org.com",
        userName: "m1",
        password: "pass1234",
        organization: org._id,
      });
      const admin = await User.create({
        email: "adm@org.com",
        userName: "adm",
        password: "pass1234",
        role: "admin",
      });
      const req = {
        user: { id: admin._id.toString(), role: "admin" },
        params: { organizationId: org._id.toString() },
      };
      await userController.getUsersByOrganization(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.results).toBeGreaterThanOrEqual(1);
    });
  });
});
