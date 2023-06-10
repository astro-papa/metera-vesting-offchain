import {
  Data,
  Lucid,
  SpendingValidator,
  toUnit,
  TxComplete,
} from "lucid-cardano";
import { divCeil, toAddress } from "../common/utils.js";
import { CollectPartialConfig, Result } from "../global.types.js";
import { VestingRedeemer, VestingDatum } from "./contract.types.js";

export const collectPartial = async (
  lucid: Lucid,
  config: CollectPartialConfig
): Promise<Result<TxComplete>> => {
  config.currentTime ??= Date.now();

  const vestingValidator: SpendingValidator = {
    type: "PlutusV2",
    script: config.scripts.vesting,
  };

  const vestingValidatorAddress =
    lucid.utils.validatorToAddress(vestingValidator);

  if (!config.vestingUTXO)
    return { type: "error", error: new Error("No Utxo in Script") };

  if (!config.vestingUTXO.datum)
    return { type: "error", error: new Error("Missing Datum") };
  const datum = Data.from(config.vestingUTXO.datum, VestingDatum);

  const vestingPeriodLength = datum.vestingPeriodEnd - datum.vestingPeriodStart;

  const vestingTimeRemaining =
    datum.vestingPeriodEnd - BigInt(config.currentTime);

  const timeBetweenTwoInstallments = divCeil(
    vestingPeriodLength,
    datum.totalInstallments
  );

  const futureInstallments = divCeil(
    vestingTimeRemaining,
    timeBetweenTwoInstallments
  );

  const expectedRemainingQty = divCeil(
    futureInstallments * datum.totalVestingQty,
    datum.totalInstallments
  );

  const vestingTokenUnit = datum.assetClass.symbol ? toUnit(
    datum.assetClass.symbol,
    datum.assetClass.name
  ) :
    "lovelace"

  const vestingTokenAmount =
    config.vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;

  const beneficiaryAddress = toAddress(datum.beneficiary, lucid);

  const vestingRedeemer = Data.to("PartialUnlock", VestingRedeemer);

  try {
    const tx = await lucid
      .newTx()
      .collectFrom([config.vestingUTXO], vestingRedeemer)
      .payToAddress(beneficiaryAddress, {
        [vestingTokenUnit]: vestingTokenAmount,
      })
      .payToContract(
        vestingValidatorAddress,
        { inline: Data.to(datum, VestingDatum) },
        { [vestingTokenUnit]: expectedRemainingQty }
      )
      .validFrom(config.currentTime)
      .validTo(config.currentTime)
      .addSigner(beneficiaryAddress)
      .attachSpendingValidator(vestingValidator)
      .complete();

    return { type: "ok", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
