const mongoose = require('mongoose');
const { getUsers, getRequests } = require('./storage');

/**
 * Automatically synchronizes any offline/locally stored users and requests
 * from server/data/*.json into MongoDB Atlas once the connection is established.
 */
async function syncLocalDataToMongo() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const requestsCol = db.collection('helprequests');

    const localUsers = getUsers();
    const localRequests = getRequests();

    let usersSynced = 0;
    for (const u of localUsers) {
      let id;
      try {
        id = new mongoose.Types.ObjectId(u._id);
      } catch (e) {
        id = new mongoose.Types.ObjectId();
      }

      const exists = await usersCol.findOne({
        $or: [{ _id: id }, { email: u.email }]
      });

      if (!exists) {
        await usersCol.insertOne({
          _id: id,
          name: u.name,
          email: u.email,
          password: u.passwordHash,
          role: u.role,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: new Date()
        });
        usersSynced++;
      }
    }

    let requestsSynced = 0;
    for (const r of localRequests) {
      let id;
      try {
        id = new mongoose.Types.ObjectId(r._id);
      } catch (e) {
        id = new mongoose.Types.ObjectId();
      }

      let studentId;
      try {
        studentId = new mongoose.Types.ObjectId(r.studentId);
      } catch (e) {
        studentId = new mongoose.Types.ObjectId();
      }

      const exists = await requestsCol.findOne({ _id: id });

      if (!exists) {
        await requestsCol.insertOne({
          _id: id,
          studentId,
          studentName: r.studentName,
          helpType: r.helpType,
          description: r.description || '',
          status: r.status || 'waiting',
          solution: r.solution || '',
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : null,
          resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : null,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
        });
        requestsSynced++;
      } else {
        await requestsCol.updateOne(
          { _id: id },
          {
            $set: {
              status: r.status,
              solution: r.solution || '',
              acceptedAt: r.acceptedAt ? new Date(r.acceptedAt) : exists.acceptedAt,
              resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : exists.resolvedAt
            }
          }
        );
      }
    }

    if (usersSynced > 0 || requestsSynced > 0) {
      console.log(`🔄 Auto-Sync: Successfully synchronized ${usersSynced} user(s) and ${requestsSynced} request(s) into MongoDB Atlas!`);
    }
  } catch (err) {
    console.warn('⚠️ Auto-Sync warning:', err.message);
  }
}

module.exports = { syncLocalDataToMongo };
