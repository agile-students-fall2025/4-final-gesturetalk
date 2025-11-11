
exports.createMeeting = (req, res) => {
    const data = {
        meetName: req.body.meetingName,
        meetCode: req.body.meetingCode
    }
    console.log(`Name: ${data.meetName}, Code: ${data.meetCode}`)

    // TODO: send data to database
    res.send(`Create meeting: ${data.meetName}`)
}

exports.joinMeeting = (req, res) => {
    const data = {
        meetName: req.body.meetingName,
        meetCode: req.body.meetingCode
    }
    console.log(`Code: ${data.meetCode}`)

    // TODO: validate meeting code exists in DB
    // for now use mock data

    // Mock lookup
    const mockMeetings = {
        "abc123": { meetingId: "room123", meetingName: "Design Sync" },
        "xyz999": { meetingId: "room999", meetingName: "Daily Standup" }
    };
    
    const meetingFromDB = mockMeetings[meetCode];

    if (!meetingFromDB) {
        return res.status(404).json({
            ok: false,
            error: "Meeting not found"
        });
    }

    res.send(`Join meeting with code: ${data.meetCode}`)

    return res.json({
        ok: true,
        ...meetingFromDB
    });
}


