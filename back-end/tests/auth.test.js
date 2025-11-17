import { expect } from "chai";
import { signUp, signIn } from "../src/controllers/authController.js";

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.body = obj; return res; };
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
});
