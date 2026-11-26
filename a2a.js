// Common A2A helper – used by all 3 agents
const crypto = require("crypto");

// 1. Visiting card: builds the Agent Card JSON
function buildAgentCard(agent, baseUrl) {
  return {
    name: agent.name,
    description: agent.description,
    url: `${baseUrl}${agent.path}`,
    preferredTransport: "JSONRPC",
    version: "1.0.0",
    provider: { organization: "Deal Desk Demo", url: baseUrl },
    protocolVersion: "0.3.0",
    capabilities: { streaming: false },
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
    skills: agent.skills
  };
}

// 2. Ear: pulls the question text out of an incoming A2A request
function getUserText(body) {
  const parts = body?.params?.message?.parts || [];
  return parts.filter(p => p.kind === "text").map(p => p.text).join(" ");
}

// 3. Mouth: wraps the agent's answer in A2A reply format
function buildReply(requestId, answerText) {
  return {
    jsonrpc: "2.0",
    id: requestId,
    result: {
      kind: "message",
      role: "agent",
      messageId: crypto.randomUUID(),
      parts: [{ kind: "text", text: answerText }]
    }
  };
}

// 4. Error reply in A2A / JSON-RPC format
function buildError(requestId, code, message) {
  return { jsonrpc: "2.0", id: requestId ?? null, error: { code, message } };
}

// 5. Door: registers the 2 web addresses for one agent
function mountAgent(app, agent) {
  // GET  /pricing/.well-known/agent-card.json  → visiting card
  app.get(`${agent.path}/.well-known/agent-card.json`, (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json(buildAgentCard(agent, baseUrl));
  });

  // POST /pricing  → receive message, reply
  app.post(agent.path, (req, res) => {
    const body = req.body || {};
    if (body.method !== "message/send") {
      return res.json(buildError(body.id, -32601, `Method not supported: ${body.method}`));
    }
    const question = getUserText(body);
    if (!question) {
      return res.json(buildError(body.id, -32602, "No text found in message"));
    }
    const answer = agent.handle(question);   // ← agent's own business logic
    res.json(buildReply(body.id, answer));
  });
}

module.exports = { buildAgentCard, getUserText, buildReply, buildError, mountAgent };
