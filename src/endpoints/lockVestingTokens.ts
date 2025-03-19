import {
  LucidEvolution,
  SpendingValidator,
  Data,
  TxSignBuilder,
  toUnit,
  validatorToAddress,
  credentialToAddress,
  keyHashToCredential,
} from "@lucid-evolution/lucid";
import { fromAddress } from "../core/utils/utils.js";
import { LockTokensConfig, Result } from "../core/types.js";
import { VestingDatum } from "../core/contract.types.js";
import {
  PROTOCOL_FEE,
  PROTOCOL_PAYMENT_KEY,
  PROTOCOL_STAKE_KEY,
} from "../index.js";

export const lockTokens = async (
  lucid: LucidEvolution,
  config: LockTokensConfig
): Promise<Result<TxSignBuilder>> => {
  const network = lucid.config().network;

  const vestingValidator: SpendingValidator = {
    type: "PlutusV2",
    script: config.scripts.vesting,
  };
  const validatorAddress = validatorToAddress(network, vestingValidator);

  const datum = Data.to(
    {
      beneficiary: fromAddress(config.beneficiary),
      assetClass: {
        symbol: config.vestingAsset.policyId,
        name: config.vestingAsset.tokenName,
      },
      totalVestingQty: BigInt(
        Math.floor(config.totalVestingQty - config.totalVestingQty * PROTOCOL_FEE)
      ),
      vestingPeriodStart: BigInt(config.vestingPeriodStart),
      vestingPeriodEnd: BigInt(config.vestingPeriodEnd),
      firstUnlockPossibleAfter: BigInt(config.firstUnlockPossibleAfter),
      totalInstallments: BigInt(config.totalInstallments),
    },
    VestingDatum
  );

  const unit = config.vestingAsset.policyId
    ? toUnit(config.vestingAsset.policyId, config.vestingAsset.tokenName)
    : "lovelace";

  try {
    const walletUtxos = await lucid.wallet().getUtxos();
    if (!walletUtxos.length)
      return { type: "error", error: new Error("No utxos in wallet") };

    const tx = await lucid
      .newTx()
      .collectFrom(walletUtxos)
      .pay.ToContract(
        validatorAddress,
        { kind: "inline", value: datum },
        {
          [unit]: BigInt(
            Math.floor(config.totalVestingQty - config.totalVestingQty * PROTOCOL_FEE)
          ),
        }
      )
      .pay.ToAddress(
        credentialToAddress(
          network,
          keyHashToCredential(PROTOCOL_PAYMENT_KEY),
          keyHashToCredential(PROTOCOL_STAKE_KEY)
        ),
        {
          [unit]: BigInt(Math.ceil(config.totalVestingQty * PROTOCOL_FEE))
        }
      )
      .complete();

    return { type: "ok", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
