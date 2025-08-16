const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");
require("dotenv").config();

let mongoServer;

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "jest" });
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
