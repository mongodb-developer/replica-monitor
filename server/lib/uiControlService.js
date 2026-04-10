const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ADMIN_PASSWORD_PATH = path.join(__dirname, "../data/adminPassword");

let adminPasswordLoggedMissing = false;
let cachedAdminPassword = null;
let cachedAdminPasswordLoaded = false;

/** @type {string | null} */
let controllerSessionId = null;
/** @type {Buffer | null} */
let controllerTokenHash = null;

const UI_CONTROL_ERROR = "ui-control required";

function loadAdminPassword() {
  if (cachedAdminPasswordLoaded) {
    return cachedAdminPassword;
  }
  cachedAdminPasswordLoaded = true;
  try {
    const raw = fs.readFileSync(ADMIN_PASSWORD_PATH, "utf8");
    const trimmed = String(raw || "").trim();
    cachedAdminPassword = trimmed.length ? trimmed : null;
    if (!cachedAdminPassword && !adminPasswordLoggedMissing) {
      adminPasswordLoggedMissing = true;
      console.warn(
        "UI control: adminPassword file missing or empty; passwordless admin claim (first session or takeover)."
      );
    }
  } catch (_err) {
    cachedAdminPassword = null;
    if (!adminPasswordLoggedMissing) {
      adminPasswordLoggedMissing = true;
      console.warn(
        "UI control: adminPassword file missing or empty; passwordless admin claim (first session or takeover)."
      );
    }
  }
  return cachedAdminPassword;
}

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token), "utf8").digest();
}

function tokensMatch(storedHash, providedToken) {
  if (!storedHash || !providedToken) {
    return false;
  }
  const h = hashToken(providedToken);
  if (h.length !== storedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(h, storedHash);
}

function getUiControlSnapshot() {
  const passwordRequiredForClaim = Boolean(loadAdminPassword());
  return {
    controllerSessionId,
    passwordRequiredForClaim,
    adminClaimRequired: passwordRequiredForClaim
  };
}

function generateControllerToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * @returns {{ ok: true, controllerToken: string } | { ok: false, status: number, body: object }}
 */
function claimControl({ sessionId, password, forceTakeover }) {
  const sid = String(sessionId || "").trim();
  if (!sid) {
    return { ok: false, status: 400, body: { ok: false, error: "sessionId is required" } };
  }
  const adminPw = loadAdminPassword();
  if (adminPw) {
    if (!timingSafeEqualStrings(password, adminPw)) {
      return { ok: false, status: 401, body: { ok: false, error: "Invalid password" } };
    }
  }

  if (controllerSessionId && controllerSessionId !== sid) {
    if (!forceTakeover) {
      return {
        ok: false,
        status: 409,
        body: { ok: false, conflict: true, error: "Another session holds control" }
      };
    }
  }

  const controllerToken = generateControllerToken();
  controllerSessionId = sid;
  controllerTokenHash = hashToken(controllerToken);
  return { ok: true, controllerToken };
}

/**
 * @returns {{ ok: true } | { ok: false, status: number, body: object }}
 */
function releaseControl({ sessionId, controllerToken }) {
  const sid = String(sessionId || "").trim();
  const token = String(controllerToken || "").trim();
  if (!sid || !token) {
    return { ok: false, status: 400, body: { ok: false, error: "sessionId and controller token are required" } };
  }
  if (controllerSessionId !== sid || !tokensMatch(controllerTokenHash, token)) {
    return { ok: false, status: 403, body: { ok: false, error: UI_CONTROL_ERROR } };
  }
  controllerSessionId = null;
  controllerTokenHash = null;
  return { ok: true };
}

function assertControllerHeaders(req) {
  const sid = String(req.headers["x-session-id"] || "").trim();
  const auth = String(req.headers.authorization || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  const token = match ? match[1].trim() : "";
  if (!sid || !token) {
    return false;
  }
  if (controllerSessionId !== sid) {
    return false;
  }
  return tokensMatch(controllerTokenHash, token);
}

function requireUiControl(req, res, next) {
  if (assertControllerHeaders(req)) {
    next();
    return;
  }
  res.status(403).json({ ok: false, error: UI_CONTROL_ERROR });
}

module.exports = {
  UI_CONTROL_ERROR,
  getUiControlSnapshot,
  claimControl,
  releaseControl,
  requireUiControl,
  assertControllerHeaders,
  loadAdminPassword
};
