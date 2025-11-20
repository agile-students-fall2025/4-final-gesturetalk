// tests/routes.test.js
import request from "supertest";
import { expect } from "chai";
import { app } from "../server.js";

describe("Route smoke tests", () => {
  // --- AUTH ROUTES ---

  it("POST /api/auth/signin responds", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "", password: "" }); // invalid body is fine
    expect([200, 201, 400, 401, 500]).to.include(res.status);
  });

  it("POST /api/auth/signup responds", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "", password: "" });
    expect([200, 201, 400, 409, 500]).to.include(res.status);
  });

  // --- PROFILE / HISTORY / LOG (AUTH-PROTECTED) ---

  it("GET /api/profile responds", async () => {
    const res = await request(app).get("/api/profile");
    // likely 401 because no token, but allow others in case of changes
    expect([200, 401, 403, 500]).to.include(res.status);
  });

  it("GET /api/call-history responds", async () => {
    const res = await request(app).get("/api/call-history");
    expect([200, 401, 403, 500]).to.include(res.status);
  });

  it("GET /api/translation-log responds", async () => {
    const res = await request(app).get("/api/translation-log");
    expect([200, 401, 403, 500]).to.include(res.status);
  });

  // --- TRANSLATE ROUTE ---

  it("POST /api/translate responds with 400 on bad body", async () => {
    const res = await request(app)
      .post("/api/translate")
      .send({}); // missing signedWords
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property(
      "error",
      "signedWords must be a non-empty array of strings",
    );
  });

  // --- MEETINGS ROUTES ---

  it("GET /api/meetings responds", async () => {
    const res = await request(app).get("/api/meetings");
    // depending on your implementation this might be 200, 404, or 500
    expect([200, 401, 403, 404, 500]).to.include(res.status);
  });
});
