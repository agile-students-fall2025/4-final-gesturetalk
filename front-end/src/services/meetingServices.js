const baseURL = "http://localhost:5000/api/meeting";

// send post req to server to create meeting
export const createMeeting = async (meetingName, meetingCode) => {
    const res = await fetch(`${baseURL}/${meetingCode}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            meetingName,
            meetingCode,
        }),
    });

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
};

// send post req to server to see if meeting exists in DB
// if yes server returns "ok: true"
export const joinMeeting = async (meetingCode) => {
  const res = await fetch("http://localhost:5000/api/meeting/join-meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingCode }), // must match req.body
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

