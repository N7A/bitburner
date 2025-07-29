import { getJsScripts } from 'workspace/synchronize/change-extension'

export async function main(ns: NS) {
    getJsScripts(ns).forEach(x => {
        const newPath = x.substring(0, x.lastIndexOf('.js')) + '.ts';
        ns.tprint(`${ns.fileExists(newPath) ? 'WARN' : 'SUCCESS'}`, ' ', `${x} -> ${newPath}`)
    });
}