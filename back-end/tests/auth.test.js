import { expect } from "chai";
import { signUp, signIn } from "../src/controllers/authController.js";

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  return res;
}

describe("authController coverage", () => {
  it("signUp 400 on missing fields", async () => {
    const req = { body: { email: "", password: "" } };
    const res = mockRes();
    await signUp(req, res);
    expect(res.statusCode).to.equal(400);
  });

  it("signIn 400 on missing fields", async () => {
    const req = { body: { email: "", password: "" } };
    const res = mockRes();
    await signIn(req, res);
    expect(res.statusCode).to.equal(400);
  });

  it("signUp 400 when password is missing but email is present", async () => {
    const req = { body: { email: "user@example.com", password: "" } };
    const res = mockRes();
    await signUp(req, res);
    expect(res.statusCode).to.equal(400);
  });

  // signIn validation tests
  it("signIn 400 on missing fields", async () => {
    const req = { body: { email: "", password: "" } };
    const res = mockRes();
    await signIn(req, res);
    expect(res.statusCode).to.equal(400);
  });

  it("signIn 400 when email is missing but password is present", async () => {
    const req = { body: { email: "", password: "secret123" } };
    const res = mockRes();
    await signIn(req, res);
    expect(res.statusCode).to.equal(400);
  });

  it("signIn 400 when password is missing but email is present", async () => {
    const req = { body: { email: "user@example.com", password: "" } };
    const res = mockRes();
    await signIn(req, res);
    expect(res.statusCode).to.equal(400);
  });
});
