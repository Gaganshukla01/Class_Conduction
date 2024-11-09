import React, { useState } from 'react';

function Example() {
  const [meetingLink, setMeetingLink] = useState('');

  // Generate a Google Meet link for a given meeting name
  const generateMeetingLink = (meetingName) => {
    const baseMeetURL = "https://meet.google.com/";
    const randomCode = Math.random().toString(36).substring(7); // Random string for the meeting code
    const meetLink = baseMeetURL + randomCode;

    return meetLink;
  };

  const handleJoinMeeting = (role) => {
    const meetingLink = generateMeetingLink(role);
    setMeetingLink(meetingLink);
    window.open(meetingLink, "_blank"); // Opens the Google Meet link in a new tab
  };

  return (
    <div className="App">
      <h1>Join Google Meet Class</h1>
      
      <button onClick={() => handleJoinMeeting("student")}>Join as Student</button>
      <button onClick={() => handleJoinMeeting("instructor")}>Join as Instructor</button>

      {meetingLink && (
        <div>
          <p>Meeting Link: <a href={meetingLink} target="_blank" rel="noopener noreferrer">{meetingLink}</a></p>
        </div>
      )}
    </div>
  );
}

export default Example;
