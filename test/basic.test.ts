import {
  collectPartial,
  CollectPartialConfig,
  Emulator,
  generateAccountSeedPhrase,
  lockTokens,
  LockTokensConfig,
  Lucid,
  utxosAtScript,
} from "linear-vesting-offchain";
import { describe, expect, test } from "vitest";
import {readFileSync} from "fs"

describe("", () => {
  test("dummy test", async () => {
    const num = 1;
    expect(num).toBe(1);
  });

  test("Test - Create loan, Provide loan", async () => {
    // console.log("[INFO]: Init Emulator")
    const users = {
      account1: await generateAccountSeedPhrase({
        lovelace: BigInt(100_000_000),
      }),
      account2: await generateAccountSeedPhrase({
        lovelace: BigInt(100_000_000),
      }),
    };

    // console.log("[INFO]: User account \n")
    // console.log(users)

    const emulator = new Emulator([users.account1, users.account2]);

    const lucid = await Lucid.new(emulator);

    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const script = JSON.parse( readFileSync("./linearVesting.json", "utf8") )

    const lockVestingConfig: LockTokensConfig = {
      beneficiary: users.account2.address,
      vestingAsset: {
        policyId: "",
        tokenName: ""
      },
      totalVestingQty: 10_000_000,
      vestingPeriodStart: emulator.now(),
      vestingPeriodEnd: emulator.now() + 10_000 ,
      firstUnlockPossibleAfter: emulator.now(),
      totalInstallments: 2,
      vestingMemo: "",
      scripts: {
        vesting: script.cborHex
      }
    };

    const lockVestingUnSigned = await lockTokens(lucid,lockVestingConfig)
    expect(lockVestingUnSigned.type).toBe("ok");
    if (lockVestingUnSigned.type == "ok") {
      // console.log(tx.data.txComplete.to_json())
      const lockVestingSigned = await lockVestingUnSigned.data
        .sign()
        .complete();
      const lockVestingHash = await lockVestingSigned.submit();
      // console.log(loandRquestHash)
    }
    emulator.awaitBlock(4);

    const arbitratyUTXO = await utxosAtScript(
      lucid,
      script.cborHex
    );

    console.log(arbitratyUTXO)

    lucid.selectWalletFromSeed(users.account2.seedPhrase);

    const collectPartialConfig : CollectPartialConfig = {
      vestingUTXO: arbitratyUTXO[0],
      scripts: {
        vesting: script.cborHex
      }
    }
    const collectPartialUnsigned = await collectPartial(lucid,collectPartialConfig)
    console.log(collectPartialUnsigned)
    expect(collectPartialUnsigned.type).toBe("ok")

  });
});
