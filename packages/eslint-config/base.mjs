import { browserGlobals, createTypeScriptConfig, ignoreConfig } from './internal.mjs'

export default [
  ignoreConfig,
  createTypeScriptConfig({
    name: 'popecho/base',
    runtimeGlobals: browserGlobals,
  }),
]
