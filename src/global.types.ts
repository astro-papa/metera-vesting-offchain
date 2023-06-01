import { Address, UTxO } from "lucid-cardano";

export type CborHex = string;
export type RawHex = string;
export type POSIXTime = number;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type LockVestingTokensConfig = {
  beneficiary: Address;
  vestingAsset: AssetClass;
  totalVestingQty: number;
  vestingPeriodStart: POSIXTime;
  vestingPeriodEnd: POSIXTime;
  firstUnlockPossibleAfter: POSIXTime;
  totalInstallments: number;
  vestingMemo: string;
  scripts: {
    vesting: CborHex;
  };
};

export type CollectPartialVesting = {
  vestingUTXO: UTxO;
  scripts: {
    vesting: CborHex;
  };
  currentTime?: POSIXTime;
};
