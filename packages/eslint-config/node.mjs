import { createTypeScriptConfig, ignoreConfig, nodeGlobals } from './internal.mjs'

export default [
  ignoreConfig,
  createTypeScriptConfig({
    name: 'popecho/node',
    runtimeGlobals: nodeGlobals,
  }),
]
