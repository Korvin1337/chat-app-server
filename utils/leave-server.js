function leaveServer(userID, serverUsers) {
    return serverUsers.filter((user) => user.id != userID);
}

module.exports = leaveServer;