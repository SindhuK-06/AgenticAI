const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OPENROUTER_API_KEY, GEMINI_API_KEY } = require('../config/env');

class AIService {
  /**
   * Generates a visual workflow graph from a natural language prompt
   */
  async generateWorkflow(prompt, options = {}) {
    console.log(`[AIService] Generating workflow for prompt: "${prompt}"`);

    // 1. Try OpenRouter if API key is provided
    if (OPENROUTER_API_KEY) {
      try {
        const result = await this.generateWithOpenRouter(prompt, options);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generator = 'openrouter';
          return result;
        }
      } catch (err) {
        console.warn('[AIService] OpenRouter generation failed, trying fallback:', err.message);
      }
    }

    // 2. Try Google Gemini if API key is provided
    if (GEMINI_API_KEY) {
      try {
        const result = await this.generateWithGemini(prompt, options);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generator = 'gemini';
          return result;
        }
      } catch (err) {
        console.warn('[AIService] Gemini generation failed, falling back to deterministic builder:', err.message);
      }
    }

    // 3. High quality deterministic rule-based builder
    const deterministicResult = this.generateDeterministicWorkflow(prompt);
    deterministicResult.generator = 'deterministic-rules';
    return deterministicResult;
  }

  async generateWithOpenRouter(prompt, options = {}) {
    const systemPrompt = `You are an AI Workflow Architect for Agentflow_AI. Convert user requirements into executable visual workflow graphs.
Return ONLY valid JSON matching this schema:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "triggerConfig": { "type": "manual|webhook|schedule", "config": {} },
  "tags": ["tag1", "tag2"],
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger|agent|integration|condition",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Node Label",
        "nodeType": "trigger_webhook|trigger_manual|agent_llm|agent_classifier|agent_summarizer|integration_gmail|integration_slack|integration_discord|integration_sheets|condition_check",
        "icon": "Zap|Bot|Mail|MessageSquare|MessageCircle|Table|GitBranch",
        "config": {
          "action": "send_email|send_message|send_webhook|append_row|classify|summarize|evaluate",
          "provider": "gmail|slack|discord|google-sheets|openai|gemini",
          "params": {}
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e_node_1_node_2",
      "source": "node_1",
      "target": "node_2",
      "animated": true,
      "type": "smoothstep"
    }
  ]
}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: options.model || 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a complete workflow for: ${prompt}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://agentflow.ai',
          'X-Title': 'Agentflow AI',
        },
        timeout: 25000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    return JSON.parse(content);
  }

  async generateWithGemini(prompt, options = {}) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are an AI Workflow Architect. Convert the user prompt into a valid JSON workflow object with name, description, tags, triggerConfig, nodes (with id, type, position {x,y}, data {label, nodeType, icon, config {provider, action, params}}), and edges (with id, source, target, animated: true, type: 'smoothstep'). Output raw JSON only.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser Prompt: ${prompt}`);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * High quality deterministic rule-based builder covering standard and complex enterprise automation patterns
   */
  generateDeterministicWorkflow(prompt) {
    const p = prompt.toLowerCase();

    // 1. Invoice processing & Sheet append pattern
    if (p.includes('invoice') || p.includes('receipt') || p.includes('expense') || (p.includes('sheet') && p.includes('email'))) {
      return {
        name: 'Automated Invoice & Spreadsheet Sync',
        description: 'Extracts invoice details from incoming emails via AI agent and appends data to Google Sheets with Slack confirmation.',
        triggerConfig: { type: 'webhook', config: { endpoint: '/api/v1/webhooks/invoices' } },
        tags: ['Finance', 'Invoices', 'AI Extraction', 'Google Sheets'],
        nodes: [
          {
            id: 'node_trigger',
            type: 'triggerNode',
            position: { x: 100, y: 200 },
            data: {
              label: 'New Invoice Received',
              nodeType: 'trigger_webhook',
              icon: 'Zap',
              config: { provider: 'webhook', event: 'invoice_received' },
            },
          },
          {
            id: 'node_ai_extractor',
            type: 'agentNode',
            position: { x: 400, y: 200 },
            data: {
              label: 'AI Data Extractor Agent',
              nodeType: 'agent_llm',
              icon: 'Bot',
              config: {
                provider: 'openrouter',
                action: 'extract_fields',
                params: {
                  prompt: 'Extract vendor, amount, invoice_number, due_date, and line_items as JSON from input text.',
                  outputFormat: 'json',
                },
              },
            },
          },
          {
            id: 'node_sheets',
            type: 'integrationNode',
            position: { x: 720, y: 200 },
            data: {
              label: 'Append to Google Sheets',
              nodeType: 'integration_sheets',
              icon: 'Table',
              config: {
                provider: 'google-sheets',
                action: 'append_row',
                params: {
                  spreadsheetId: 'FINANCE_INVOICE_LEDGER_2026',
                  range: 'Invoices!A:F',
                  values: ['{{invoice_number}}', '{{vendor}}', '{{amount}}', '{{due_date}}', 'PENDING_APPROVAL'],
                },
              },
            },
          },
          {
            id: 'node_slack_alert',
            type: 'integrationNode',
            position: { x: 1040, y: 200 },
            data: {
              label: 'Notify Finance Channel',
              nodeType: 'integration_slack',
              icon: 'MessageSquare',
              config: {
                provider: 'slack',
                action: 'send_message',
                params: {
                  channel: '#finance-ops',
                  text: '📄 *New Invoice Logged*: {{vendor}} for ${{amount}} (Inv #{{invoice_number}}). Added to Google Sheets.',
                },
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_ai_extractor', animated: true, type: 'smoothstep' },
          { id: 'e2', source: 'node_ai_extractor', target: 'node_sheets', animated: true, type: 'smoothstep' },
          { id: 'e3', source: 'node_sheets', target: 'node_slack_alert', animated: true, type: 'smoothstep' },
        ],
      };
    }

    // 2. Incident escalation / Error alerting (Slack / Discord)
    if (p.includes('incident') || p.includes('error') || p.includes('alert') || p.includes('discord') || (p.includes('slack') && !p.includes('customer'))) {
      return {
        name: 'Incident AI Classifier & Multi-Channel Escalation',
        description: 'Classifies incident severity using AI and dispatches urgent alerts to Discord, Slack, and email based on triage score.',
        triggerConfig: { type: 'webhook', config: { endpoint: '/api/v1/webhooks/ops-alerts' } },
        tags: ['DevOps', 'Incident', 'Discord', 'Slack', 'Multi-Agent'],
        nodes: [
          {
            id: 'node_trigger',
            type: 'triggerNode',
            position: { x: 100, y: 220 },
            data: {
              label: 'Incident Alert Ingested',
              nodeType: 'trigger_webhook',
              icon: 'Zap',
              config: { provider: 'webhook', event: 'incident_reported' },
            },
          },
          {
            id: 'node_ai_classifier',
            type: 'agentNode',
            position: { x: 380, y: 220 },
            data: {
              label: 'AI Severity Classifier',
              nodeType: 'agent_classifier',
              icon: 'Bot',
              config: {
                provider: 'gemini',
                action: 'classify',
                params: {
                  categories: ['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'],
                  instruction: 'Evaluate logs, error trace, and affected services.',
                },
              },
            },
          },
          {
            id: 'node_discord_broadcast',
            type: 'integrationNode',
            position: { x: 700, y: 140 },
            data: {
              label: 'Discord War-Room Alert',
              nodeType: 'integration_discord',
              icon: 'MessageCircle',
              config: {
                provider: 'discord',
                action: 'send_webhook',
                params: {
                  title: '🚨 Incident Alert: {{severity}}',
                  content: 'Incident detected on {{service}}: {{summary}}. Assigned to On-Call SRE.',
                  color: 0xef4444,
                },
              },
            },
          },
          {
            id: 'node_slack_broadcast',
            type: 'integrationNode',
            position: { x: 700, y: 300 },
            data: {
              label: 'Slack Ops Notification',
              nodeType: 'integration_slack',
              icon: 'MessageSquare',
              config: {
                provider: 'slack',
                action: 'send_message',
                params: {
                  channel: '#ops-critical',
                  text: '🔥 *[SEV-{{severity}}]* Incident in {{service}} - AI triage complete. War-room bridge opened.',
                },
              },
            },
          },
          {
            id: 'node_gmail_pager',
            type: 'integrationNode',
            position: { x: 1020, y: 220 },
            data: {
              label: 'Page On-Call Lead via Email',
              nodeType: 'integration_gmail',
              icon: 'Mail',
              config: {
                provider: 'gmail',
                action: 'send_email',
                params: {
                  to: 'oncall-leads@agentflow.ai',
                  subject: '[URGENT] Incident Triggered: {{service}}',
                  body: 'Incident triage report generated by Agentflow AI.\n\nSeverity: {{severity}}\nDetails: {{summary}}',
                },
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_ai_classifier', animated: true, type: 'smoothstep' },
          { id: 'e2', source: 'node_ai_classifier', target: 'node_discord_broadcast', animated: true, type: 'smoothstep' },
          { id: 'e3', source: 'node_ai_classifier', target: 'node_slack_broadcast', animated: true, type: 'smoothstep' },
          { id: 'e4', source: 'node_discord_broadcast', target: 'node_gmail_pager', animated: true, type: 'smoothstep' },
          { id: 'e5', source: 'node_slack_broadcast', target: 'node_gmail_pager', animated: true, type: 'smoothstep' },
        ],
      };
    }

    // 3. Customer support feedback & automated reply / triage
    if (p.includes('support') || p.includes('customer') || p.includes('ticket') || p.includes('feedback') || p.includes('lead')) {
      return {
        name: 'AI Customer Feedback & Smart Responder',
        description: 'Analyzes customer support queries, generates personalized AI drafts, alerts Slack, and sends automated resolution emails.',
        triggerConfig: { type: 'manual', config: {} },
        tags: ['Customer Success', 'Support', 'AI Responder', 'Gmail'],
        nodes: [
          {
            id: 'node_trigger',
            type: 'triggerNode',
            position: { x: 100, y: 200 },
            data: {
              label: 'Customer Inquiry Received',
              nodeType: 'trigger_manual',
              icon: 'Zap',
              config: { provider: 'manual', action: 'manual_trigger' },
            },
          },
          {
            id: 'node_sentiment_agent',
            type: 'agentNode',
            position: { x: 380, y: 200 },
            data: {
              label: 'Sentiment & Intent Agent',
              nodeType: 'agent_classifier',
              icon: 'Bot',
              config: {
                provider: 'openrouter',
                action: 'analyze_sentiment',
                params: {
                  extractIntent: true,
                  urgencyScore: true,
                },
              },
            },
          },
          {
            id: 'node_llm_responder',
            type: 'agentNode',
            position: { x: 680, y: 200 },
            data: {
              label: 'Resolution Draft Agent',
              nodeType: 'agent_llm',
              icon: 'Bot',
              config: {
                provider: 'gemini',
                action: 'draft_reply',
                params: {
                  tone: 'Empathetic & Professional',
                  includeKnowledgeBaseLinks: true,
                },
              },
            },
          },
          {
            id: 'node_gmail_reply',
            type: 'integrationNode',
            position: { x: 980, y: 200 },
            data: {
              label: 'Dispatch Response via Gmail',
              nodeType: 'integration_gmail',
              icon: 'Mail',
              config: {
                provider: 'gmail',
                action: 'send_email',
                params: {
                  to: '{{customer_email}}',
                  subject: 'Re: Support Request #{{ticket_id}} - Agentflow AI Resolution',
                  body: '{{ai_generated_response}}',
                },
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_sentiment_agent', animated: true, type: 'smoothstep' },
          { id: 'e2', source: 'node_sentiment_agent', target: 'node_llm_responder', animated: true, type: 'smoothstep' },
          { id: 'e3', source: 'node_llm_responder', target: 'node_gmail_reply', animated: true, type: 'smoothstep' },
        ],
      };
    }

    // 4. Default dynamic workflow based on parsed prompt words
    const cleanTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
    return {
      name: `AI Automation: ${cleanTitle}`,
      description: `Automated agentic workflow generated for: "${prompt}". Executes multi-stage AI reasoning and connected tool actions.`,
      triggerConfig: { type: 'manual', config: {} },
      tags: ['Automation', 'Agentic', 'Custom Pipeline'],
      nodes: [
        {
          id: 'node_1_trigger',
          type: 'triggerNode',
          position: { x: 100, y: 200 },
          data: {
            label: 'Workflow Trigger',
            nodeType: 'trigger_manual',
            icon: 'Zap',
            config: { provider: 'manual', action: 'start' },
          },
        },
        {
          id: 'node_2_ai_agent',
          type: 'agentNode',
          position: { x: 400, y: 200 },
          data: {
            label: 'AI Reasoning Agent',
            nodeType: 'agent_llm',
            icon: 'Bot',
            config: {
              provider: 'openrouter',
              action: 'execute_reasoning',
              params: { taskPrompt: prompt },
            },
          },
        },
        {
          id: 'node_3_slack_notify',
          type: 'integrationNode',
          position: { x: 720, y: 120 },
          data: {
            label: 'Slack Notification',
            nodeType: 'integration_slack',
            icon: 'MessageSquare',
            config: {
              provider: 'slack',
              action: 'send_message',
              params: { channel: '#operations', text: `Automation Completed: ${prompt}` },
            },
          },
        },
        {
          id: 'node_4_gmail_audit',
          type: 'integrationNode',
          position: { x: 720, y: 280 },
          data: {
            label: 'Email Audit Log',
            nodeType: 'integration_gmail',
            icon: 'Mail',
            config: {
              provider: 'gmail',
              action: 'send_email',
              params: {
                to: 'audit@agentflow.ai',
                subject: `Audit: Execution for ${cleanTitle}`,
                body: 'Execution completed successfully.',
              },
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_1_trigger', target: 'node_2_ai_agent', animated: true, type: 'smoothstep' },
        { id: 'e2', source: 'node_2_ai_agent', target: 'node_3_slack_notify', animated: true, type: 'smoothstep' },
        { id: 'e3', source: 'node_2_ai_agent', target: 'node_4_gmail_audit', animated: true, type: 'smoothstep' },
      ],
    };
  }
}

module.exports = new AIService();
