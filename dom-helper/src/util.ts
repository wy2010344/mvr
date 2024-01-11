
import { useComputed, useEffect, useMemo } from "mvr-helper";
import { emptyArray } from "wy-helper";


export function useGetUrl(file: File | Blob) {
  const url = useMemo(([file]) => {
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, emptyArray);
  return url;
}
