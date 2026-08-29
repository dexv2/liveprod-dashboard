import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return nextResolve(specifier, context);
  const base = specifier.startsWith("@/")
    ? path.resolve(process.cwd(), specifier.slice(2))
    : path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
