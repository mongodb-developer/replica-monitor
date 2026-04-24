/**
 * In-memory SSE hub for long-running deployment operations keyed by client-provided token.
 */

const TERMINAL_TTL_MS = 10 * 60 * 1000;

const subscribers = new Map();
/** @type {Map<string, Array<{ id: string, label: string }>>} */
const lastPlanByToken = new Map();
/** @type {Map<string, { status: string, result?: unknown, message?: string, validationErrors?: string[] }>} */
const terminalByToken = new Map();
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const terminalExpiryByToken = new Map();
const inFlightTokens = new Set();

function clearTerminalExpiry(key) {
  const t = terminalExpiryByToken.get(key);
  if (t) {
    clearTimeout(t);
    terminalExpiryByToken.delete(key);
  }
}

function scheduleTerminalExpiry(key) {
  clearTerminalExpiry(key);
  const id = setTimeout(() => {
    terminalByToken.delete(key);
    lastPlanByToken.delete(key);
    terminalExpiryByToken.delete(key);
  }, TERMINAL_TTL_MS);
  id.unref?.();
  terminalExpiryByToken.set(key, id);
}

function getValidTerminal(key) {
  return terminalByToken.get(key) || null;
}

function markDeploymentInFlight(token) {
  const key = String(token || "").trim();
  if (key) {
    inFlightTokens.add(key);
  }
}

function clearDeploymentInFlight(token) {
  const key = String(token || "").trim();
  if (key) {
    inFlightTokens.delete(key);
  }
}

function removeSubscribers(key) {
  const set = subscribers.get(key);
  if (!set) {
    return;
  }
  subscribers.delete(key);
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

function subscribe(token, res, req) {
  const key = String(token || "").trim();
  if (!key) {
    return false;
  }

  const terminal = getValidTerminal(key);
  if (terminal) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
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
    try {
      if (terminal.status === "done") {
        res.write(`event: complete\ndata: ${JSON.stringify({ result: terminal.result ?? null })}\n\n`);
      } else {
        res.write(
          `event: deploymentError\ndata: ${JSON.stringify({
            message: String(terminal.message || ""),
            validationErrors: terminal.validationErrors || undefined
          })}\n\n`
        );
      }
      res.end();
    } catch (_err) {
      // ignore
    }
    return true;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
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

/**
 * @param {string} token
 * @param {unknown} [result]
 */
function emitComplete(token, result) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  clearDeploymentInFlight(key);
  terminalByToken.set(key, { status: "done", result: result ?? null });
  scheduleTerminalExpiry(key);

  const set = subscribers.get(key);
  const line = `event: complete\ndata: ${JSON.stringify({ result: result ?? null })}\n\n`;
  if (set && set.size) {
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
  removeSubscribers(key);
}

/**
 * @param {string} token
 * @param {string} message
 * @param {string[] | null | undefined} validationErrors
 */
function emitFatal(token, message, validationErrors) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  clearDeploymentInFlight(key);
  const errs = Array.isArray(validationErrors) ? validationErrors : undefined;
  terminalByToken.set(key, {
    status: "error",
    message: String(message || ""),
    validationErrors: errs
  });
  scheduleTerminalExpiry(key);

  const set = subscribers.get(key);
  const line = `event: deploymentError\ndata: ${JSON.stringify({ message: String(message || ""), validationErrors: errs })}\n\n`;
  if (set && set.size) {
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
  removeSubscribers(key);
}

/** @deprecated Use emitComplete */
function emitDone(token, result) {
  emitComplete(token, result);
}

function close(token) {
  const key = String(token || "").trim();
  if (!key) {
    return;
  }
  clearDeploymentInFlight(key);
  removeSubscribers(key);
  lastPlanByToken.delete(key);
  clearTerminalExpiry(key);
  terminalByToken.delete(key);
}

function getDeploymentProgressStatus(token) {
  const key = String(token || "").trim();
  if (!key) {
    return { status: "invalid" };
  }
  const terminal = getValidTerminal(key);
  if (terminal) {
    if (terminal.status === "done") {
      return { status: "done", result: terminal.result ?? null };
    }
    return {
      status: "error",
      error: terminal.message || "Deployment failed.",
      validationErrors: terminal.validationErrors
    };
  }
  if (inFlightTokens.has(key)) {
    return { status: "running" };
  }
  return { status: "unknown" };
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

  /** @param {unknown} [result] */
  function complete(result) {
    emitComplete(token, result);
  }

  function fatal(message, validationErrors) {
    emitFatal(token, message, validationErrors);
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
  emitComplete,
  emitFatal,
  close,
  createProgressEmitter,
  getDeploymentProgressStatus,
  markDeploymentInFlight,
  clearDeploymentInFlight,
  TERMINAL_TTL_MS
};
