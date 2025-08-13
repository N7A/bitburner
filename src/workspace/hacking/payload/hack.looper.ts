export async function main(ns: NS) {
  //#region input parameters
  var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname()
  //#endregion input parameters

  while (true) {
    await ns.hack(targetHost);
  }
}