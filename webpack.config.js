import nodeExternals from 'webpack-node-externals'

import { jsConfig, lessConfig } from './webpack.config.base'

const config = jsConfig()

const coreConfig = jsConfig()
coreConfig.externals = [nodeExternals(), 'fs']
coreConfig.output.filename = '[name].core.js'

const cssConfig = lessConfig()

export default [config, coreConfig, cssConfig]
