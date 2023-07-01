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

  lucid.selectWalletFrom({ address: config.userAddress });

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

  const datum = parseSafeDatum(lucid, vestingUTXO.datum, VestingDatum);
  if (datum.type == "left")
    return { type: "error", error: new Error(datum.value) };

  const vestingPeriodLength =
    datum.value.vestingPeriodEnd - datum.value.vestingPeriodStart;

  const vestingTimeRemaining =
    datum.value.vestingPeriodEnd - BigInt(config.currentTime);
  console.log("vestingTimeRemaining", vestingTimeRemaining);

  const timeBetweenTwoInstallments = divCeil(
    vestingPeriodLength,
    datum.value.totalInstallments
  );
  console.log("timeBetweenTwoInstallments", timeBetweenTwoInstallments);

  const futureInstallments = divCeil(
    vestingTimeRemaining,
    timeBetweenTwoInstallments
  );
  console.log("futureInstallments", futureInstallments);

  const expectedRemainingQty = divCeil(
    futureInstallments * datum.value.totalVestingQty,
    datum.value.totalInstallments
  );
  console.log("expectedRemainingQty", expectedRemainingQty);

  const vestingTokenUnit = datum.value.assetClass.symbol
    ? toUnit(datum.value.assetClass.symbol, datum.value.assetClass.name)
    : "lovelace";

  const vestingTokenAmount =
    vestingTimeRemaining < 0
      ? expectedRemainingQty
      : vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;

  console.log("vestingTokenAmount", vestingTokenAmount);

  const beneficiaryAddress = toAddress(datum.value.beneficiary, lucid);

  //TODO: add a check if deadline is pass then add full unlock
  const vestingRedeemer =
    vestingTimeRemaining < 0
      ? Data.to("FullUnlock", VestingRedeemer)
      : Data.to("PartialUnlock", VestingRedeemer);

  //NOTE:
  //https://github.com/input-output-hk/plutus-apps/blob/2ef232c253e4f10fef7c339ac6366ba9125182be/plutus-ledger/src/Ledger/Slot.hs#L60-L63
  //if Closure is true then inclusive, it means the posixtime is included otherweise if not substract -1
  //emulator set this in TX, not sure why they both shuold be inclusive
  //PLowerBound [_0 = (PFinite [_0 = (PPOSIXTime 1688213154353)]), _1 = PTrue]

  const upperBound = config.currentTime + 100_000;
  console.log("upperBound", upperBound);

  //TODO: add full unlock if deadline is passed
  try {
    if (vestingTimeRemaining < 0) {
      const tx = await lucid
        .newTx()
        .collectFrom([vestingUTXO], vestingRedeemer)
        .attachSpendingValidator(vestingValidator)
        .payToAddress(beneficiaryAddress, {
          [vestingTokenUnit]: vestingTokenAmount,
        })
        .addSigner(beneficiaryAddress)
        .validFrom(config.currentTime)
        .validTo(config.currentTime)
        .complete();
      return { type: "ok", data: tx };
    } else {
      const tx = await lucid
        .newTx()
        .collectFrom([vestingUTXO], vestingRedeemer)
        .attachSpendingValidator(vestingValidator)
        .payToAddress(beneficiaryAddress, {
          [vestingTokenUnit]: vestingTokenAmount,
        })
        .payToContract(
          vestingValidatorAddress,
          { inline: Data.to(datum.value, VestingDatum) },
          { [vestingTokenUnit]: expectedRemainingQty }
        )
        .addSigner(beneficiaryAddress)
        .validFrom(config.currentTime)
        .validTo(config.currentTime)
        .complete();
      return { type: "ok", data: tx };
    }
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };
    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
};
