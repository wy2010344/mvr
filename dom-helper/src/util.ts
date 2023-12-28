import { useComputed } from "mvr-core";
import { useEffect } from "mvr-helper";
import { emptyArray } from "wy-helper";


export function useGetUrl(file: File | Blob) {
  const url = useComputed(([file]) => {
    return URL.createObjectURL(file);
  }, () => [file])();
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, emptyArray);
  return url;
}
