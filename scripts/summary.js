function rsSummary() {
  const config = rs.config();
  const status = rs.status();

  const priorityByHost = {};
  const votesByHost = {};
  const dataCenterByHost = {};
  const dataCenterRegionByHost = {};
  config.members.forEach((member) => {
    priorityByHost[member.host] = member.priority;
    votesByHost[member.host] = member.votes;
    dataCenterByHost[member.host] = member.tags?.dataCenterId || member.tags?.dataCenter;
    dataCenterRegionByHost[member.host] = member.tags?.dataCenter || null;
  });

  const summary = status.members.map((member) => ({
    name: member.name,
    stateStr: member.stateStr,
    health: member.health,
    priority: priorityByHost[member.name] ?? 0,
    votes: votesByHost[member.name] ?? 1,
    dataCenter: dataCenterByHost[member.name] || null,
    dataCenterRegion: dataCenterRegionByHost[member.name] || null
  }));

  const primary = status.members.find((member) => member.stateStr === "PRIMARY");
  const payload = {
    members: summary,
    primaryName: primary ? primary.name : null
  };

  print(JSON.stringify(payload));
}

rsSummary();