/** Workaround for the way React 18's StrictMode double fires `useEffect()` in dev mode.
 * 
 * It's nice to adopt StrictMode, but we need to use mapbox-gl, and this has a legacy 
 * .once() event handler that doesn't play nice with React 18. 
 * 
 * Only affects devmode, in prod mode it fires once like in React 17.
 * 
 * @see https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e
*/


import { useRef, useState, useEffect } from 'react';

export const useEffectOnce = (effect: () => void | (() => void)) => {
  const destroyFunc = useRef<void | (() => void)>();
  const effectCalled = useRef(false);
  const renderAfterCalled = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setVal] = useState<number>(0);

  if (effectCalled.current) {
    renderAfterCalled.current = true;
  }

  useEffect(() => {
    // only execute the effect first time around
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    // this forces one render after the effect is run
    setVal((val) => val + 1);

    return () => {
      // if the comp didn't render since the useEffect was called,
      // we know it's the dummy React cycle
      if (!renderAfterCalled.current) {
        return;
      }
      if (destroyFunc.current) {
        destroyFunc.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};