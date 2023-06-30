import {
  Data,
  Lucid,
  SpendingValidator,
  toUnit,
  TxComplete,
} from "lucid-cardano";
import { divCeil, parseSafeDatum, toAddress } from "../core/utils/utils.js";
import { CollectPartialConfig, Result } from "../core/types.js";
import { VestingRedeemer, VestingDatum } from "../core/contract.types.js";

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

  const vestingUTXO = (await lucid.utxosByOutRef([config.vestingOutRef]))[0];

  if (!vestingUTXO)
    return { type: "error", error: new Error("No Utxo in Script") };

  if (!vestingUTXO.datum)
    return { type: "error", error: new Error("Missing Datum") };

  const datum = parseSafeDatum(lucid,vestingUTXO.datum,VestingDatum)
  if (datum.type == "left") return {type: "error", error: new Error(datum.value)}

  const vestingPeriodLength = datum.value.vestingPeriodEnd - datum.value.vestingPeriodStart;

  const vestingTimeRemaining =
    datum.value.vestingPeriodEnd - BigInt(config.currentTime);

  const timeBetweenTwoInstallments = divCeil(
    vestingPeriodLength,
    datum.value.totalInstallments
  );

  const futureInstallments = divCeil(
    vestingTimeRemaining,
    timeBetweenTwoInstallments
  );

  const expectedRemainingQty = divCeil(
    futureInstallments * datum.value.totalVestingQty,
    datum.value.totalInstallments
  );

  const vestingTokenUnit = datum.value.assetClass.symbol
    ? toUnit(datum.value.assetClass.symbol, datum.value.assetClass.name)
    : "lovelace";

  const vestingTokenAmount =
    vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;

  const beneficiaryAddress = toAddress(datum.value.beneficiary, lucid);

  const vestingRedeemer = Data.to("PartialUnlock", VestingRedeemer);

  try {
    const tx = await lucid
      .newTx()
      .collectFrom([vestingUTXO], vestingRedeemer)
      .payToAddress(beneficiaryAddress, {
        [vestingTokenUnit]: vestingTokenAmount,
      })
      .payToContract(
        vestingValidatorAddress,
        { inline: Data.to(datum.value, VestingDatum) },
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
