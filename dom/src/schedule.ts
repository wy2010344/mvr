import { GetAstNextTimeWork } from "mvr-core"
import { EmptyFun } from "wy-helper"

export const getTime = () => performance.now()
const canPromise = typeof Promise !== 'undefined' && window.queueMicrotask
const canMessageChannel = typeof MessageChannel !== 'undefined'
function runMacroTask(fun: EmptyFun) {
  if (canMessageChannel) {
    /**
     * MessageChannel是一个宏任务,
     * 先于setTimeout,
     * 次于requestAnimationFrame
     */
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = fun
    return port2.postMessage(null)
  }
  return setTimeout(fun)
}
function runMicroTask(fun: EmptyFun) {
  if (canPromise) {
    queueMicrotask(fun)
  }
  return runMacroTask(fun)
}

let startSyncTask = false
const syncTasks: EmptyFun[] = []
function runTaskSync(fun: EmptyFun) {
  syncTasks.push(fun)
  if (!startSyncTask) {
    startSyncTask = true
    let task = syncTasks.pop()
    while (task) {
      task()
      task = syncTasks.pop()
    }
    startSyncTask = false
  }
}

function runTask(fun: EmptyFun) {
  runMacroTask(fun)
}

export function getScheduleAskTime({
  taskTimeThreadhold = 5
}: {
  taskTimeThreadhold?: number
}): GetAstNextTimeWork {
  return function (askNextWork) {
    let onWork = false
    /**
     * 执行queue中的任务
     * 本次没执行完,下次执行.
     * 下次一定需要在宏任务中执行
     */
    const flush = () => {
      const deadline = getTime() + taskTimeThreadhold
      let callback = askNextWork()
      while (callback) {
        if (callback.isRender) {
          //主要是保证每次render与上一次render必然在不同的任务,不需要requestAnimationFrame,直接调用宏任务
          runTask(() => {
            (callback as any)!()
            flush()
          })
          break;
        } else {
          if (getTime() < deadline) {
            callback()
            callback = askNextWork()
          } else {
            //需要中止,进入宏任务.原列表未处理完
            runTask(flush)
            break
          }
        }
      }
      if (!callback) {
        onWork = false
      }
    }
    return function () {
      if (!onWork) {
        onWork = true
        runTask(flush)
      }
    }
  }
}