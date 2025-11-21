const mockTranslationLogs = [
  // Meeting mtg-001
  {
    _id: 1,
    meetingId: "mtg-001",
    senderId: "userA",
    text: "Hello everyone, thanks for joining.",
    timestamp: new Date("2025-03-10T10:00:05Z"),
  },
  {
    _id: 2,
    meetingId: "mtg-001",
    senderId: "userB",
    text: "Good morning!",
    timestamp: new Date("2025-03-10T10:00:12Z"),
  },
  {
    _id: 3,
    meetingId: "mtg-001",
    senderId: "userC",
    text: "Let’s review sprint progress.",
    timestamp: new Date("2025-03-10T10:02:40Z"),
  },

  // Meeting mtg-002
  {
    _id: 4,
    meetingId: "mtg-002",
    senderId: "userD",
    text: "Can you confirm the schedule for next week?",
    timestamp: new Date("2025-03-09T14:20:03Z"),
  },
  {
    _id: 5,
    meetingId: "mtg-002",
    senderId: "userB",
    text: "Yes, we’re available Tuesday.",
    timestamp: new Date("2025-03-09T14:21:20Z"),
  },

  // Meeting mtg-003
  {
    _id: 6,
    meetingId: "mtg-003",
    senderId: "userA",
    text: "Should we increase the gesture recognition priority?",
    timestamp: new Date("2025-03-05T17:12:10Z"),
  },
  {
    _id: 7,
    meetingId: "mtg-003",
    senderId: "userC",
    text: "Yes, it caused delays last sprint.",
    timestamp: new Date("2025-03-05T17:13:02Z"),
  },

  // Meeting mtg-004
  {
    _id: 8,
    meetingId: "mtg-004",
    senderId: "userE",
    text: "Demo starting now.",
    timestamp: new Date("2025-03-01T09:00:10Z"),
  },
  {
    _id: 9,
    meetingId: "mtg-004",
    senderId: "userF",
    text: "Camera looks good.",
    timestamp: new Date("2025-03-01T09:00:22Z"),
  },
  {
    _id: 10,
    meetingId: "mtg-004",
    senderId: "userB",
    text: "I’ll share my screen.",
    timestamp: new Date("2025-03-01T09:05:34Z"),
  },
];

export default mockTranslationLogs;
