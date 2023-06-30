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
import { beforeEach, describe, expect, test } from "vitest";
import { readFileSync } from "fs";
import linearVesting from "./linearVesting.json";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
};

//NOTE: INITIALIZE EMULATOR + ACCOUNTS
beforeEach<LucidContext>(async (context) => {
  context.users = {
    treasury1: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    project1: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account1: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account2: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account3: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
  };

  context.emulator = new Emulator([
    context.users.treasury1,
    context.users.project1,
    context.users.account1,
    context.users.account2,
    context.users.account3,
  ]);

  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Test - LockTokens, Unlock Tokens", async ({
  lucid,
  users,
  emulator,
}) => {
  lucid.selectWalletFromSeed(users.account1.seedPhrase);

  const lockVestingConfig: LockTokensConfig = {
    beneficiary: users.account2.address,
    vestingAsset: {
      policyId: "",
      tokenName: "",
    },
    totalVestingQty: 10_000_000,
    vestingPeriodStart: emulator.now(),
    vestingPeriodEnd: emulator.now() + 10_000,
    firstUnlockPossibleAfter: emulator.now(),
    totalInstallments: 2,
    vestingMemo: "",
    scripts: {
      vesting: linearVesting.cborHex,
    },
  };

  const lockVestingUnSigned = await lockTokens(lucid, lockVestingConfig);
  expect(lockVestingUnSigned.type).toBe("ok");
  if (lockVestingUnSigned.type == "ok") {
    // console.log(tx.data.txComplete.to_json())
    const lockVestingSigned = await lockVestingUnSigned.data.sign().complete();
    const lockVestingHash = await lockVestingSigned.submit();
    // console.log(loandRquestHash)
  }
  emulator.awaitBlock(4);

  const arbitratyUTXO = await utxosAtScript(lucid, linearVesting.cborHex);

  console.log(arbitratyUTXO);

  lucid.selectWalletFromSeed(users.account2.seedPhrase);

  const collectPartialConfig: CollectPartialConfig = {
    vestingUTXO: arbitratyUTXO[0],
    scripts: {
      vesting: linearVesting.cborHex,
    },
  };
  const collectPartialUnsigned = await collectPartial(
    lucid,
    collectPartialConfig
  );
  console.log(collectPartialUnsigned);
  expect(collectPartialUnsigned.type).toBe("ok");
});
