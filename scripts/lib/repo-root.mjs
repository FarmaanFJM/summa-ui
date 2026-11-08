// The repository root as a filesystem path, from a script's `import.meta.url`.
//
// `new URL('..', import.meta.url).pathname` is not a path: on Windows it is `/C:/Users/me/summa-ui/`, and joining that
// produces `C:\C:\Users\...`. `fileURLToPath` converts correctly on every platform (drive letters, UNC, percent-encoding).
// `options.windows` forces the Windows (or POSIX) conversion rules, for tests that run on another platform.
import { fileURLToPath } from 'node:url'

export const repoRoot = (metaUrl, options) => fileURLToPath(new URL('..', metaUrl), options)
