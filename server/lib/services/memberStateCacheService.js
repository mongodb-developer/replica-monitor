function createMemberStateCacheService(deps) {
  const { lastKnownMemberStateByService, memberNameToService } = deps;

  function rememberMemberState(member) {
    const serviceName = memberNameToService(member?.name);
    if (!serviceName) {
      return;
    }
    lastKnownMemberStateByService.set(serviceName, {
      dataCenter: member?.dataCenter || "AMER",
      priority: Number(member?.priority ?? 1),
      votes: Number(member?.votes ?? 1),
      shard: member?.shard || null
    });
  }

  function buildUnavailableMember(serviceName, overrides = {}) {
    const cached = lastKnownMemberStateByService.get(serviceName) || {};
    const dataCenter = overrides.dataCenter || cached.dataCenter || "AMER";
    const priority = Number(overrides.priority ?? cached.priority ?? 1);
    const votes = Number(overrides.votes ?? cached.votes ?? 1);
    const shard = overrides.shard === undefined ? cached.shard || null : overrides.shard;
    return {
      name: `${serviceName}:27017`,
      stateStr: "Not reachable/healthy",
      health: 0,
      priority,
      votes,
      dataCenter,
      role: "other",
      isHealthy: false,
      shard
    };
  }

  return {
    rememberMemberState,
    buildUnavailableMember
  };
}

module.exports = {
  createMemberStateCacheService
};
