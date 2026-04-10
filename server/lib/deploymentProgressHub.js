/**
 * In-memory SSE hub for long-running deployment operations keyed by client-provided token.
 */

const subscribers = new Map();
/** @type {Map<string, Array<{ id: string, label: string }>>} */
const lastPlanByToken = new Map();

function subscribe(token, res, req) {
  const key = String(token || "").trim();
  if (!key) {
    return false;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(": connected\n\n");

  const replayPlan = lastPlanByToken.get(key);
  if (replayPlan && replayPlan.length) {
    try {
      res.write(`event: plan\ndata: ${JSON.stringify({ steps: replayPlan })}\n\n`);
    } catch (_err) {
      // ignore
    }
  }

  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  const entry = { res };
  subscribers.get(key).add(entry);

  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      return;
    }
    try {
      res.write(": keepalive\n\n");
    } catch (_err) {
      clearInterval(keepAlive);
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    const set = subscribers.get(key);
    if (!set) {
      return;
    }
    set.delete(entry);
    if (set.size === 0) {
      subscribers.delete(key);
    }
  };

  req.on("close", cleanup);
  res.on("close", cleanup);
  res.on("finish", cleanup);

  return true;
}

function emitPlan(token, steps) {
  const key = String(token || "").trim();
  if (!key || !Array.isArray(steps)) {
    return;
  }
  lastPlanByToken.set(key, steps);
  const set = subscribers.get(key);
  if (!set || !set.size) {
    return;
  }
  const line = `event: plan\ndata: ${JSON.stringify({ steps })}\n\n`;
  for (const entry of set) {
    const { res } = entry;
    if (res.writableEnded) {
      continue;
    }
    try {
      res.write(line);
    } catch (_err) {
      // ignore
    }
  }
}

function emit(token, payload) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  const set = subscribers.get(key);
  if (!set || !set.size) {
    return;
  }
  const line = `event: step\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const entry of set) {
    const { res } = entry;
    if (res.writableEnded) {
      continue;
    }
    try {
      res.write(line);
    } catch (_err) {
      // Subscriber will be removed on close
    }
  }
}

function emitDone(token) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  const set = subscribers.get(key);
  if (!set || !set.size) {
    return;
  }
  const line = `event: complete\ndata: {}\n\n`;
  for (const entry of set) {
    const { res } = entry;
    if (res.writableEnded) {
      continue;
    }
    try {
      res.write(line);
    } catch (_err) {
      // ignore
    }
  }
}

function emitFatal(token, message) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  const set = subscribers.get(key);
  if (!set || !set.size) {
    return;
  }
  const line = `event: deploymentError\ndata: ${JSON.stringify({ message: String(message || "") })}\n\n`;
  for (const entry of set) {
    const { res } = entry;
    if (res.writableEnded) {
      continue;
    }
    try {
      res.write(line);
    } catch (_err) {
      // ignore
    }
  }
}

function close(token) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  const set = subscribers.get(key);
  if (!set) {
    return;
  }
  subscribers.delete(key);
  lastPlanByToken.delete(key);
  for (const entry of set) {
    const { res } = entry;
    if (!res.writableEnded) {
      try {
        res.end();
      } catch (_err) {
        // ignore
      }
    }
  }
}

function createProgressEmitter(progressToken) {
  const token = String(progressToken || "").trim();
  if (!token) {
    return null;
  }
  let currentId = null;

  async function runStep(id, label, fn) {
    currentId = id;
    emit(token, { id, label, status: "running" });
    try {
      const result = await fn();
      emit(token, { id, label, status: "done" });
      return result;
    } catch (error) {
      emit(token, {
        id,
        label,
        status: "error",
        detail: error?.message || String(error)
      });
      throw error;
    }
  }

  function stepStart(id, label) {
    if (currentId && currentId !== id) {
      emit(token, { id: currentId, status: "done" });
    }
    currentId = id;
    emit(token, { id, label, status: "running" });
  }

  function stepDone(id, label) {
    emit(token, { id, label, status: "done" });
    if (currentId === id) {
      currentId = null;
    }
  }

  function stepError(id, label, detail) {
    emit(token, { id, label, status: "error", detail: String(detail || "") });
  }

  function complete() {
    emitDone(token);
    close(token);
  }

  function fatal(message) {
    emitFatal(token, message);
    close(token);
  }

  /** Close stream without success event (after step error or outer failure). */
  function abort() {
    close(token);
  }

  function plan(steps) {
    emitPlan(token, steps);
  }

  function markStepDone(id, label) {
    emit(token, { id, label, status: "done" });
  }

  return { token, runStep, stepStart, stepDone, stepError, complete, fatal, abort, plan, markStepDone };
}

module.exports = {
  subscribe,
  emit,
  emitPlan,
  emitDone,
  emitFatal,
  close,
  createProgressEmitter
};
