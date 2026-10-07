import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { isIP } from "node:net";
import { storeMedia } from "./media";
import { StudioError } from "./studio/http";

function publicAddress(address: string) {
  if (isIP(address) === 4) {
    const [a,b] = address.split(".").map(Number);
    return a > 0 && a < 224 && ![10,127].includes(a) && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && [0,168].includes(b)) && !(a === 100 && b >= 64 && b <= 127) && !(a === 198 && [18,19].includes(b));
  }
  return /^2[0-9a-f]{3}:/i.test(address) && !/^200[12]:/i.test(address);
}
export async function importRemoteMedia(value: string, kind: "image" | "video" | "audio", name = "Generated media") {
  const url = new URL(value);
  if (!["http:","https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80","443"].includes(url.port))) throw new StudioError("Only public HTTP(S) media can be imported.");
  const addresses = await lookup(url.hostname, { all: true }).catch(() => { throw new StudioError("Media host could not be resolved.", 502); });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new StudioError("Private or reserved network destinations cannot be imported.");
  const chosen = addresses.find(item => item.family === 4) || addresses[0];
  const limitMb = Number(process.env.SPARKLE_MAX_GENERATED_MEDIA_MB || 20);
  if (!Number.isInteger(limitMb) || limitMb < 1 || limitMb > 200) throw new StudioError("Invalid generated media size limit.",503);
  const limit = limitMb * 1024 * 1024;
  const result = await new Promise<{ bytes: Buffer; type: string }>((resolve,reject) => {
    const make = url.protocol === "https:" ? httpsRequest : httpRequest;
    const request = make(url, {
      // Pin the checked IP while retaining TLS hostname verification; DNS cannot change during connection.
      ...{ autoSelectFamily: false }, lookup: (_host,_options,callback) => callback(null,chosen.address,chosen.family),
      signal: AbortSignal.timeout(120000), headers: { Accept: `${kind}/*` },
    }, response => {
      if (response.statusCode !== 200 || Number(response.headers["content-length"] || 0) > limit) { response.destroy(); reject(new StudioError("Media response was redirected, unsuccessful or too large.",502)); return; }
      const type = String(response.headers["content-type"] || "").split(";")[0];
      if (!type.startsWith(`${kind}/`)) { response.destroy(); reject(new StudioError("Remote media type does not match the requested asset.",502)); return; }
      const chunks: Buffer[] = []; let total = 0;
      response.on("data", chunk => { total += chunk.length; if (total > limit) response.destroy(new StudioError("Remote media exceeds the configured size limit.",413)); else chunks.push(chunk); });
      response.on("error",reject); response.on("end",() => resolve({ bytes: Buffer.concat(chunks),type }));
    });
    request.on("error",() => reject(new StudioError("Media download failed or timed out. The generation itself was not resubmitted.",502))); request.end();
  });
  return storeMedia(name,result.type,result.bytes,limit);
}
export async function archiveOutput(url: string, kind: "image" | "video") {
  if (process.env.SPARKLE_ARCHIVE_OUTPUTS === "false") return { url };
  try { return { url: (await importRemoteMedia(url,kind,`Generated ${kind}`)).url }; }
  catch { return { url, warning: "Generated output remains on the provider host because archiving failed. Import it into My assets before the provider link expires; no generation was retried." }; }
}
