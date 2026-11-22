// Deal Desk mock agents – one server, three A2A agents
const express = require("express");
const { mountAgent, buildError } = require("./a2a.js");

const agents = [
  require("./pricing-agent.js"),
  require("./credit-agent.js"),
  require("./contract-agent.js")
];

const app = express();
app.set("trust proxy", true);   // behind Heroku's proxy: report https:// in agent cards
app.use(express.json());        // turn incoming JSON into a JavaScript object

// Plug each agent in: GET <path>/.well-known/agent-card.json  +  POST <path>
agents.forEach(agent => mountAgent(app, agent));

// Home page: list of agents and their card URLs (handy for demos and the Registry)
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    service: "Deal Desk mock agents",
    agents: agents.map(a => ({
      name: a.name,
      endpoint: `${baseUrl}${a.path}`,
      agentCard: `${baseUrl}${a.path}/.well-known/agent-card.json`
    }))
  });
});

// Health check (used later by Heroku / monitoring)
app.get("/health", (req, res) => res.json({ status: "UP" }));

// Any crash or bad JSON → still answer in JSON-RPC format, never an HTML error page
app.use((err, req, res, next) => {
  const isBadJson = err.type === "entity.parse.failed";
  console.error(isBadJson ? "Bad JSON received" : err);
  res.status(isBadJson ? 400 : 500).json(
    buildError(null, isBadJson ? -32700 : -32603, isBadJson ? "Invalid JSON" : "Internal error")
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Deal Desk agents running on http://localhost:${PORT}`);
  agents.forEach(a => console.log(`  • ${a.name.padEnd(15)} → http://localhost:${PORT}${a.path}`));
});
