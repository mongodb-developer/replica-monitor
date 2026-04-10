function createClusterDescriptorService() {
  function parseShardHostDescriptor(hostDescriptor) {
    const descriptor = String(hostDescriptor || "").trim();
    if (!descriptor) {
      return { replSetName: "", hosts: [] };
    }
    const slashIndex = descriptor.indexOf("/");
    const replSetName = slashIndex >= 0 ? descriptor.slice(0, slashIndex).trim() : "";
    const hostsPart = slashIndex >= 0 ? descriptor.slice(slashIndex + 1) : descriptor;
    const hosts = hostsPart
      .split(",")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    return { replSetName, hosts };
  }

  return {
    parseShardHostDescriptor
  };
}

module.exports = {
  createClusterDescriptorService
};
