import { Address, LucidEvolution, toUnit } from "@lucid-evolution/lucid";
import { VestingDatum } from "../contract.types.js";
import { CborHex, ReadableUTxO } from "../types.js";
import { divCeil, parseUTxOsAtScript, toAddress } from "./utils.js";

export function checkVestingUtxo(
  vestingUtxo: ReadableUTxO<VestingDatum>
): boolean {
  const vestingPeriodLength =
    vestingUtxo.datum.vestingPeriodEnd - vestingUtxo.datum.vestingPeriodStart;
  const vestingTimeRemaining =
    vestingUtxo.datum.vestingPeriodEnd - BigInt(Date.now());

  const timeBetweenTwoInstallments = divCeil(
    BigInt(vestingPeriodLength),
    vestingUtxo.datum.totalInstallments
  );

  const futureInstallments = divCeil(
    vestingTimeRemaining,
    timeBetweenTwoInstallments
  );

  const expectedRemainingQty = divCeil(
    futureInstallments * vestingUtxo.datum.totalVestingQty,
    vestingUtxo.datum.totalInstallments
  );

  const vestingTokenUnit = vestingUtxo.datum.assetClass.symbol
    ? toUnit(
        vestingUtxo.datum.assetClass.symbol,
        vestingUtxo.datum.assetClass.name
      )
    : "lovelace";

  if (vestingTimeRemaining > 0n) {
    return vestingUtxo.assets[vestingTokenUnit] > expectedRemainingQty;
  }
  return true;
}

export async function getVestingByAddress(
  lucid: LucidEvolution,
  address: Address,
  script: CborHex
) {
  const network = lucid.config().network ?? "Preview";
  const utxos = await parseUTxOsAtScript<VestingDatum>(
    lucid,
    script,
    VestingDatum
  );
  const userUTxOs = utxos.filter((utxo) => {
    return toAddress(utxo.datum.beneficiary, network) == address;
  });
  return userUTxOs;
}
