import { expect } from "chai";
import { describe } from "mocha";
import * as controller from "../src/controllers/callHistoryController.js";
import { mockCallHistory } from "../src/data/mockCallHistory.js";

describe("Testing Translation Log Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {} };

    res = {
      statusCode: null,
      jsonData: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(data) {
        this.jsonData = data;
      },
    };
  });

  describe("getCallHistory", () => {
    it("fetches user's call history and returns 200", async () => {
      await controller.getCallHistory(req, res);

      // update in sprint 4, mock data for now
      expect(res.statusCode).to.equal(200);
      expect(res.jsonData.ok).to.be.true;
      expect(res.jsonData.meetings).to.deep.equal(mockCallHistory);
    });

    it("returns 500 if encounter unexpeced error", async () => {
      req.forceError = true;
      await controller.getCallHistory(req, res);

      expect(res.statusCode).to.equal(500);
      expect(res.jsonData.ok).to.be.false;
      expect(res.jsonData.error).to.equal("Server error");
    });
  });
});
