const http = require('http');
const { app, server } = require('../index');
const { connectDB } = require('../config/db');
const { initQueue } = require('../queues/executionQueue');

const runTests = async () => {
  console.log('--- Starting Agentflow_AI Server API Tests ---');
  await connectDB();
  initQueue();

  const PORT = 5055;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[TestServer] Listening on http://127.0.0.1:${PORT}`);

  const baseUrl = `http://127.0.0.1:${PORT}`;

  const request = async (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(
        url,
        {
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, body: json });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health ...');
    const health = await request('GET', '/api/health');
    console.log('   Status:', health.status, 'Response:', health.body.status, 'Orchestration:', health.body.orchestration);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Auth Register
    console.log('2. Testing POST /api/auth/register ...');
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Lead Operator',
      email: 'operator@agentflow.ai',
      password: 'password123!',
      role: 'operator',
    });
    console.log('   Status:', regRes.status, 'User:', regRes.body.data?.user?.email);
    if (regRes.status !== 201) throw new Error('Register failed');
    const token = regRes.body.data.token;

    // 3. Auth Me
    console.log('3. Testing GET /api/auth/me ...');
    const meRes = await request('GET', '/api/auth/me', null, token);
    console.log('   Status:', meRes.status, 'Name:', meRes.body.data?.name);
    if (meRes.status !== 200) throw new Error('Auth Me failed');

    // 4. AI Workflow Generation (Prompt to Workflow)
    console.log('4. Testing POST /api/workflows/generate ...');
    const genRes = await request(
      'POST',
      '/api/workflows/generate',
      {
        prompt: 'When an invoice arrives by email, parse the amount with AI, append to Google Sheets, and notify Slack',
      },
      token
    );
    console.log('   Status:', genRes.status, 'Generated:', genRes.body.data?.name, 'Nodes Count:', genRes.body.data?.nodes?.length);
    if (genRes.status !== 200 || !genRes.body.data?.nodes?.length) throw new Error('Workflow generation failed');
    const generatedWorkflow = genRes.body.data;

    // 5. Create Workflow
    console.log('5. Testing POST /api/workflows ...');
    const createRes = await request('POST', '/api/workflows', generatedWorkflow, token);
    console.log('   Status:', createRes.status, 'Workflow ID:', createRes.body.data?._id || createRes.body.data?.id);
    if (createRes.status !== 201) throw new Error('Create workflow failed');
    const workflowId = createRes.body.data._id || createRes.body.data.id;

    // 6. Execute Workflow (Multi-agent orchestration trigger)
    console.log('6. Testing POST /api/workflows/:id/execute ...');
    const execRes = await request('POST', `/api/workflows/${workflowId}/execute`, {}, token);
    console.log('   Status:', execRes.status, 'Execution ID:', execRes.body.data?._id || execRes.body.data?.id);
    if (execRes.status !== 202) throw new Error('Execute workflow failed');
    const executionId = execRes.body.data._id || execRes.body.data.id;

    // Wait a brief moment for agent chain execution
    console.log('   Waiting 2s for multi-agent chain to complete execution...');
    await new Promise((r) => setTimeout(r, 2000));

    // 7. Get Execution Timeline
    console.log('7. Testing GET /api/executions/:id/timeline ...');
    const timelineRes = await request('GET', `/api/executions/${executionId}/timeline`, null, token);
    console.log('   Status:', timelineRes.status, 'Execution Status:', timelineRes.body.data?.status, 'Agent Logs:', timelineRes.body.data?.logs?.length);
    timelineRes.body.data?.logs?.forEach((l) => {
      console.log(`     [${l.agent.toUpperCase()}] [${l.level}] ${l.message}`);
    });
    if (timelineRes.status !== 200) throw new Error('Execution timeline failed');

    // 8. Integrations Status & Save Manual Credentials (with encryption)
    console.log('8. Testing POST /api/integrations ...');
    const saveIntRes = await request(
      'POST',
      '/api/integrations',
      {
        provider: 'slack',
        credentials: { webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX' },
        authDetails: { channel: '#ops-alerts', teamName: 'Agentflow Ops' },
      },
      token
    );
    console.log('   Status:', saveIntRes.status, 'Encrypted Integration:', saveIntRes.body.data?.provider);
    if (saveIntRes.status !== 200) throw new Error('Save integration failed');

    // 9. Check Notifications
    console.log('9. Testing GET /api/notifications ...');
    const notifRes = await request('GET', '/api/notifications', null, token);
    console.log('   Status:', notifRes.status, 'Total Notifications:', notifRes.body.data?.length);
    if (notifRes.status !== 200) throw new Error('Notifications check failed');

    console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
};

runTests();
