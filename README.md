# vesting-offchain
Basic Vesting Contracts - APL
# Vesting n$token — versión sin comisiones ni dependencias

Este repositorio es un **fork modificado** del SDK original de Anastasia Labs (`linear-vesting-offchain`) con los siguientes objetivos:

- Eliminar por completo cualquier tipo de comisión o fee.
- Sustituir dependencias de terceros (como `@lucid-evolution/lucid`) por librerías públicas (`lucid`).
- Permitir que los beneficiarios interactúen directamente con el contrato desde su nodo local, sin custodios ni servicios externos.
- Mantener el contrato inmutable y verificable por hash durante los 36 meses del vesting.

---

## ✅ Cambios realizados

| Concepto | Modificación |
|----------|--------------|
| Comisión (`PROTOCOL_FEE`) | Se fijó en `0` |
| Claves de fee | Eliminadas del código (`PROTOCOL_PAYMENT_KEY`, `PROTOCOL_STAKE_KEY`) |
| Lógica de pago a terceros | Eliminada completamente (`payToAddress(...)`) |
| Dependencia `lucid-evolution` | Sustituida por `lucid` oficial |
| Nombre del paquete | Cambiado a `@metera/vesting-offchain` |
| Publicación | Repo privado (no disponible como NPM package) |

---

## 🔒 Seguridad y validación

Este contrato se compila **una sola vez**, y genera un **hash de script** que define la dirección donde se bloquean los fondos.  
**Cualquier recompilación genera una dirección diferente.**

Por eso es crítico conservar los siguientes archivos:

| Archivo | Propósito |
|---------|----------|
| `linearVesting.plutus` | Código CBOR del validador |
| `script.addr` | Dirección de contrato generada con ese CBOR |
| `validator.hash` | Hash de script (`PlutusScriptV2`) calculado desde `linearVesting.plutus` |

---

## 🧪 Cómo verificar que el contrato es válido

Desde un entorno con `cardano-cli` (v8.20+):

```bash
# Validar que el archivo CBOR no fue alterado
sha256sum linearVesting.plutus     # Debe coincidir con el hash compartido

# Generar el hash del script
cardano-cli transaction policyid --script-file linearVesting.plutus

# Opcional: Ver la dirección de script
cardano-cli address build \
  --payment-script-file linearVesting.plutus \
  --testnet-magic 2 \
  --out-file script.addr
