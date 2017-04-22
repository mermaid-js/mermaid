import { webConfig, nodeConfig, lessConfig } from './webpack.config.base.js'

const config = webConfig()

const slimConfig = webConfig()
slimConfig.externals = ['fs', 'd3']
slimConfig.output.filename = '[name].slim.js'

const apiConfig = nodeConfig()

const cssConfig = lessConfig()

export default [config, slimConfig, apiConfig, cssConfig]
