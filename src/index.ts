import { SuiTransactionBlockResponse } from "@mysten/sui/dist/cjs/client";
import { KEY_PAIR, suiClient } from "./client";
import { decryptDataFromOnChain, decryptDataFromSDK, encryptDataUsingSDK } from "./seal";

async function main() {
  const encryptedBytes = await encryptDataUsingSDK(new Uint8Array([1, 2, 3]));
  console.log("Encrypted Bytes", encryptedBytes);
  const tx = await decryptDataFromOnChain(encryptedBytes);
  const result = await suiClient.signAndExecuteTransaction({
    signer: KEY_PAIR,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  await suiClient.waitForTransaction({
    digest: result.digest,
    options: {
      showEffects: true,
      showInput: false,
      showEvents: false,
      showObjectChanges: true,
      showBalanceChanges: false,
    },
  });

  const txn: SuiTransactionBlockResponse = await suiClient.waitForTransaction({
    digest: result.digest,
    options: {
      showEffects: true,
      showInput: false,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: false,
    },
  });
  console.log(result.digest);
  txn.events?.forEach((event) => {
    console.log(event);
  });

  //decrypt data from SDK
  const decryptedData = await decryptDataFromSDK(encryptedBytes);
  console.log("Decrypted data", decryptedData);
}

main();
