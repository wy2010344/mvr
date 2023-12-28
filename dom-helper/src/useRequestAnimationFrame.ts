import { EmptyFun, emptyArray } from "wy-helper";
import { useEffect } from "mvr-helper"
export function useRequesetAnimationFrame(run: EmptyFun) {
  useEffect(() => {
    let open = true;
    function callback() {
      run();
      if (open) {
        requestAnimationFrame(callback);
      }
    }
    requestAnimationFrame(callback);
    return function () {
      open = false;
    };
  }, emptyArray);
}

