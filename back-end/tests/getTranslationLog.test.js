import { expect } from "chai";
import * as controller from "../src/controllers/translationLogController.js";
import { mockTranslationLogs } from "../src/data/mockTranslationLogs.js";
import { mockCallHistory } from "../src/data/mockCallHistory.js";
import { describe } from "mocha";

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
            }
        };
    });

    describe("getTranslationLog", () => {
        it("returns 404 if meeting name not found in call history", async () => {

            // set req.params to an id that doesn't exist
            req.params = { id: "does-not-exist" };

            await controller.getTranslationLog(req, res);

            expect(res.statusCode).to.equal(404);
            expect(res.jsonData.ok).to.be.false;
            expect(res.jsonData.error).to.equal("Meeting not found");
            
        });

        it("fetch user's translation logs and return 200", async () => {
            const meeting = mockCallHistory[0];
            req.params = { meetingId: meeting.meetingId };

            await controller.getTranslationLog(req, res);

            expect(res.statusCode).to.equal(200);
            expect(res.jsonData.ok).to.be.true;
            expect(res.jsonData.meetingName).to.deep.equal(meeting.meetingName);
            expect(res.jsonData.translationLogs).to.deep.equal(mockTranslationLogs);

        });

        it("returns 500 if encounter unexpeced error", async () => {
        
            req.forceError = true;
            await controller.getTranslationLog(req, res);

            expect(res.statusCode).to.equal(500);
            expect(res.jsonData.ok).to.be.false;
            expect(res.jsonData.error).to.equal("Server error");

        });

    });

});