export interface SyncStatus {
  syncing: boolean;
  startingSClock?: number;
  currentBlock?: number;
  highestBlock?: number;
}

export interface NodeHealth {
  peerCount: number;
  hasPeers: boolean;
  listening: boolean;
  syncing: boolean;
  healthy: boolean;
}

export interface SlashIndicatorResult {
  height: number;

  count: number;
}

export interface SlashThresholds {
  felonyThreshold: number;
  misdemeanorThreshold: number;
}

export interface ValidatorJailInfo {
  createdTime: number;
  jailed: boolean;
  /** unix seconds; 0 if not jailed */
  jailUntil: number;
  jailUntilDate: Date | null;
}

export interface ValidatorHealthReport {
  address: string;
  inCurrentValidatorSet: boolean;
  missedBlockCount: number;
  misdemeanorThreshold: number;
  felonyThreshold: number;
  /** missed-block count has crossed the misdemeanor line but not felony */
  isMisdemeanor: boolean;
  /** jailed on-chain, or missed-block count crossed the felony line */
  isFelony: boolean;
  jailed: boolean;
  jailUntil: Date | null;
}
