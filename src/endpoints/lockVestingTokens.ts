import {
  Lucid,
  SpendingValidator,
  Data,
  fromText,
  TxComplete,
  toUnit,
} from "lucid-cardano";
import { fromAddress } from "../core/utils/utils.js";
import { LockTokensConfig, Result } from "../core/types.js";
import { VestingDatum } from "../core/contract.types.js";
import { PROTOCOL_FEE, PROTOCOL_PAYMENT_KEY, PROTOCOL_STAKE_KEY } from "../index.js";

export const lockTokens = async (
  lucid: Lucid,
  config: LockTokensConfig
): Promise<Result<TxComplete>> => {
  lucid.selectWalletFrom({ address: config.userAddress });

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

  const unit = config.vestingAsset.policyId
    ? toUnit(config.vestingAsset.policyId, config.vestingAsset.tokenName)
    : "lovelace";

  try {
    const tx = await lucid
      .newTx()
      .collectFrom(walletUtxos)
      .payToContract(
        validatorAddress,
        { inline: datum },
        {
          [unit]: BigInt(
            config.totalVestingQty - config.totalVestingQty * PROTOCOL_FEE
          ),
        }
      )
      .payToAddress(
        lucid.utils.credentialToAddress(
          lucid.utils.keyHashToCredential(PROTOCOL_PAYMENT_KEY),
          lucid.utils.keyHashToCredential(PROTOCOL_STAKE_KEY)
        ),
        {
          [unit]: BigInt(config.totalVestingQty * PROTOCOL_FEE),
        }
      )
      .complete();

    return { type: "ok", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
