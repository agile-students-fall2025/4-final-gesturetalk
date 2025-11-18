import { expect } from "chai"
import * as controller from "../src/controllers/meetingController.js";
import MeetingRoom from "../src/models/MeetingRoom.js";

describe("Testing meeting controller for join and create", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };

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

  // cleanup mock
  afterEach(() => {
    delete MeetingRoom.findOne;
    delete MeetingRoom.create;
  });

  describe("createMeetingRoom", () => {
    it("returns 400 if missing meetingName or meetingCode", async () => {
      req.body = {};

      await controller.createMeetingRoom(req, res);

      expect(res.statusCode).to.equal(400);
      expect(res.jsonData.ok).to.be.false;
    });

    it("returns 409 if meeting code already exist", async () => {
      req.body = { meetingName: "Test", meetingCode: "ABC" };

      MeetingRoom.findOne = async () => ({ meetingCode: "ABC" });
      await controller.createMeetingRoom(req, res);

      expect(res.statusCode).to.equal(409);
      expect(res.jsonData.error).to.equal("Meeting code already exists");
    });

   it("creates meeting and returns 201", async () => {
    req.body = { meetingName: "Test", meetingCode: "DEF" };

    MeetingRoom.findOne = async (query) => {
        if (query.meetingCode === "DEF") return null; 
        return null;
    };

    MeetingRoom.create = async (data) => ({
        ...data
    });


    const res = {
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

    await controller.createMeetingRoom(req, res);

    expect(res.statusCode).to.equal(201);
    expect(res.jsonData.ok).to.be.true;
    expect(res.jsonData.meeting.meetingCode).to.equal("DEF");
    });

  });

  describe("joinMeetingRoom", () => {
    it("returns 404 if meeting does not exist", async () => {
      req.params = { meetingCode: "ABC" };

      MeetingRoom.findOne = async () => null;
      await controller.joinMeetingRoom(req, res);

      expect(res.statusCode).to.equal(404);
      expect(res.jsonData.error).to.equal("Meeting not found");
    });

    it("returns 200 if meeting exists", async () => {
      req.params = { meetingCode: "ABC" };

      MeetingRoom.findOne = async () => ({ meetingCode: "ABC" });
      await controller.joinMeetingRoom(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.jsonData.ok).to.be.true;
      expect(res.jsonData.meeting.meetingCode).to.equal("ABC");
    });
  });
});