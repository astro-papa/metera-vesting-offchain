import {
  collectPartial,
  CollectPartialConfig,
  Emulator,
  generateAccountSeedPhrase,
  lockTokens,
  LockTokensConfig,
  Lucid,
  parseUTxOsAtScript,
  toUnit,
  TWENTY_FOUR_HOURS_MS,
  utxosAtScript,
  VestingDatum,
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
        [toUnit(
          "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
          "63425443"
        )]: BigInt(100_00_000_000),
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

  const lockVestingConfig: LockTokensConfig = {
    beneficiary: users.account2.address,
    vestingAsset: {
      policyId: "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
      tokenName: "63425443",
    },
    totalVestingQty: 10_000_000,
    vestingPeriodStart: emulator.now(),
    vestingPeriodEnd: emulator.now() + TWENTY_FOUR_HOURS_MS,
    firstUnlockPossibleAfter: emulator.now(),
    totalInstallments: 4,
    vestingMemo: "",
    scripts: {
      vesting: linearVesting.cborHex,
    },
    userAddress: users.account1.address,
  };

  const lockVestingUnSigned = await lockTokens(lucid, lockVestingConfig);
  // console.log("lockVestingUnSigned", lockVestingUnSigned)
  expect(lockVestingUnSigned.type).toBe("ok");
  if (lockVestingUnSigned.type == "ok") {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);
    // console.log(tx.data.txComplete.to_json())
    const lockVestingSigned = await lockVestingUnSigned.data.sign().complete();
    const lockVestingHash = await lockVestingSigned.submit();
    // console.log(loandRquestHash)
  }

  //NOTE: INSTALLMENT 1
  emulator.awaitBlock(1080);

  const utxosAtVesting = await parseUTxOsAtScript(
    lucid,
    linearVesting.cborHex,
    VestingDatum
  );
  console.log("utxosAtVesting", utxosAtVesting);
  console.log("utxos at wallet", await lucid.utxosAt(users.account2.address))
  console.log("INSTALLMENT 1")

  const collectPartialConfig1: CollectPartialConfig = {
    vestingOutRef: (
      await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
    )[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    userAddress: users.account2.address,
    currentTime: emulator.now(),
  };

  const collectPartialUnsigned1 = await collectPartial(
    lucid,
    collectPartialConfig1
  );

  // console.log(collectPartialUnsigned1);
  expect(collectPartialUnsigned1.type).toBe("ok");

  if (collectPartialUnsigned1.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  lucid.selectWalletFromSeed(users.account2.seedPhrase);
  const collectPartialSigned1 = await collectPartialUnsigned1.data
    .sign()
    .complete();
  const collectPartialSignedHash1 = await collectPartialSigned1.submit();

  //NOTE: INSTALLMENT 2
  emulator.awaitBlock(1080);

  console.log("utxosAtVesting",
    await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
  );
  console.log("utxos at wallet", await lucid.utxosAt(users.account2.address))
  console.log("INSTALLMENT 2")

  const collectPartialConfig2: CollectPartialConfig = {
    vestingOutRef: (
      await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
    )[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    userAddress: users.account2.address,
    currentTime: emulator.now(),
  };

  const collectPartialUnsigned2 = await collectPartial(
    lucid,
    collectPartialConfig2
  );

  // console.log(collectPartialUnsigned);
  expect(collectPartialUnsigned2.type).toBe("ok");

  if (collectPartialUnsigned2.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  lucid.selectWalletFromSeed(users.account2.seedPhrase);
  const collectPartialSigned2 = await collectPartialUnsigned2.data
    .sign()
    .complete();
  const collectPartialSignedHash2 = await collectPartialSigned2.submit();

  //NOTE: INSTALLMENT 3
  emulator.awaitBlock(1080);

  console.log("utxosAtVesting",
    await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
  );
  console.log("utxos at wallet", await lucid.utxosAt(users.account2.address))
  console.log("INSTALLMENT 3")

  const collectPartialConfig3: CollectPartialConfig = {
    vestingOutRef: (
      await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
    )[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    userAddress: users.account2.address,
    currentTime: emulator.now(),
  };

  const collectPartialUnsigned3 = await collectPartial(
    lucid,
    collectPartialConfig3
  );

  // console.log(collectPartialUnsigned);
  expect(collectPartialUnsigned3.type).toBe("ok");

  if (collectPartialUnsigned3.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  lucid.selectWalletFromSeed(users.account2.seedPhrase);
  const collectPartialSigned3 = await collectPartialUnsigned3.data
    .sign()
    .complete();
  const collectPartialSignedHash3 = await collectPartialSigned3.submit();

  //NOTE: INSTALLMENT 4
  emulator.awaitBlock(1081);

  console.log("utxosAtVesting",
    await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
  );
  console.log("utxos at wallet", await lucid.utxosAt(users.account2.address))
  console.log("INSTALLMENT 4")

  const collectPartialConfig4: CollectPartialConfig = {
    vestingOutRef: (
      await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
    )[0].outRef,
    scripts: {
      vesting: linearVesting.cborHex,
    },
    userAddress: users.account2.address,
    currentTime: emulator.now(),
  };

  const collectPartialUnsigned4 = await collectPartial(
    lucid,
    collectPartialConfig4
  );

  // console.log(collectPartialUnsigned4);
  expect(collectPartialUnsigned4.type).toBe("ok");

  if (collectPartialUnsigned4.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  lucid.selectWalletFromSeed(users.account2.seedPhrase);
  const collectPartialSigned4 = await collectPartialUnsigned4.data
    .sign()
    .complete();
  const collectPartialSignedHash4 = await collectPartialSigned4.submit();

  emulator.awaitBlock(180);

  console.log("utxosAtVesting",
    await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
  );
  console.log("utxos at wallet", await lucid.utxosAt(users.account2.address))
});
