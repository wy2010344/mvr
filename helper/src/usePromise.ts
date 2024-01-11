import { VersionPromiseResult } from "wy-helper"
import { useModelValue } from "./useModelState"
import { useEvent } from "./useEvent"




/**
 * 阻塞的请求,并带有状态
 * 设值只通过promise,所以从视图上获得值?
 * @param effect 
 * @returns 
 */
export function useMutationState<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const versionLock = useModelValue(0)
  const data = useModelValue<VersionPromiseResult<Res>>()
  return [useEvent(function (...vs: Req) {
    if ((data.value?.version || 0) != versionLock.value) {
      return
    }
    const version = versionLock.value++
    return effect(...vs).then(res => {
      data.value = ({ type: "success", value: res, version })
    }).catch(err => {
      data.value = ({ type: "error", value: err, version })
    })
  }), data.readonly, versionLock.readonly] as const
}
