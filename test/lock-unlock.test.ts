import {
  CollectPartialConfig,
  collectVestingTokens,
  Emulator,
  generateEmulatorAccount,
  getVestingByAddress,
  lockTokens,
  LockTokensConfig,
  Lucid,
  LucidEvolution,
  toUnit,
  TWENTY_FOUR_HOURS_MS,
} from "../src/index.js"
import { beforeEach, expect, test } from "vitest";
import linearVesting from "./linearVesting.json" assert { type: "json" };

type LucidContext = {
  lucid: LucidEvolution;
  users: any;
  emulator: Emulator;
};

//NOTE: INITIALIZE EMULATOR + ACCOUNTS
beforeEach<LucidContext>(async (context) => {
  context.users = {
    treasury1: generateEmulatorAccount({
      lovelace: BigInt(100_000_000),
    }),
    project1: generateEmulatorAccount({
      lovelace: BigInt(100_000_000),
    }),
    account1: generateEmulatorAccount({
      lovelace: BigInt(100_000_000),
      [toUnit(
        "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
        "63425443"
      )]: BigInt(100_00_000_000),
    }),
    account2: generateEmulatorAccount({
      lovelace: BigInt(100_000_000),
    }),
    account3: generateEmulatorAccount({
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

  context.lucid = await Lucid(context.emulator, "Custom");
});

test<LucidContext>("Test - LockTokens, Unlock Tokens", async ({
  lucid,
  users,
  emulator,
}) => {
  const lockVestingConfig: LockTokensConfig = {
    beneficiary: users.account2.address,
    vestingAsset: {
      policyId: "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
      tokenName: "63425443",
    },
    totalVestingQty: 10,
    vestingPeriodStart: emulator.now(),
    vestingPeriodEnd: emulator.now() + TWENTY_FOUR_HOURS_MS,
    firstUnlockPossibleAfter: emulator.now(),
    totalInstallments: 4,
    scripts: {
      vesting: linearVesting.cborHex,
    },
  };
  console.log("LOCK VESTING CONFIG", lockVestingConfig);

  lucid.selectWallet.fromSeed(users.account1.seedPhrase);
  const lockVestingUnSigned = await lockTokens(lucid, lockVestingConfig);
  console.log("lockVestingUnSigned", lockVestingUnSigned)
  expect(lockVestingUnSigned.type).toBe("ok");
  if (lockVestingUnSigned.type == "ok") {
    const lockVestingSigned = await lockVestingUnSigned.data.sign.withWallet().complete();
    await lockVestingSigned.submit();
  }

  //NOTE: INSTALLMENT 1
  emulator.awaitBlock(1080);

  const utxosAtVesting1 = await getVestingByAddress(
    lucid,
    users.account2.address,
    linearVesting.cborHex
  );

  const collectPartialConfig1: CollectPartialConfig = {
    vestingOutRef: utxosAtVesting1[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    currentTime: emulator.now(),
  };

  lucid.selectWallet.fromSeed(users.account2.seedPhrase);
  const collectPartialUnsigned1 = await collectVestingTokens(
    lucid,
    collectPartialConfig1
  );

  expect(collectPartialUnsigned1.type).toBe("ok");

  if (collectPartialUnsigned1.type == "error") return;

  const collectPartialSigned1 = await collectPartialUnsigned1.data
    .sign.withWallet()
    .complete();
  await collectPartialSigned1.submit();

  //NOTE: INSTALLMENT 2
  emulator.awaitBlock(1080);

  const utxosAtVesting2 = await getVestingByAddress(
    lucid,
    users.account2.address,
    linearVesting.cborHex
  );
  
  const collectPartialConfig2: CollectPartialConfig = {
    vestingOutRef: utxosAtVesting2[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    currentTime: emulator.now(),
  };

  lucid.selectWallet.fromSeed(users.account2.seedPhrase);
  const collectPartialUnsigned2 = await collectVestingTokens(
    lucid,
    collectPartialConfig2
  );

  expect(collectPartialUnsigned2.type).toBe("ok");

  if (collectPartialUnsigned2.type == "error") return;

  const collectPartialSigned2 = await collectPartialUnsigned2.data
    .sign.withWallet()
    .complete();
  await collectPartialSigned2.submit();

  //NOTE: INSTALLMENT 3
  emulator.awaitBlock(1080);

  const utxosAtVesting3 = await getVestingByAddress(
    lucid,
    users.account2.address,
    linearVesting.cborHex
  );

  const collectPartialConfig3: CollectPartialConfig = {
    vestingOutRef: utxosAtVesting3[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    currentTime: emulator.now(),
  };

  lucid.selectWallet.fromSeed(users.account2.seedPhrase);
  const collectPartialUnsigned3 = await collectVestingTokens(
    lucid,
    collectPartialConfig3
  );

  expect(collectPartialUnsigned3.type).toBe("ok");

  if (collectPartialUnsigned3.type == "error") return;

  const collectPartialSigned3 = await collectPartialUnsigned3.data
    .sign.withWallet()
    .complete();
  await collectPartialSigned3.submit();

  //NOTE: INSTALLMENT 4
  emulator.awaitBlock(1081);

  const utxosAtVesting4 = await getVestingByAddress(
    lucid,
    users.account2.address,
    linearVesting.cborHex
  );

  const collectPartialConfig4: CollectPartialConfig = {
    vestingOutRef: utxosAtVesting4[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    currentTime: emulator.now(),
  };

  lucid.selectWallet.fromSeed(users.account2.seedPhrase);
  const collectPartialUnsigned4 = await collectVestingTokens(
    lucid,
    collectPartialConfig4
  );

  expect(collectPartialUnsigned4.type).toBe("ok");
  if (collectPartialUnsigned4.type == "error") return;

  const collectPartialSigned4 = await collectPartialUnsigned4.data
    .sign.withWallet()
    .complete();
  await collectPartialSigned4.submit();

  emulator.awaitBlock(180);
});
