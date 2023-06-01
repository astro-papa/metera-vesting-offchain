import {buildScripts, createLoanRequest, provideLoan, Emulator, generateAccountSeedPhrase, Lucid, utxosAtScript, LoanRequestConfig, ProvideLoanConfig, CancelLoanConfig, cancelLoan, PayLoanConfig, payLoan, CollectInterestConfig, collectInterest} from "cherrylend-offchain"
// import {buildScripts, createLoanRequest, provideLoan, Emulator, generateAccountSeedPhrase, Lucid, utxosAtScript} from "../dist/index.js"
import {describe, expect, test} from "vitest"
import scripts from "./plutus.json"

describe("", () => {
  test("dummy test", async () => {
    const num = 1
    expect(num).toBe(1)
  })

  test("Test - Create loan, Provide loan", async () => {
    // console.log("[INFO]: Init Emulator")
    const users = {
      account1: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
      account2: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
    }

    // console.log("[INFO]: User account \n")
    // console.log(users)

    const emulator = new Emulator([
      users.account1,
      users.account2,
    ])

    const lucid = await Lucid.new(emulator)

    lucid.selectWalletFromSeed(users.account1.seedPhrase)
    const lender_borrower = scripts.validators.find((v) => v.title === "lender_borrower.mint")?.compiledCode!
    const request = scripts.validators.find((v) => v.title === "request.spend")?.compiledCode!
    const collateral = scripts.validators.find((v) => v.title === "collateral.spend")?.compiledCode!
    const interest = scripts.validators.find((v) => v.title === "interest.spend")?.compiledCode!
    const liquidation = scripts.validators.find((v) => v.title === "liquidation.spend")?.compiledCode!

    const appliedScripts = buildScripts(lucid, lender_borrower, request, collateral, interest, liquidation)

    const loanRequestConfig: LoanRequestConfig =
    {
      loanAmount: 20_000_000,
      interestAmount: 1_000_000,
      collateral: {policyId: "", tokenName: ""},
      collateralAmount: 30_000_000,
      duration: 600_000, // 10 minutes
      requestExpirationTime: 600_000, // 10 minutes for expiration
      scripts: {
        borrower: appliedScripts.borrower,
        request: appliedScripts.request
      },
      currenTime: emulator.now()
    }

    const loanRequestUnsigned = await createLoanRequest(lucid, loanRequestConfig)

    expect(loanRequestUnsigned.type).toBe("ok")

    if (loanRequestUnsigned.type == 'ok') {
      // console.log(tx.data.txComplete.to_json())
      const loanRequestSigned = await loanRequestUnsigned.data.sign().complete()
      const loandRquestHash = await loanRequestSigned.submit()
      // console.log(loandRquestHash)
    }

    emulator.awaitBlock(4)

    lucid.selectWalletFromSeed(users.account2.seedPhrase)

    const arbitratyUTXO = await utxosAtScript(lucid, appliedScripts.request)

    const provideLoanConfig: ProvideLoanConfig = {
      requestUTXO: arbitratyUTXO[0],
      scripts: {
        request: appliedScripts.request,
        lender: appliedScripts.lender,
        collateral: appliedScripts.collateral
      },
      currenTime: emulator.now()
    }
    const provideLoanUnSigned = await provideLoan(lucid, provideLoanConfig)
    console.log(provideLoanUnSigned)
    expect(provideLoanUnSigned.type).toBe("ok")

    if (provideLoanUnSigned.type == 'ok') {
      const provideLoanSigned = await provideLoanUnSigned.data.sign().complete()
      const provideLoanHash = await provideLoanSigned.submit()
      // console.log(provideLoanHash)
    }
    emulator.awaitBlock(4)
    // console.log("lender wallet", await lucid.wallet.getUtxos())
    lucid.selectWalletFromSeed(users.account1.seedPhrase)
    // console.log("borrower wallet", await lucid.wallet.getUtxos())
    // console.log("collateral script", await utxosAtScript(lucid, appliedScripts.collateral))

  })

  test("Test - Create loan, Cancel loan", async () => {
    // console.log("[INFO]: Init Emulator")
    const users = {
      account1: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
      account2: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
    }

    // console.log("[INFO]: User account \n")
    // console.log(users)

    const emulator = new Emulator([
      users.account1,
      users.account2,
    ])

    const lucid = await Lucid.new(emulator)

    lucid.selectWalletFromSeed(users.account1.seedPhrase)
    const lender_borrower = scripts.validators.find((v) => v.title === "lender_borrower.mint")?.compiledCode!
    const request = scripts.validators.find((v) => v.title === "request.spend")?.compiledCode!
    const collateral = scripts.validators.find((v) => v.title === "collateral.spend")?.compiledCode!
    const interest = scripts.validators.find((v) => v.title === "interest.spend")?.compiledCode!
    const liquidation = scripts.validators.find((v) => v.title === "liquidation.spend")?.compiledCode!

    const appliedScripts = buildScripts(lucid, lender_borrower, request, collateral, interest, liquidation)

    const loanRequestConfig: LoanRequestConfig =
    {
      loanAmount: 20_000_000,
      interestAmount: 1_000_000,
      collateral: {policyId: "", tokenName: ""},
      collateralAmount: 30_000_000,
      duration: 600_000, // 10 minutes
      requestExpirationTime: 600_000, // 10 minutes for expiration
      scripts: {
        borrower: appliedScripts.borrower,
        request: appliedScripts.request
      },
      currenTime: emulator.now()
    }

    const loanRequestUnsigned = await createLoanRequest(lucid, loanRequestConfig)

    expect(loanRequestUnsigned.type).toBe("ok")

    if (loanRequestUnsigned.type == 'ok') {
      // console.log(tx.data.txComplete.to_json())
      const loanRequestSigned = await loanRequestUnsigned.data.sign().complete()
      const loandRquestHash = await loanRequestSigned.submit()
      // console.log(loandRquestHash)
    }

    emulator.awaitBlock(4)
    console.log("borrower wallet 1", await lucid.wallet.getUtxos())

    const arbitratyUTXO = await utxosAtScript(lucid, appliedScripts.request)

    const cancelLoanConfig: CancelLoanConfig = {
      requestUTXO: arbitratyUTXO[0],
      scripts: {
        borrower: appliedScripts.borrower,
        request: appliedScripts.request,
      },
    }
    const cancelLoanUnSigned = await cancelLoan(lucid, cancelLoanConfig)
    console.log(cancelLoanUnSigned)
    expect(cancelLoanUnSigned.type).toBe("ok")

    if (cancelLoanUnSigned.type == 'ok') {
      const cancelLoanSigned = await cancelLoanUnSigned.data.sign().complete()
      const cancelLoanHash = await cancelLoanSigned.submit()
      // console.log(provideLoanHash)
    }
    emulator.awaitBlock(4)
    console.log("borrower wallet 2", await lucid.wallet.getUtxos())

  })

  test("Test - Create loan, Provide loan, Pay Loan, Collect Interest", async () => {
    // console.log("[INFO]: Init Emulator")
    const users = {
      account1: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
      account2: await generateAccountSeedPhrase({lovelace: BigInt(100_000_000)}),
    }

    // console.log("[INFO]: User account \n")
    // console.log(users)

    const emulator = new Emulator([
      users.account1,
      users.account2,
    ])

    const lucid = await Lucid.new(emulator)

    lucid.selectWalletFromSeed(users.account1.seedPhrase)
    const lender_borrower = scripts.validators.find((v) => v.title === "lender_borrower.mint")?.compiledCode!
    const request = scripts.validators.find((v) => v.title === "request.spend")?.compiledCode!
    const collateral = scripts.validators.find((v) => v.title === "collateral.spend")?.compiledCode!
    const interest = scripts.validators.find((v) => v.title === "interest.spend")?.compiledCode!
    const liquidation = scripts.validators.find((v) => v.title === "liquidation.spend")?.compiledCode!

    const appliedScripts = buildScripts(lucid, lender_borrower, request, collateral, interest, liquidation)

    const loanRequestConfig: LoanRequestConfig =
    {
      loanAmount: 20_000_000,
      interestAmount: 1_000_000,
      collateral: {policyId: "", tokenName: ""},
      collateralAmount: 30_000_000,
      duration: 600_000, // 10 minutes
      requestExpirationTime: 600_000, // 10 minutes for expiration
      scripts: {
        borrower: appliedScripts.borrower,
        request: appliedScripts.request
      },
      currenTime: emulator.now()
    }

    const loanRequestUnsigned = await createLoanRequest(lucid, loanRequestConfig)

    expect(loanRequestUnsigned.type).toBe("ok")

    if (loanRequestUnsigned.type == 'ok') {
      // console.log(tx.data.txComplete.to_json())
      const loanRequestSigned = await loanRequestUnsigned.data.sign().complete()
      const loandRquestHash = await loanRequestSigned.submit()
      // console.log(loandRquestHash)
    }

    emulator.awaitBlock(4)

    lucid.selectWalletFromSeed(users.account2.seedPhrase)

    const arbitratyUTXO = await utxosAtScript(lucid, appliedScripts.request)

    const provideLoanConfig: ProvideLoanConfig = {
      requestUTXO: arbitratyUTXO[0],
      scripts: {
        request: appliedScripts.request,
        lender: appliedScripts.lender,
        collateral: appliedScripts.collateral
      },
      currenTime: emulator.now()
    }
    const provideLoanUnSigned = await provideLoan(lucid, provideLoanConfig)
    console.log(provideLoanUnSigned)
    expect(provideLoanUnSigned.type).toBe("ok")

    if (provideLoanUnSigned.type == 'ok') {
      const provideLoanSigned = await provideLoanUnSigned.data.sign().complete()
      const provideLoanHash = await provideLoanSigned.submit()
      // console.log(provideLoanHash)
    }
    emulator.awaitBlock(4)
    // console.log("lender wallet", await lucid.wallet.getUtxos())
    lucid.selectWalletFromSeed(users.account1.seedPhrase)
    console.log("borrower wallet", await lucid.wallet.getUtxos())
    // console.log("collateral script", await utxosAtScript(lucid, appliedScripts.collateral))

    emulator.awaitBlock(4)

    lucid.selectWalletFromSeed(users.account1.seedPhrase)

    const arbitratyCollateralUTXO = await utxosAtScript(lucid, appliedScripts.collateral)
    console.log("collateral Utxo", arbitratyCollateralUTXO[0])

    const payloanConfig: PayLoanConfig = {
      collateralUTXO: arbitratyCollateralUTXO[0],
      scripts: {
        borrower: appliedScripts.borrower,
        interest: appliedScripts.interest,
        collateral: appliedScripts.collateral
      },
      currenTime: emulator.now()
    }

    const payLoanUnSigned = await payLoan(lucid, payloanConfig)
    expect(payLoanUnSigned.type).toBe("ok")
    if (payLoanUnSigned.type == 'ok') {
      const payLoanSigned = await payLoanUnSigned.data.sign().complete()
      const payLoanHash = await payLoanSigned.submit()
    }
    emulator.awaitBlock(4)

    console.log("borrower wallet", await lucid.wallet.getUtxos())

    emulator.awaitBlock(4)

    lucid.selectWalletFromSeed(users.account2.seedPhrase)

    console.log("lender wallet before", await lucid.wallet.getUtxos())
    const arbitratyInterestUTXO = await utxosAtScript(lucid, appliedScripts.interest)
    console.log("interest Utxo", arbitratyInterestUTXO[0])

    const collectInterestConfig: CollectInterestConfig = {
      interestUTxO: arbitratyInterestUTXO[0],
      scripts: {
        lender: appliedScripts.lender,
        interest: appliedScripts.interest
      }
    }

    const collectInterestUnSigned = await collectInterest(lucid, collectInterestConfig)
    expect(collectInterestUnSigned.type).toBe("ok")
    if (collectInterestUnSigned.type == 'ok') {
      const collectInterestSigned = await collectInterestUnSigned.data.sign().complete()
      const collectInterestHash = await collectInterestSigned.submit()
    }
    emulator.awaitBlock(4)
    console.log("lender wallet after", await lucid.wallet.getUtxos())
  })

})

