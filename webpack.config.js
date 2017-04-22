import { webConfig, nodeConfig, lessConfig } from './webpack.config.base.js'

const config1 = webConfig()

const config2 = webConfig()
config2.externals = ['fs', 'd3']
config2.output.filename = '[name].slim.js'

const config3 = nodeConfig()

const config4 = lessConfig()

export default [config1, config2, config3, config4]
