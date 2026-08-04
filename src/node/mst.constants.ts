/**
 * MST system (genesis) contract addresses.
 * Source: https://github.com/bnb-chain/mst-genesis-contract
 *
 * NOTE: MST upgrades these contracts via hardforks (Feynman, Maxwell, ...).
 * Some liveness/jailing logic has moved between SlashIndicator and StakeHub
 * over time. Before relying on `felonyThreshold` / `misdemeanorThreshold`
 * in production, confirm the current ABI on BscScan for the address below:
 * https://mstscan.com/address/0x0000000000000000000000000000000000001001#readContract
 */
export const VALIDATOR_SET_ADDRESS =
  '0x0000000000000000000000000000000000001000';
export const SLASH_INDICATOR_ADDRESS =
  '0x0000000000000000000000000000000000001001';
export const STAKE_HUB_ADDRESS = '0x0000000000000000000000000000000000002002';

export const DEFAULT_MST_RPC_URL = 'https://mariorpc.mstblockchain.com/';

/** MSTValidatorSet — tracks the active/working validator set */
export const VALIDATOR_SET_ABI = [
  'function getValidators() view returns (address[])',
  'function getWorkingValidatorCount() view returns (uint256)',
  // returns 1-based index of the validator in the current set, 0 if absent
  'function currentValidatorSetMap(address validator) view returns (uint256)',
];

/** SlashIndicator — tracks missed-block counts used for downtime slashing */
export const SLASH_INDICATOR_ABI = [
  'function getSlashIndicator(address validator) view returns (uint256 height, uint256 count)',
  'function felonyThreshold() view returns (uint256)',
  'function misdemeanorThreshold() view returns (uint256)',
];

/** StakeHub — validator lifecycle, jailing, commission, delegation (post-Feynman) */
export const STAKE_HUB_ABI = [
  'function getValidatorBasicInfo(address operatorAddress) view returns (uint256 createdTime, bool jailed, uint256 jailUntil)',
  'function unjail(address operatorAddress)',
];
