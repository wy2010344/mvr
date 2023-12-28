import { useModelState } from "./useModelState";
/**
 * 如果更细化定制,是否是初始化参数,步进?
 * @returns 
 */
export function useVersion(init = 0) {
  const [version, setVersion, getVersion] = useModelState(0);
  return [version, function () {
    setVersion(getVersion() + 1)
  }, getVersion] as const
}