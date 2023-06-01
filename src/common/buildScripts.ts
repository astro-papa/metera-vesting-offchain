import {applyParamsToScript, fromText, Lucid, MintingPolicy, SpendingValidator} from "lucid-cardano"
import {RawHex} from "../global.types.js";

type Result = {
  lender: string;
  borrower: string;
  request: string;
  collateral: string;
  interest: string;
  liquidation: string;
}


export const buildScripts = (lucid: Lucid, lender_borrower: RawHex, requestUnapplied: RawHex, collateralUnapplied: RawHex, interestUnapplied: RawHex, liquidationUnapplied: RawHex): Result => {

  const borrowerFlag = 1

  const borrower =
    applyParamsToScript(lender_borrower, [
      BigInt(borrowerFlag)
    ])

  const borrowerPolicy: MintingPolicy = {
    type: "PlutusV2",
    script: borrower
  }

  const borrowerPolicyId = lucid.utils.mintingPolicyToId(borrowerPolicy)

  const lenderFlag = 0

  const lender =
    applyParamsToScript(lender_borrower, [
      BigInt(lenderFlag)
    ])

  const lenderPolicy: MintingPolicy = {
    type: "PlutusV2",
    script: lender
  }

  const lenderPolicyId = lucid.utils.mintingPolicyToId(lenderPolicy)

  const interest =
    applyParamsToScript(interestUnapplied, [
      lenderPolicyId
    ])

  const interestValidator: SpendingValidator = {
    type: "PlutusV2",
    script: interest
  }

  const interestValidatorHash = lucid.utils.validatorToScriptHash(interestValidator)


  const collateral =
    applyParamsToScript(collateralUnapplied, [
      borrowerPolicyId,
      lenderPolicyId,
      interestValidatorHash,
      ""
    ])

  const collateralValidator: SpendingValidator = {
    type: "PlutusV2",
    script: collateral
  }

  const collateralValidatorHash = lucid.utils.validatorToScriptHash(collateralValidator)

  const request =
    applyParamsToScript(requestUnapplied, [
      borrowerPolicyId,
      lenderPolicyId,
      collateralValidatorHash,
      fromText("stakingHash"),
    ])

  const liquidation =
    applyParamsToScript(liquidationUnapplied, [
      borrowerPolicyId
    ])

  return {
    lender: lender,
    borrower: borrower,
    request: request,
    collateral: collateral,
    interest: interest,
    liquidation: liquidation,
  }

}

