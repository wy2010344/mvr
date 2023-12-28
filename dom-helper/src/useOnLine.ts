import { emptyArray } from "wy-helper";
import { useEffect, useModelState } from "mvr-helper"


export function useOnLine() {
  const [onLine, setOnLine] = useModelState(navigator.onLine)
  useEffect(() => {
    function onLineFun() {
      setOnLine(true)
    }
    function offLineFun() {
      setOnLine(false)
    }
    window.addEventListener("online", onLineFun)
    window.addEventListener("offline", offLineFun)
    return function () {
      window.removeEventListener("online", onLineFun)
      window.removeEventListener("offline", offLineFun)
    }
  }, emptyArray)
  return onLine
}