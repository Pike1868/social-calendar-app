"use strict";

const https = require("https");
const { EventEmitter } = require("events");
const { queryFreeBusy, fetchFreeBusyForUser } = require("../../services/googleFreeBusy");

// Mock https.request
jest.mock("https");

// Mock encrypt and User.update for token refresh path
jest.mock("../../helpers/cryptoHelper", () => ({
  encrypt: jest.fn((text) => `encrypted_${text}`),
  decrypt: jest.fn((text) => text),
}));

jest.mock("../../models/user", () => ({
  update: jest.fn(),
  findById: jest.fn(),
}));

function createMockResponse(statusCode, body) {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  process.nextTick(() => {
    res.emit("data", JSON.stringify(body));
    res.emit("end");
  });
  return res;
}

function createMockRequest() {
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn();
  return req;
}

describe("queryFreeBusy", () => {
  test("returns busy blocks from Google API", async () => {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse(200, {
      calendars: {
        primary: {
          busy: [
            { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
            { start: "2026-03-10T14:00:00Z", end: "2026-03-10T15:00:00Z" },
          ],
        },
      },
    });

    https.request.mockImplementation((opts, cb) => {
      cb(mockRes);
      return mockReq;
    });

    const result = await queryFreeBusy(
      "test-token",
      "2026-03-10T00:00:00Z",
      "2026-03-10T23:59:59Z",
      "UTC"
    );

    expect(result).toEqual([
      { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
      { start: "2026-03-10T14:00:00Z", end: "2026-03-10T15:00:00Z" },
    ]);
  });

  test("returns empty array when no busy blocks", async () => {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse(200, {
      calendars: {
        primary: { busy: [] },
      },
    });

    https.request.mockImplementation((opts, cb) => {
      cb(mockRes);
      return mockReq;
    });

    const result = await queryFreeBusy(
      "test-token",
      "2026-03-10T00:00:00Z",
      "2026-03-10T23:59:59Z"
    );

    expect(result).toEqual([]);
  });

  test("throws TOKEN_EXPIRED on 401", async () => {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse(401, {
      error: { message: "Invalid Credentials" },
    });

    https.request.mockImplementation((opts, cb) => {
      cb(mockRes);
      return mockReq;
    });

    await expect(
      queryFreeBusy("expired-token", "2026-03-10T00:00:00Z", "2026-03-10T23:59:59Z")
    ).rejects.toThrow("Token expired");
  });

  test("throws on other API errors", async () => {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse(403, {
      error: { message: "Forbidden" },
    });

    https.request.mockImplementation((opts, cb) => {
      cb(mockRes);
      return mockReq;
    });

    await expect(
      queryFreeBusy("test-token", "2026-03-10T00:00:00Z", "2026-03-10T23:59:59Z")
    ).rejects.toThrow("Forbidden");
  });

  test("only returns start/end fields, never event details", async () => {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse(200, {
      calendars: {
        primary: {
          busy: [
            {
              start: "2026-03-10T09:00:00Z",
              end: "2026-03-10T10:00:00Z",
              summary: "SHOULD NOT APPEAR",
              description: "SECRET MEETING",
            },
          ],
        },
      },
    });

    https.request.mockImplementation((opts, cb) => {
      cb(mockRes);
      return mockReq;
    });

    const result = await queryFreeBusy(
      "test-token",
      "2026-03-10T00:00:00Z",
      "2026-03-10T23:59:59Z"
    );

    expect(result).toEqual([
      { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
    ]);
    // Ensure no extra fields leak
    expect(result[0]).not.toHaveProperty("summary");
    expect(result[0]).not.toHaveProperty("description");
  });
});

describe("fetchFreeBusyForUser", () => {
  test("retries with refreshed token on TOKEN_EXPIRED", async () => {
    const User = require("../../models/user");
    const { encrypt } = require("../../helpers/cryptoHelper");

    let callCount = 0;
    const mockReq = createMockRequest();

    https.request.mockImplementation((opts, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: 401 expired
        cb(createMockResponse(401, { error: { message: "Invalid Credentials" } }));
      } else if (callCount === 2) {
        // Token refresh call
        cb(createMockResponse(200, { access_token: "new-token-123" }));
      } else {
        // Retry FreeBusy call with new token
        cb(createMockResponse(200, {
          calendars: {
            primary: {
              busy: [{ start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" }],
            },
          },
        }));
      }
      return mockReq;
    });

    const userData = {
      id: "test-user",
      access_token: "old-token",
      refresh_token: "refresh-token",
    };

    const result = await fetchFreeBusyForUser(
      userData,
      "2026-03-10T00:00:00Z",
      "2026-03-10T23:59:59Z",
      "UTC"
    );

    expect(result).toEqual([
      { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
    ]);
    expect(User.update).toHaveBeenCalledWith("test-user", {
      access_token: "encrypted_new-token-123",
    });
  });
});
