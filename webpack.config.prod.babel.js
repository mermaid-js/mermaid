import { jsConfig } from './webpack.config.base'

const minConfig = jsConfig()
minConfig.mode = 'production'
minConfig.output.filename = '[name].min.js'

export default [minConfig]
