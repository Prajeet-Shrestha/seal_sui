import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiObjectChangePublished } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { execSync } from "child_process";
import { KEY_PAIR, suiClient } from "../../src/client";

function milisecondsToHms(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor(((ms % 3600000) % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}
function sleep(ms: number) {
  console.log("[🕐]-------[TAKING REST IN-BETWEEN WORK IS IMPORTANT]----[🕐]");
  console.log(`[⏳][${milisecondsToHms(ms)}][⏳]`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const deploySealPackage = async () => {
  let Digest = "";
  let PackageId = "";

  try {
    const packagePath = process.cwd();
    const targetPath = packagePath;
    console.log(targetPath);
    // return;

    const { modules, dependencies } = JSON.parse(
      execSync(`sui move build --dump-bytecode-as-base64 --path ${targetPath} --skip-fetch-latest-git-deps`, {
        encoding: "utf-8",
      })
    );

    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules,
      dependencies,
    });
    tx.transferObjects([upgradeCap as any], tx.pure.address("0xb743cafeb5da4914cef0cf0a32400c9adfedc5cdb64209f9e740e56d23065100"));

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
    await sleep(20000);
    console.log(result.digest);
    Digest = result.digest;

    if (!Digest) {
      console.log("Digest is not available");
      return { PackageId };
    }

    await sleep(30000);
    const txn = await suiClient.getTransactionBlock({
      digest: String(Digest),
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    PackageId = ((txn.objectChanges?.filter((a) => a.type === "published") as SuiObjectChangePublished[]) ?? [])[0].packageId as string;
    console.log({ PackageId });
  } catch (error) {
    console.error(error);
    return;
  }
};

deploySealPackage();
