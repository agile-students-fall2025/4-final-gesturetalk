const mockCallHistory = [
  {
    _id: 1,
    meetingId: "mtg-001",
    meetingName: "Project Sync",
    participants: ["userA", "userB", "userC"],
    startTime: new Date("2025-03-10T10:00:00Z"),
    endTime: new Date("2025-03-10T10:45:00Z"),
    duration: 45, // in minutes
    createdBy: "userA",
  },
  {
    _id: 2,
    meetingId: "mtg-002",
    meetingName: "Interpreted Chat with Client",
    participants: ["userB", "userD"],
    startTime: new Date("2025-03-09T14:15:00Z"),
    endTime: new Date("2025-03-09T14:50:00Z"),
    duration: 35,
    createdBy: "userD",
  },
  {
    _id: 3,
    meetingId: "mtg-003",
    meetingName: "Sprint Planning",
    participants: ["userA", "userC"],
    startTime: new Date("2025-03-05T17:00:00Z"),
    endTime: new Date("2025-03-05T18:12:00Z"),
    duration: 72,
    createdBy: "userC",
  },
  {
    _id: 4,
    meetingId: "mtg-004",
    meetingName: "Shuwa Demo Call",
    participants: ["userA", "userE", "userF", "userB"],
    startTime: new Date("2025-03-01T09:00:00Z"),
    endTime: new Date("2025-03-01T09:30:00Z"),
    duration: 30,
    createdBy: "userA",
  },
];

export default mockCallHistory;
