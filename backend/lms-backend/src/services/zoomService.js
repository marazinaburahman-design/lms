const axios = require('axios');

let tokenCache = { accessToken: null, expiresAt: 0 };

function configured() {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

async function getAccessToken() {
  if (!configured()) return null;
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(process.env.ZOOM_ACCOUNT_ID)}`,
    null,
    { headers: { Authorization: `Basic ${basic}` } }
  );

  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + Number(response.data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
}

async function createMeeting({ topic, startTime, durationMinutes = 60 }) {
  if (!configured()) return null;

  const accessToken = await getAccessToken();
  const response = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic,
      type: 2,
      start_time: startTime,
      duration: Number(durationMinutes) || 60,
      timezone: 'Asia/Colombo',
      settings: {
        waiting_room: true,
        join_before_host: false,
        mute_upon_entry: true,
      },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return {
    joinUrl: response.data.join_url,
    meetingId: String(response.data.id),
    passcode: response.data.password || '',
  };
}

module.exports = { configured, createMeeting };
