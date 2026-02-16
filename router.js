export function pickModel(messages, requestedModel = null) {  // Add optional requestedModel param
  const text = messages.map(m => m.content || "").join(" ").toLowerCase();

  // NEW: Prioritize explicit Grok 4.1 requests from client (Cursor sets model field)
  if (requestedModel) {
    const reqLower = requestedModel.toLowerCase();
    if (reqLower.includes('grok-4.1') || reqLower.includes('grok-4-1')) {
      if (reqLower.includes('non-reasoning')) {
        return 'x-ai/grok-4-1-fast-non-reasoning';
      }
      if (reqLower.includes('reasoning')) {
        return 'x-ai/grok-4-1-fast-reasoning';
      }
      return 'x-ai/grok-4-1-fast';  // default to main Grok 4.1 Fast
    }
  }

  // Original logic below (fallback when no explicit Grok 4.1 requested)
  if (!text || text.trim() === "") {
    return "gpt-5-nano";
  }

  // BUILDING (Code, Architecture, Implementation)
  if (
    text.includes("code") ||
    text.includes("implement") ||
    text.includes("function") ||
    text.includes("class") ||
    text.includes("api") ||
    text.includes("debug") ||
    text.includes("bug") ||
    text.includes("fix") ||
    text.includes("refactor") ||
    text.includes("sql") ||
    text.includes("database") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("deploy") ||
    text.includes("config") ||
    text.includes("docker") ||
    text.includes("kubernetes") ||
    text.includes("terraform") ||
    text.includes("write a") ||
    text.includes("create a") ||
    text.includes("build") ||
    text.includes("develop")
  ) {
    return "gpt-5-nano"; // Use DeepSeek for code (faster, cheaper)
  }

  // PLANNING (Architecture, Design, Analysis)
  if (
    text.includes("plan") ||
    text.includes("design") ||
    text.includes("rencana") ||
    text.includes("rencanakan") ||
    text.includes("strategy") ||
    text.includes("analyze") ||
    text.includes("compare") ||
    text.includes("decision") ||
    text.includes("recommend") ||
    text.includes("struktur") ||
    text.includes("periksa") ||
    text.includes("overview") ||
    text.includes("roadmap") ||
    text.includes("alur") ||
    text.includes("diagram") ||
    text.includes("flow") ||
    text.includes("system design") ||
    text.includes("high level")
  ) {
    return "deepseek-reasoner"; // DeepSeek for planning too
  }

  // REASONING (Complex problem solving, math, logic)
  if (
    text.includes("reason") ||
    text.includes("solve") ||
    text.includes("explain") ||
    text.includes("how does") ||
    text.includes("why is") ||
    text.includes("what is") ||
    text.includes("step by step") ||
    text.includes("proof") ||
    text.includes("calculate") ||
    text.includes("derive") ||
    text.includes("think about")
  ) {
    return "deepseek-reasoner"; // DeepSeek for reasoning (has reasoning model built-in)
  }

  // FAST/GENERAL (Quick tasks, simple questions)
  if (
    text.includes("?") ||
    text.length < 100
  ) {
    return "gpt-5-nano"; // Use fast model for simple queries
  }

  // Default - balanced for most tasks
  return "gpt-5-nano";
}
