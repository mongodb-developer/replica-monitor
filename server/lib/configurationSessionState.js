/**
 * In-memory flags for the current Node process. Used so the UI can require that a
 * configuration template apply has completed in this session before Save is offered,
 * even when persisted settings.json still contains topology from a previous run.
 */
let configurationApplySucceededThisProcess = false;

function markConfigurationApplySucceeded() {
  configurationApplySucceededThisProcess = true;
}

function clearConfigurationApplySucceeded() {
  configurationApplySucceededThisProcess = false;
}

function hasConfigurationApplySucceededThisProcess() {
  return configurationApplySucceededThisProcess;
}

module.exports = {
  markConfigurationApplySucceeded,
  clearConfigurationApplySucceeded,
  hasConfigurationApplySucceededThisProcess
};
