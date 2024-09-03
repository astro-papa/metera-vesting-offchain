import {
  Data,
  LucidEvolution,
  SpendingValidator,
  toUnit,
  TxSignBuilder,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import { divCeil, parseSafeDatum, toAddress } from "../core/utils/utils.js";
import { CollectPartialConfig, Result } from "../core/types.js";
import { VestingRedeemer, VestingDatum } from "../core/contract.types.js";
import { TIME_TOLERANCE_MS } from "../index.js";

export const collectVestingTokens = async (
  lucid: LucidEvolution,
  config: CollectPartialConfig
): Promise<Result<TxSignBuilder>> => {
  const network = lucid.config().network;

  config.currentTime ??= Date.now();

  const vestingValidator: SpendingValidator = {
    type: "PlutusV2",
    script: config.scripts.vesting,
  };

  const vestingValidatorAddress =
    validatorToAddress(network, vestingValidator);

  const vestingUTXO = (await lucid.utxosByOutRef([config.vestingOutRef]))[0];

  if (!vestingUTXO)
    return { type: "error", error: new Error("No Utxo in Script") };

  if (!vestingUTXO.datum)
    return { type: "error", error: new Error("Missing Datum") };

  const datum = parseSafeDatum(vestingUTXO.datum, VestingDatum);
  if (datum.type == "left")
    return { type: "error", error: new Error(datum.value) };

  const vestingPeriodLength =
    datum.value.vestingPeriodEnd - datum.value.vestingPeriodStart;

  const vestingTimeRemaining =
    datum.value.vestingPeriodEnd - BigInt(config.currentTime);
  // console.log("vestingTimeRemaining", vestingTimeRemaining);

  const timeBetweenTwoInstallments = divCeil(
    BigInt(vestingPeriodLength),
    datum.value.totalInstallments
  );
  // console.log("timeBetweenTwoInstallments", timeBetweenTwoInstallments);

  const futureInstallments = divCeil(
    vestingTimeRemaining,
    timeBetweenTwoInstallments
  );
  // console.log("futureInstallments", futureInstallments);

  const expectedRemainingQty = divCeil(
    futureInstallments * datum.value.totalVestingQty,
    datum.value.totalInstallments
  );
  // console.log("expectedRemainingQty", expectedRemainingQty);

  const vestingTokenUnit = datum.value.assetClass.symbol
    ? toUnit(datum.value.assetClass.symbol, datum.value.assetClass.name)
    : "lovelace";
  // console.log("vestingTokenUnit", vestingTokenUnit)

  const vestingTokenAmount =
    vestingTimeRemaining < 0n
      ? vestingUTXO.assets[vestingTokenUnit]
      : vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;
  // console.log("vestingTokenAmount", vestingTokenAmount);

  const beneficiaryAddress = toAddress(datum.value.beneficiary, network);

  const vestingRedeemer =
    vestingTimeRemaining < 0n
      ? Data.to("FullUnlock", VestingRedeemer)
      : Data.to("PartialUnlock", VestingRedeemer);

  const upperBound = Number(config.currentTime + TIME_TOLERANCE_MS);
  const lowerBound = Number(config.currentTime - TIME_TOLERANCE_MS);

  try {
    if (vestingTimeRemaining < 0n) {
      const tx = await lucid
        .newTx()
        .collectFrom([vestingUTXO], vestingRedeemer)
        .attach.SpendingValidator(vestingValidator)
        .pay.ToAddress(beneficiaryAddress, {
          [vestingTokenUnit]: vestingTokenAmount,
        })
        .addSigner(beneficiaryAddress)
        .validFrom(lowerBound)
        .validTo(upperBound)
        .complete();
      return { type: "ok", data: tx };
    } else {
      const tx = await lucid
        .newTx()
        .collectFrom([vestingUTXO], vestingRedeemer)
        .attach.SpendingValidator(vestingValidator)
        .pay.ToAddress(beneficiaryAddress, {
          [vestingTokenUnit]: vestingTokenAmount,
        })
        .pay.ToContract(
          vestingValidatorAddress,
          { kind: "inline", value: Data.to(datum.value, VestingDatum) },
          { [vestingTokenUnit]: expectedRemainingQty }
        )
        .addSigner(beneficiaryAddress)
        .validFrom(lowerBound)
        .validTo(upperBound)
        .complete();
      return { type: "ok", data: tx };
    }
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
