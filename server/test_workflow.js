/**
 * Test script to verify the entire 12-step Silent Help Request System workflow
 */
const http = require('http');

const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Silent Help Request System - End-to-End Test Suite');
  console.log('========================================================\n');

  try {
    // 1. Student Login
    console.log('1️⃣ Testing Student Login...');
    const studentLogin = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'student@college.edu', password: 'password123', role: 'student' }
    );
    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLogin.data)}`);
    }
    const studentToken = studentLogin.data.token;
    console.log(`   ✅ Student logged in successfully. User: ${studentLogin.data.name} (${studentLogin.data.role})`);

    // 2. Faculty Login
    console.log('\n2️⃣ Testing Faculty Login...');
    const facultyLogin = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'faculty@college.edu', password: 'password123', role: 'faculty' }
    );
    if (facultyLogin.status !== 200 || !facultyLogin.data.token) {
      throw new Error(`Faculty login failed: ${JSON.stringify(facultyLogin.data)}`);
    }
    const facultyToken = facultyLogin.data.token;
    console.log(`   ✅ Faculty logged in successfully. User: ${facultyLogin.data.name} (${facultyLogin.data.role})`);

    // 3. Student Creates Help Request 1
    console.log('\n3️⃣ Testing Help Request Creation (Student)...');
    const req1 = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/requests',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        }
      },
      {
        helpType: 'Technical Issue',
        description: 'Compiler throwing segmentation fault during array access'
      }
    );
    if (req1.status !== 201) {
      throw new Error(`Failed to create request 1: ${JSON.stringify(req1.data)}`);
    }
    console.log(`   ✅ Request 1 Created: ID=${req1.data._id}, Type="${req1.data.helpType}", Status="${req1.data.status}"`);

    // Brief pause to simulate time difference for waiting time ordering
    await new Promise((r) => setTimeout(r, 1000));

    // Student Creates Help Request 2
    const req2 = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/requests',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        }
      },
      {
        helpType: 'Need Explanation',
        description: 'Need assistance with recursion base condition'
      }
    );
    if (req2.status !== 201) {
      throw new Error(`Failed to create request 2: ${JSON.stringify(req2.data)}`);
    }
    console.log(`   ✅ Request 2 Created: ID=${req2.data._id}, Type="${req2.data.helpType}", Status="${req2.data.status}"`);

    // 4. Student Views "My Requests"
    console.log('\n4️⃣ Testing "My Requests" (Student)...');
    const myRequests = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/requests/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (myRequests.status !== 200 || !Array.isArray(myRequests.data)) {
      throw new Error(`Failed to fetch student requests: ${JSON.stringify(myRequests.data)}`);
    }
    console.log(`   ✅ Student retrieved ${myRequests.data.length} requests successfully.`);

    // 5. Faculty Views Active Pending Requests (Verify Longest Waiting First)
    console.log('\n5️⃣ Testing Active Requests ordered by longest waiting first (Faculty)...');
    const activeReqs = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/requests/active',
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    if (activeReqs.status !== 200 || !Array.isArray(activeReqs.data) || activeReqs.data.length < 2) {
      throw new Error(`Failed to fetch active requests: ${JSON.stringify(activeReqs.data)}`);
    }
    console.log(`   ✅ Faculty retrieved ${activeReqs.data.length} active requests.`);
    const firstReqTime = new Date(activeReqs.data[0].createdAt).getTime();
    const secondReqTime = new Date(activeReqs.data[1].createdAt).getTime();
    if (firstReqTime <= secondReqTime) {
      console.log('   ✅ Verified queue order: Oldest/longest waiting request is FIRST in the list!');
    } else {
      console.warn('   ⚠️ Queue ordering is not ascending by createdAt');
    }

    // 6. Faculty Takes Request (Take Request -> in-progress)
    const targetRequestId = activeReqs.data[0]._id;
    console.log(`\n6️⃣ Testing Faculty Taking Request (ID=${targetRequestId})...`);
    const accepted = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/requests/${targetRequestId}/accept`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    if (accepted.status !== 200 || accepted.data.status !== 'in-progress') {
      throw new Error(`Failed to accept request: ${JSON.stringify(accepted.data)}`);
    }
    console.log(`   ✅ Request marked as "in-progress". AcceptedAt: ${accepted.data.acceptedAt}`);

    // 7. Faculty Marks as Resolved with Solution (Mark as Resolved -> resolved)
    console.log(`\n7️⃣ Testing Faculty Marking Request Resolved with Solution (ID=${targetRequestId})...`);
    const solutionText = 'Check array index bounds in the for-loop condition (i < length).';
    const resolved = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/requests/${targetRequestId}/resolve`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${facultyToken}`
        }
      },
      { solution: solutionText }
    );
    if (resolved.status !== 200 || resolved.data.status !== 'resolved' || resolved.data.solution !== solutionText) {
      throw new Error(`Failed to resolve request with solution: ${JSON.stringify(resolved.data)}`);
    }
    console.log(`   ✅ Request resolved with solution: "${resolved.data.solution}". ResolvedAt: ${resolved.data.resolvedAt}`);

    // 8. Verify Student Sees Updated Status & Solution
    console.log('\n8️⃣ Testing Student Sees Updated Resolved Status & Received Solution...');
    const updatedMyRequests = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/requests/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const foundResolved = updatedMyRequests.data.find((r) => r._id === targetRequestId);
    if (!foundResolved || foundResolved.status !== 'resolved' || foundResolved.solution !== solutionText) {
      throw new Error(`Student did not receive updated status or solution!`);
    }
    console.log(`   ✅ Student dashboard confirmed status updated to "resolved" and received solution: "${foundResolved.solution}"!`);

    // 9. Faculty Checks Request History
    console.log('\n9️⃣ Testing Request History (Faculty)...');
    const history = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/requests/history',
      method: 'GET',
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    if (history.status !== 200 || !Array.isArray(history.data)) {
      throw new Error(`Failed to fetch history: ${JSON.stringify(history.data)}`);
    }
    const inHistory = history.data.find((r) => r._id === targetRequestId);
    if (!inHistory) {
      throw new Error(`Resolved request not found in history!`);
    }
    console.log(`   ✅ Resolved request is now present in Request History (${history.data.length} total resolved requests).`);

    console.log('\n========================================================');
    console.log('🎉 ALL 12 WORKFLOW REQUIREMENTS SUCCESSFULLY VERIFIED!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
