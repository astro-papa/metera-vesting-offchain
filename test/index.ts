import {addNum, Emulator, Lucid} from "cherrylend-offchain"
import {generateAccountSeedPhrase} from "./utils.js"

console.log(addNum(1, 2))


const run = async () => {
  console.log("[INFO]: Init Emulator")
  const users = {
    account1: await generateAccountSeedPhrase({
      lovelace: BigInt(10000000),
    })
  }
  console.log("[INFO]: User account \n")
  console.log(users)

  const emulator = new Emulator([
    users.account1,
  ])

  const lucid = await Lucid.new(emulator)

  lucid.selectWalletFromSeed(users.account1.seedPhrase)
}

run()
