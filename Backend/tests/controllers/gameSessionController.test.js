const gameSessionController = require("../../controllers/gameSessionController");
const GameSession = require("../../models/GameSession");
const Quiz = require("../../models/Quiz");
const LobbyParticipant = require("../../models/LobbyParticipant");
const GameParticipant = require("../../models/GameParticipant");
const Question = require("../../models/Question");

jest.mock("../../models/GameSession");
jest.mock("../../models/Quiz");
jest.mock("../../models/LobbyParticipant");
jest.mock("../../models/GameParticipant");
jest.mock("../../models/Question");

describe("gameSessionController", () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: "user123", userName: "User", avatar: "avatar.png" },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe("createGameSession", () => {
    it("creates session success", async () => {
      req.params.quizId = "q1";
      Quiz.findById.mockResolvedValue({ _id: "q1", questions: ["a", "b"] });
      const session = {
        _id: "s1",
        sessionCode: "ABC123",
        status: "lobby",
        quiz: {},
        organizer: {},
        settings: {},
        participantCount: 1,
        gameState: {},
        createdAt: new Date(),
        populate: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue(),
      };
      GameSession.createSession = jest.fn().mockResolvedValue(session);
      Question.countDocuments.mockResolvedValue(2);
      await gameSessionController.createGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("404 quiz not found", async () => {
      req.params.quizId = "x";
      Quiz.findById.mockResolvedValue(null);
      await gameSessionController.createGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("500 on internal error", async () => {
      req.params.quizId = "q1";
      Quiz.findById.mockResolvedValue({ _id: "q1", questions: [] });
      GameSession.createSession = jest
        .fn()
        .mockRejectedValue(new Error("fail"));
      await gameSessionController.createGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("joinSessionByCode", () => {
    const baseSession = () => ({
      _id: "s1",
      sessionCode: "CODE",
      status: "lobby",
      quiz: {},
      organizer: {},
      settings: {},
      participantCount: 0,
      gameState: {},
      canJoin: jest.fn().mockReturnValue(true),
      canLateJoin: jest.fn().mockReturnValue(false),
    });
    it("success join", async () => {
      req.params.sessionCode = "CODE";
      GameSession.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(baseSession()),
      });
      LobbyParticipant.findOne.mockResolvedValue(null);
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
    it("404 not found", async () => {
      req.params.sessionCode = "CODE";
      GameSession.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("400 cannot join (finished)", async () => {
      req.params.sessionCode = "CODE";
      const sess = baseSession();
      sess.canJoin.mockReturnValue(false);
      sess.canLateJoin.mockReturnValue(false);
      sess.status = "finished";
      GameSession.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sess),
      });
      LobbyParticipant.findOne.mockResolvedValue(null);
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("400 already participant", async () => {
      req.params.sessionCode = "CODE";
      GameSession.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(baseSession()),
      });
      LobbyParticipant.findOne.mockResolvedValue({ _id: "lp1" });
      await gameSessionController.joinSessionByCode(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("joinSessionLobby", () => {
    it("joins new participant", async () => {
      req.params.sessionId = "s1";
      const session = {
        _id: "s1",
        organizerId: "user123",
        canJoin: jest.fn().mockReturnValue(true),
        updateParticipantCount: jest.fn(),
        quizId: "q1",
        participantCount: 1,
        settings: {},
        status: "lobby",
      };
      GameSession.findById.mockResolvedValue(session);
      LobbyParticipant.findOne.mockResolvedValue(null);
      const save = jest.fn();
      LobbyParticipant.prototype.save = save;
      LobbyParticipant.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            userId: "user123",
            userName: "User",
            avatar: "a",
            isReady: true,
            isOrganizer: true,
            connectionStatus: "connected",
          },
        ]),
      });
      await gameSessionController.joinSessionLobby(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
    it("reconnect existing participant", async () => {
      req.params.sessionId = "s1";
      const participant = {
        connectionStatus: "disconnected",
        lastSeen: null,
        save: jest.fn(),
      };
      GameSession.findById.mockResolvedValue({
        _id: "s1",
        organizerId: "user123",
        canJoin: jest.fn().mockReturnValue(true),
        updateParticipantCount: jest.fn(),
        quizId: "q1",
        participantCount: 1,
        settings: {},
        status: "lobby",
      });
      LobbyParticipant.findOne.mockResolvedValue(participant);
      LobbyParticipant.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });
      await gameSessionController.joinSessionLobby(req, res);
      expect(participant.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
    it("400 cannot join", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue({
        _id: "s1",
        canJoin: jest.fn().mockReturnValue(false),
      });
      await gameSessionController.joinSessionLobby(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("404 not found", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue(null);
      await gameSessionController.joinSessionLobby(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("leaveSessionLobby", () => {
    it("leave and cancel when organizer alone", async () => {
      req.params.sessionId = "s1";
      const session = {
        _id: "s1",
        organizerId: "user123",
        updateParticipantCount: jest.fn(),
        save: jest.fn(),
        status: "lobby",
      };
      GameSession.findById.mockResolvedValue(session);
      LobbyParticipant.deleteOne.mockResolvedValue({ deletedCount: 1 });
      LobbyParticipant.find.mockResolvedValue([]);
      await gameSessionController.leaveSessionLobby(req, res);
      expect(session.status).toBe("cancelled");
      expect(res.json).toHaveBeenCalled();
    });
    it("leave and transfer organizer", async () => {
      req.params.sessionId = "s1";
      const session = {
        _id: "s1",
        organizerId: "user123",
        updateParticipantCount: jest.fn(),
        save: jest.fn(),
        status: "lobby",
      };
      GameSession.findById.mockResolvedValue(session);
      LobbyParticipant.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const newOrg = { userId: "u2", isOrganizer: false, save: jest.fn() };
      LobbyParticipant.find.mockResolvedValue([newOrg]);
      await gameSessionController.leaveSessionLobby(req, res);
      expect(newOrg.isOrganizer).toBe(true);
      expect(session.organizerId).toBe("u2");
    });
    it("404 session missing", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue(null);
      await gameSessionController.leaveSessionLobby(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getSessionParticipants", () => {
    it("success", async () => {
      req.params.sessionId = "s1";
      LobbyParticipant.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ userId: "u1" }]),
      });
      await gameSessionController.getSessionParticipants(req, res);
      expect(res.json).toHaveBeenCalled();
    });
    it("500 error", async () => {
      req.params.sessionId = "s1";
      LobbyParticipant.find.mockImplementation(() => {
        throw new Error("x");
      });
      await gameSessionController.getSessionParticipants(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("setParticipantReady", () => {
    it("success", async () => {
      req.params.sessionId = "s1";
      req.body.isReady = true;
      LobbyParticipant.findOneAndUpdate.mockResolvedValue({ _id: "lp1" });
      await gameSessionController.setParticipantReady(req, res);
      expect(res.json).toHaveBeenCalled();
    });
    it("404 missing", async () => {
      req.params.sessionId = "s1";
      req.body.isReady = true;
      LobbyParticipant.findOneAndUpdate.mockResolvedValue(null);
      await gameSessionController.setParticipantReady(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("500 error", async () => {
      req.params.sessionId = "s1";
      req.body.isReady = true;
      LobbyParticipant.findOneAndUpdate.mockRejectedValue(new Error("fail"));
      await gameSessionController.setParticipantReady(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("startGameSession", () => {
    it("404 not found", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue(null);
      await gameSessionController.startGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("403 not organizer", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue({
        _id: "s1",
        organizerId: "other",
        status: "lobby",
      });
      await gameSessionController.startGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it("400 not enough ready", async () => {
      req.params.sessionId = "s1";
      const session = { _id: "s1", organizerId: "user123", status: "lobby" };
      GameSession.findById.mockResolvedValue(session);
      LobbyParticipant.countDocuments.mockResolvedValue(0);
      await gameSessionController.startGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("success start", async () => {
      req.params.sessionId = "s1";
      const session = {
        _id: "s1",
        organizerId: "user123",
        status: "lobby",
        startGame: jest.fn(),
        gameState: {},
        sessionCode: "C",
        startedAt: new Date(),
      };
      GameSession.findById.mockResolvedValue(session);
      LobbyParticipant.countDocuments.mockResolvedValue(1);
      LobbyParticipant.find.mockResolvedValue([
        { userId: "user123", userName: "User", avatar: "a" },
      ]);
      GameParticipant.deleteMany.mockResolvedValue();
      GameParticipant.insertMany.mockResolvedValue();
      await gameSessionController.startGameSession(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
  });

  describe("getSessionState", () => {
    it("success", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: "s1" }),
      });
      await gameSessionController.getSessionState(req, res);
      expect(res.json).toHaveBeenCalled();
    });
    it("404 missing", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      await gameSessionController.getSessionState(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("endGameSession", () => {
    it("404 missing", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue(null);
      await gameSessionController.endGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("403 not organizer", async () => {
      req.params.sessionId = "s1";
      GameSession.findById.mockResolvedValue({
        _id: "s1",
        organizerId: "other",
      });
      await gameSessionController.endGameSession(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it("success end", async () => {
      req.params.sessionId = "s1";
      const session = {
        _id: "s1",
        organizerId: "user123",
        endSession: jest.fn(),
      };
      GameSession.findById.mockResolvedValue(session);
      GameParticipant.updateMany.mockResolvedValue();
      LobbyParticipant.deleteMany.mockResolvedValue();
      await gameSessionController.endGameSession(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
  });
});
