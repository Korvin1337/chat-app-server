var axios = require('axios')

function saveMessage(message, username, room) {
    const dbUrl = process.env.HARPER_URL
    const dbPw = process.env.HARPER_PW
    if (!dbUrl || !dbPw) return null

    var data = JSON.stringify({
        operation: 'insert',
        schema: 'realtime_chat_app',
        table: 'messages',
        records: [
            {
                message,
                username,
                room,
            },
        ]
    })

    let config = {
        method: 'post',
        url: dbUrl,
        headers: {
            'Content-Type': 'application/json',
            Authorization: dbPw,
        },
        data: data,
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                resolve(JSON.stringify(response.data))
            })
            .catch(function (error) {
                reject(error)
            })
    })
}

module.exports = saveMessage