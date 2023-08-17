import { Data } from "@anastasia-labs/lucid-cardano-fork"

export const OutputReferenceSchema = Data.Object({
  txHash: Data.Object({ hash: Data.Bytes({ minLength: 32, maxLength: 32 }) }),
  outputIndex: Data.Integer(),
});
export type OutputReference = Data.Static<typeof OutputReferenceSchema>;
export const OutputReference =
  OutputReferenceSchema as unknown as OutputReference;

export const CredentialSchema = Data.Enum([
  Data.Object({
    PublicKeyCredential: Data.Tuple([
      Data.Bytes({ minLength: 28, maxLength: 28 }),
    ]),
  }),
  Data.Object({
    ScriptCredential: Data.Tuple([
      Data.Bytes({ minLength: 28, maxLength: 28 }),
    ]),
  }),
]);
export type CredentialD = Data.Static<typeof CredentialSchema>;
export const CredentialD = CredentialSchema as unknown as CredentialD;

export const AddressSchema = Data.Object({
  paymentCredential: CredentialSchema,
  stakeCredential: Data.Nullable(
    Data.Enum([
      Data.Object({ Inline: Data.Tuple([CredentialSchema]) }),
      Data.Object({
        Pointer: Data.Tuple([
          Data.Object({
            slotNumber: Data.Integer(),
            transactionIndex: Data.Integer(),
            certificateIndex: Data.Integer(),
          }),
        ]),
      }),
    ])
  ),
});
export type AddressD = Data.Static<typeof AddressSchema>;
export const AddressD = AddressSchema as unknown as AddressD;

//NOTE: liqwid-plutarch-extra AssetClass version, not PlutusLedgerApi.V1.Value
export const AssetClassSchema = Data.Object(
  {
    symbol: Data.Bytes(),
    name: Data.Bytes(),
  },
  { hasConstr: false }
);
export type AssetClassD = Data.Static<typeof AssetClassSchema>;
export const AssetClassD = AssetClassSchema as unknown as AssetClassD;

// List [B "test",B "tn"]

export const ValueSchema = Data.Map(
  Data.Bytes(),
  Data.Map(Data.Bytes(), Data.Bytes())
);
export type Value = Data.Static<typeof ValueSchema>;
export const Value = ValueSchema as unknown as Value;

export const VestingDatumSchema = Data.Object({
  beneficiary: AddressSchema,
  assetClass: AssetClassSchema,
  totalVestingQty: Data.Integer(),
  vestingPeriodStart: Data.Integer(),
  vestingPeriodEnd: Data.Integer(),
  firstUnlockPossibleAfter: Data.Integer(),
  totalInstallments: Data.Integer(),
  vestingMemo: Data.Bytes(),
});
export type VestingDatum = Data.Static<typeof VestingDatumSchema>;

// stupid hack used everywhere to export types
export const VestingDatum = VestingDatumSchema as unknown as VestingDatum;

export const VestingRedeemerSchema = Data.Enum([
  Data.Literal("PartialUnlock"),
  Data.Literal("FullUnlock"),
]);
export type VestingRedeemer = Data.Static<typeof VestingRedeemerSchema>;
export const VestingRedeemer =
  VestingRedeemerSchema as unknown as VestingRedeemer;
