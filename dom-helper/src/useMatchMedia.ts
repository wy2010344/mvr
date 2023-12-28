import { useEffect, useModelState } from "mvr-helper";


export function useMatchMedia(pattern: string) {
  const [matchMedia, setMatchMedia] = useModelState(true);
  useEffect(() => {
    function heightChange(ev: MediaQueryListEvent) {
      setMatchMedia(ev.matches);
    }
    const match = window.matchMedia(pattern);
    setMatchMedia(match.matches);
    match.addEventListener("change", heightChange);
    return () => {
      match.removeEventListener("change", heightChange);
    };
  }, [pattern]);
  return matchMedia;
}