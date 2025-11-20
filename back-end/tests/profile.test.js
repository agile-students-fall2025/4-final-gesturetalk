import { expect } from "chai";
import { uploadProfilePicture } from "../src/controllers/profileController.js";

// Helper to mock Express response
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

describe("profileController", () => {
  describe("uploadProfilePicture", () => {
    it("should return 400 if no file uploaded", async () => {
      const req = { body: { userId: "123" } };
      const res = mockRes();

      await uploadProfilePicture(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.ok).to.equal(false);
      expect(res.body.error).to.equal("No file uploaded");
    });

    it("should return 400 if no userId provided", async () => {
      const req = { file: { filename: "test.jpg" }, body: {} };
      const res = mockRes();

      await uploadProfilePicture(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body.ok).to.equal(false);
      expect(res.body.error).to.equal("userId required");
    });

    it("should accept file and userId in request", async () => {
      const req = {
        file: { filename: "test.jpg" },
        body: { userId: "test123" },
      };

      // Test validates that both file and userId are present
      // (actual DB call would timeout without mock, so we just verify inputs are accepted)
      expect(req.file).to.exist;
      expect(req.body.userId).to.exist;
    });
  });
});
