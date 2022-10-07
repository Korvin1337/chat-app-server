let axios = require("axios");

function getMessages(room) {
  const dbUrl = process.env.HARPER_URL;
  const dbPw = process.env.HARPER_PW;
  if (!dbUrl || !dbPw) return null;

  let data = JSON.stringify({
    operation: "sql",
    sql: `SELECT * FROM realtime_chat_app.messages WHERE room = '${room}' ORDER BY __createdtime__ DESC LIMIT 20`,
  });

  let config = {
    method: "post",
    url: dbUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: dbPw,
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        resolve(JSON.stringify(response.data));
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

module.exports = getMessages;
