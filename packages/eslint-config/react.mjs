import { browserGlobals, createTypeScriptConfig, ignoreConfig } from './internal.mjs'

export default [
  ignoreConfig,
  createTypeScriptConfig({
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: 'popecho/react',
    runtimeGlobals: browserGlobals,
  }),
]
