import { fromHex } from "@mysten/bcs";
import { EncryptedObject, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { KEY_SERVER_LIST_TESTNET, TESTNET_PACKAGES } from "./constants";
import { KEY_PAIR, sealClient, suiAddress, suiClient } from "./client";

export async function encryptDataUsingSDK(data: Uint8Array) {
  console.log("Encrypting data using SDK");
  //check if key server list is correct
  console.log("KEY_SERVER_LIST_TESTNET", KEY_SERVER_LIST_TESTNET);

  //checking key servers of seal client
  const keyServers = await sealClient.getKeyServers();
  console.log("Key Servers", keyServers);

  const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
    threshold: 2,
    packageId: TESTNET_PACKAGES.ALLOWLIST_PACKAGE_ID,
    id: TESTNET_PACKAGES.WHITELIST_ID,
    demType: 1,
    kemType: 0,
    data,
  });
  return encryptedBytes;
}

async function constructTxBytes(tx: Transaction, packageId: string, module: string, args: any[]) {
  tx.moveCall({
    target: `${packageId}::${module}::seal_approve`,
    arguments: [tx.pure.vector("u8", fromHex(args[0])), tx.object(args[0])],
  });
  return tx.build({ client: suiClient, onlyTransactionKind: true });
}

export async function decryptDataFromOnChain(encryptedBytes: Uint8Array) {
  console.log("Decrypting data from on chain");

  const encryptedObjectInformation = EncryptedObject.parse(encryptedBytes);
  console.warn("Encrypted Object", encryptedObjectInformation);

  const keyServersIdFromEncryptedObject = encryptedObjectInformation.services.sort((a, b) => a[1] - b[1]).map((service) => service[0]);
  console.log("Key servers from encrypted object", keyServersIdFromEncryptedObject);
  const keyServers = await sealClient.getKeyServers();
  const publicKeys = [keyServers.get(keyServersIdFromEncryptedObject[0]).pk, keyServers.get(keyServersIdFromEncryptedObject[1]).pk];
  console.log("publicKeys", publicKeys);

  const tx = new Transaction();
  const txBytes = await constructTxBytes(tx, TESTNET_PACKAGES.ALLOWLIST_PACKAGE_ID, "allowlist", [TESTNET_PACKAGES.WHITELIST_ID]);
  const sessionKey = await SessionKey.create({
    address: suiAddress,
    packageId: TESTNET_PACKAGES.ALLOWLIST_PACKAGE_ID,
    ttlMin: 10,
    signer: KEY_PAIR,
    suiClient,
  });
  const derivedKeys = await sealClient.getDerivedKeys({
    id: TESTNET_PACKAGES.WHITELIST_ID,
    txBytes,
    sessionKey,
    threshold: 2,
  });
  console.log("Derived keys are ready!!");
  const derivedKey0 = derivedKeys.get(keyServersIdFromEncryptedObject[0]);
  const derivedKey1 = derivedKeys.get(keyServersIdFromEncryptedObject[1]);
  const derivedKeysList: Array<Array<number>> = [Array.from((derivedKey0 as any).key.toBytes()), Array.from((derivedKey1 as any).key.toBytes())];
  console.log("derivedKeysList", derivedKeysList);
  const encryptedObject = tx.moveCall({
    target: `${TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::parse_encrypted_object`,
    arguments: [tx.pure.vector("u8", Array.from(encryptedBytes))],
  });
  console.log("Encrypted object is ready!!");
  tx.moveCall({
    target: `${TESTNET_PACKAGES.SEAL_PACKAGE_ID}::bf_hmac_encryption::decrypt`,
    arguments: [
      encryptedObject,
      tx.pure.vector("id", keyServersIdFromEncryptedObject),
      tx.pure.vector("vector<u8>", Array.from(publicKeys) as any),
      tx.pure.vector("vector<u8>", derivedKeysList as any),
    ],
  });
  return tx;
}

export async function decryptDataFromSDK(encryptedBytes: Uint8Array) {
  const encryptedObjectInformation = EncryptedObject.parse(encryptedBytes);
  const tx = new Transaction();
  const txBytes = await constructTxBytes(tx, TESTNET_PACKAGES.ALLOWLIST_PACKAGE_ID, "allowlist", [TESTNET_PACKAGES.WHITELIST_ID]);
  const sessionKey = await SessionKey.create({
    address: suiAddress,
    packageId: TESTNET_PACKAGES.ALLOWLIST_PACKAGE_ID,
    ttlMin: 10,
    signer: KEY_PAIR,
    suiClient,
  });
  try {
    await sealClient.fetchKeys({
      ids: [encryptedObjectInformation.id],
      txBytes,
      sessionKey,
      threshold: 2,
    });
  } catch (err) {
    console.log(err);
    return null;
  }

  try {
    // Note that all keys are fetched above, so this only local decryption is done
    const decryptedData = await sealClient.decrypt({
      data: encryptedBytes,
      sessionKey,
      txBytes,
      checkShareConsistency: true,
    });
    return decryptedData;
  } catch (err) {
    console.log(err);
    const errorMsg = err instanceof Error ? "No access to decryption keys" : "Unable to decrypt files, try again";
    console.error(errorMsg, err);
    return null;
  }
}
