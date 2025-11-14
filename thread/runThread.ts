import { is } from '@libmedia/common'
import initClass from './initClass'
import initFunction from './initFunction'
import initModule from './initModule'

type AnyModule = {
  [key: string]: any
}

/**
 * 子线程运行入口方法
 * 
 * @param entity 
 */
export default function runThread(entity: (new (...args: any[]) => any) | ((...args: any[]) => any) | AnyModule) {
  if (is.func(entity) && entity.prototype?.constructor === entity) {
    initClass((args: any[]) => {
      return new (entity as new (...args: any[]) => any)(...args)
    })
  }
  else if (is.func(entity)) {
    initFunction((args: any[]) => {
      return entity(...args)
    })
  }
  else {
    initModule(entity)
  }
}
