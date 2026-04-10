function createStatusAggregationService(deps) {
  const {
    getApplicationServerSettings,
    doesContainerExist,
    CONFIG_SERVER_CONTAINER_NAME,
    listShardsFromConfigServer,
    preferredStatusServiceByShard,
    buildPreferredFirstOrderForShard,
    queryStatusFromService,
    memberNameToService,
    trackedReplicaServices,
    buildUnavailableMember,
    rememberMemberState,
    buildServiceRuntimeStatus,
    buildMemberAddressMap,
    setLastKnownPrimaryService,
    getPreferredStatusService,
    getStatusQueryOrder,
    resolveShardByHostFromConfigServer,
    isReplicaServiceCandidate
  } = deps;

  async function fetchReplicaStatus() {
    let topologySharded = false;
    try {
      const settings = await getApplicationServerSettings();
      topologySharded = Boolean(settings?.templateTopology?.sharded);
    } catch (_error) {
      topologySharded = false;
    }

    const configServerExists = await doesContainerExist(CONFIG_SERVER_CONTAINER_NAME);
    if (configServerExists) {
      const shards = await listShardsFromConfigServer({ suppressErrors: true });
      if (shards.length) {
        const activeShardNames = new Set(shards.map((shard) => shard.shardName).filter(Boolean));
        for (const shardName of [...preferredStatusServiceByShard.keys()]) {
          if (!activeShardNames.has(shardName)) {
            preferredStatusServiceByShard.delete(shardName);
          }
        }
        const combinedMembers = [];
        const shardErrors = [];
        let fallbackPrimaryName = null;
        let statusSourceService = CONFIG_SERVER_CONTAINER_NAME;
        const shardSelections = [];
        const statusSourceByShard = {};
        const shardZones = {};

        for (const shard of shards) {
          const shardName = String(shard.shardName || "").trim();
          if (shardName) {
            shardZones[shardName] = Array.isArray(shard.tags) ? [...shard.tags] : [];
          }
          const shardServices = [...new Set((shard.hosts || []).map((host) => memberNameToService(host)))];
          const orderedShardServices = buildPreferredFirstOrderForShard(
            shardName,
            shardServices
          );
          let shardStatus = null;
          let queriedService = null;
          for (const serviceName of orderedShardServices) {
            try {
              shardStatus = await queryStatusFromService(serviceName);
              queriedService = serviceName;
              break;
            } catch (_error) {
              // Try next member in shard.
            }
          }
          if (!shardStatus) {
            shardErrors.push(`${shardName}: unable to query any shard member`);
            for (const host of shard.hosts || []) {
              const serviceName = memberNameToService(host);
              if (!serviceName) {
                continue;
              }
              trackedReplicaServices.add(serviceName);
              combinedMembers.push(
                buildUnavailableMember(serviceName, {
                  shard: shardName || null
                })
              );
            }
            continue;
          }
          if (!fallbackPrimaryName && shardStatus.primaryName) {
            fallbackPrimaryName = shardStatus.primaryName;
          }
          let effectiveStatusSource = queriedService;
          const primaryServiceForShard = memberNameToService(shardStatus.primaryName);
          const shardHasOverride = preferredStatusServiceByShard.has(shardName);
          if (
            !shardHasOverride &&
            primaryServiceForShard &&
            shardServices.includes(primaryServiceForShard) &&
            primaryServiceForShard !== queriedService
          ) {
            try {
              shardStatus = await queryStatusFromService(primaryServiceForShard);
              effectiveStatusSource = primaryServiceForShard;
            } catch (_error) {
              effectiveStatusSource = queriedService;
            }
          }
          statusSourceService = effectiveStatusSource;
          statusSourceByShard[shardName] = effectiveStatusSource;
          shardSelections.push({ shardName, selectedService: effectiveStatusSource });
          trackedReplicaServices.add(statusSourceService);
          for (const member of shardStatus.members) {
            rememberMemberState({ ...member, shard: shardName || null });
            trackedReplicaServices.add(memberNameToService(member.name));
            combinedMembers.push({ ...member, shard: shardName || null });
          }
        }

        if (combinedMembers.length) {
          const primaryByShard = new Map();
          for (const member of combinedMembers) {
            if (member.role === "primary" && member.shard && !primaryByShard.has(member.shard)) {
              primaryByShard.set(member.shard, member.name);
            }
          }
          const replicationEdges = combinedMembers
            .map((member) => {
              const shardPrimary = member.shard ? primaryByShard.get(member.shard) : null;
              if (!shardPrimary || member.name === shardPrimary) {
                return null;
              }
              const primaryMember = combinedMembers.find((entry) => entry.name === shardPrimary);
              return {
                from: shardPrimary,
                to: member.name,
                active: Boolean(primaryMember?.isHealthy) && Boolean(member.isHealthy)
              };
            })
            .filter(Boolean);
          const serviceRuntime = await buildServiceRuntimeStatus();
          const addressMap = await buildMemberAddressMap(combinedMembers);
          if (fallbackPrimaryName) {
            setLastKnownPrimaryService(memberNameToService(fallbackPrimaryName));
          }
          return {
            updatedAt: new Date().toISOString(),
            members: combinedMembers,
            primaryName: fallbackPrimaryName,
            replicationEdges,
            statusSourceService,
            statusSourceByShard,
            preferredStatusService: getPreferredStatusService(),
            preferredStatusServiceByShard: Object.fromEntries(preferredStatusServiceByShard),
            serviceRuntime,
            addressMap,
            configServerExists,
            topologySharded,
            shardZones,
            shardErrors
          };
        }
      }
    }

    const errors = [];
    const queryOrder = await getStatusQueryOrder();

    for (const serviceName of queryOrder) {
      try {
        const status = await queryStatusFromService(serviceName);
        setLastKnownPrimaryService(memberNameToService(status.primaryName));
        trackedReplicaServices.add(serviceName);
        if (status.primaryName) {
          trackedReplicaServices.add(memberNameToService(status.primaryName));
        }
        for (const member of status.members) {
          rememberMemberState(member);
          trackedReplicaServices.add(memberNameToService(member.name));
        }
        const shardByHost = await resolveShardByHostFromConfigServer();
        const membersWithShard = status.members.map((member) => ({
          ...member,
          shard: shardByHost.get(member.name) || null
        }));
        const serviceRuntime = await buildServiceRuntimeStatus();
        const addressMap = await buildMemberAddressMap(membersWithShard);
        return {
          ...status,
          members: membersWithShard,
          statusSourceService: serviceName,
          preferredStatusService: getPreferredStatusService(),
          serviceRuntime,
          addressMap,
          configServerExists,
          topologySharded
        };
      } catch (error) {
        errors.push(`${serviceName}: ${error.message}`);
      }
    }
    const serviceRuntime = await buildServiceRuntimeStatus();
    const fallbackMembers = Object.entries(serviceRuntime)
      .filter(([serviceName]) => isReplicaServiceCandidate(serviceName))
      .map(([serviceName, runtime]) => {
        if (runtime.containerRunning && runtime.mongodRunning) {
          return null;
        }
        return buildUnavailableMember(serviceName);
      })
      .filter(Boolean);
    if (fallbackMembers.length) {
      const addressMap = await buildMemberAddressMap(fallbackMembers);
      return {
        updatedAt: new Date().toISOString(),
        members: fallbackMembers,
        primaryName: null,
        replicationEdges: [],
        statusSourceService: null,
        preferredStatusService: getPreferredStatusService(),
        serviceRuntime,
        addressMap,
        configServerExists,
        topologySharded
      };
    }
    return {
      updatedAt: new Date().toISOString(),
      members: [],
      primaryName: null,
      replicationEdges: [],
      statusSourceService: null,
      preferredStatusService: getPreferredStatusService(),
      serviceRuntime,
      addressMap: {},
      configServerExists,
      topologySharded,
      statusErrors: errors
    };
  }

  return {
    fetchReplicaStatus
  };
}

module.exports = {
  createStatusAggregationService
};
