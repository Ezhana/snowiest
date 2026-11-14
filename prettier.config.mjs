import config from '@ezhana/prettier-config'
import * as astro from 'prettier-plugin-astro'

export default {
  ...config,
  plugins: [astro],
}
