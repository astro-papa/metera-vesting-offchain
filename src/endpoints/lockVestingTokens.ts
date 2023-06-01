import {
  Lucid,
  SpendingValidator,
  Data,
  fromText,
  TxComplete,
  toUnit,
} from "lucid-cardano";
import { fromAddress } from "../common/utils.js";
import { LockVestingTokensConfig, Result } from "../global.types.js";
import { VestingDatum } from "./contract.types.js";

export const lockVestingTokensConfig = async (
  lucid: Lucid,
  config: LockVestingTokensConfig
): Promise<Result<TxComplete>> => {
  const walletUtxos = await lucid.wallet.getUtxos();

  if (!walletUtxos.length)
    return { type: "error", error: new Error("No utxos in wallet") };

  const vestingValidator: SpendingValidator = {
    type: "PlutusV2",
    script: config.scripts.vesting,
  };
  const validatorAddress = lucid.utils.validatorToAddress(vestingValidator);

  const datum = Data.to(
    {
      beneficiary: fromAddress(config.beneficiary),
      assetClass: {
        symbol: config.vestingAsset.policyId,
        name: config.vestingAsset.tokenName,
      },
      totalVestingQty: BigInt(config.totalVestingQty),
      vestingPeriodStart: BigInt(config.vestingPeriodStart),
      vestingPeriodEnd: BigInt(config.vestingPeriodEnd),
      firstUnlockPossibleAfter: BigInt(config.firstUnlockPossibleAfter),
      totalInstallments: BigInt(config.totalInstallments),
      vestingMemo: fromText(config.vestingMemo),
    },
    VestingDatum
  );


  const unit = toUnit(
    config.vestingAsset.policyId,
    config.vestingAsset.tokenName
  );

  try {
    const tx = await lucid
      .newTx()
      .collectFrom(walletUtxos)
      .payToContract(
        validatorAddress,
        { inline: datum },
        { [unit]: BigInt(config.totalVestingQty) }
      )
      .complete();

    return { type: "ok", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
