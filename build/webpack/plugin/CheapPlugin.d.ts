
export interface CheapPluginOptions {
  name?: string
  env?: 'node' | 'browser'
  tmpPath?: string
  projectPath?: string
  cheapSourcePath?: string
  formatIdentifier?: boolean
  module?: string
  exclude?: RegExp | RegExp[]
  defined?: Record<string, any>
  cheapPacketName?: string
  threadFiles?: { file: string }[]
}

export default class CheapPlugin {
  constructor(options: CheapPluginOptions)
}
