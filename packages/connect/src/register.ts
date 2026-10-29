/**
 * The side-effect entry: `import '@flung.official/connect/register'` registers `<flung-connect>`. It is the only module
 * of the package with a side effect, and `sideEffects` in package.json names it, so a bundler keeps it and tree-shakes
 * the rest.
 */
import { defineFlungConnect } from './element/define.js'

defineFlungConnect()
