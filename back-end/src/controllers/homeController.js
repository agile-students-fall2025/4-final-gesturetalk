
export const createMeeting = (req, res) => {
    const data = {
        meetingName: req.body.meetingName,
        meetingCode: req.body.meetingCode
    }
    console.log(`Name: ${data.meetingName}, Code: ${data.meetingCode}`)

    // TODO: send data to database
    res.send(`Create meeting: ${data.meetingName}`)
}


export const joinMeeting = (req, res) => {
    console.log('reached join meeting')
    const { meetingCode } = req.body;
    console.log(`Code: ${meetingCode}`);

    if (!meetingCode) {
       return res.status(400).json({ ok: false, error: "meetingCode is required" });
    }
    // TODO: validate meeting code exists in DB
    // for now use mock data

    // Mock lookup
    const mockMeetings = {
        "abc123": { meetingId: "room123", meetingName: "Meeting 1", peers: [] },
        "xyz999": { meetingId: "room999", meetingName: "Egg and Cheese Sandwich", peers: [] }
    };
    
    const meetingFromDB = mockMeetings[meetingCode];

    if (!meetingFromDB) {
        return res.status(404).json({
            ok: false,
            error: "Meeting not found"
        });
    }

    return res.status(200).json({
        ok: true,
        ...meetingFromDB
    });
}



