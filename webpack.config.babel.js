import nodeExternals from 'webpack-node-externals'

import { jsConfig } from './webpack.config.base'

const config = jsConfig()

const coreConfig = jsConfig()
coreConfig.externals = [nodeExternals()]
coreConfig.output.filename = '[name].core.js'

export default [config, coreConfig]
