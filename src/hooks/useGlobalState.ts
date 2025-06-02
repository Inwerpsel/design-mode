import { useInsertionEffect, useState } from "react";
import { StateAndUpdater } from "./useResumableReducer";

type SetsOfDispatchers = {
    [key: string]: Set<(...arg: any) => void>
}

const states = new Map<string, any>();
const setters = new Map<string, any>();
const initializers = {};
const dispatchers: SetsOfDispatchers = {};

// This is a version of useLocalStorage, where simply all code related to storing was removed.
// Not sure if it's the best way to do global state.
export function useGlobalState<T>(key: string, defaultValue: T, debug = (v) => {}): StateAndUpdater<T> {
  const isRepeat = initializers.hasOwnProperty(key);

  const initializer = isRepeat ? initializers[key] : () => {
    if (states.has(key)) {
      return states.get(key);
    }
    states.set(key, defaultValue);
    dispatchers[key] = new Set();

    setters.set(key, arg => {
      debug(arg);
      const previous = states.get(key);
      const newValue = typeof arg === 'function' ? arg(previous) : arg;
      if (newValue === previous) {
        return;
      }
      states.set(key, newValue);
      for (const setValue of dispatchers[key].values()) {
        setValue(newValue);
      }
    });

    return defaultValue;
  }

  if (!isRepeat) {
    initializers[key] = initializer;
  }

  const [value, setValue] = useState(initializer);

  // Insertion effect as the dispatchers should be usable (or gone) for all subsequent effects.
  useInsertionEffect(() => {
    dispatchers[key].add(setValue);
    return () => {
      dispatchers[key].delete(setValue);
    }
  }, []);

  return [
    value,
    setters.get(key),
  ];
};

const effectsDone = new Set<string>();

// Todo: TypeScript
export function readSyncGlobal(key: string) {
  return states.get(key);
}

export function useUniqueEffect(key: string, effect: (value: any) => void) {
    if (effectsDone.has(key)) return;
    effect(states.get(key));
    dispatchers[key].add(effect);
    effectsDone.add(key);
}