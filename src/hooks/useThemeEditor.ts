import {reducerOf} from '../functions/reducerOf';
import { useDispatcher, useResumableReducer } from './useResumableReducer';
import { definedValues } from '../functions/collectRuleVars';

// const PROP_REGEX = /\w+(-\w+)*$/;
export const PSEUDO_REGEX = /--?(active|focus|visited|hover|disabled)--?/;

const sortObject = o => Object.keys(o).sort().reduce((sorted, k) => {
  sorted[k] = typeof o[k] === 'object' ? sortObject(o[k]): o[k];
  return sorted;
}, {});

const DEFAULT_STATE = {
  scopes: {},
  // previewProps: {},
  // previewPseudoVars: {},
  // changeRequiresReset: false,
};

export const ROOT_SCOPE = ':root';

// type Handler = (state: typeof DEFAULT_STATE, action: { [index: string]: any }) => typeof DEFAULT_STATE;

export const ACTIONS = {
  set: (state, { name, value, scope = ROOT_SCOPE }) => {
    const {
      scopes,
    } = state;

    if (name === '') {
      return state;
    }

    const {...newScopes} = scopes;
    newScopes[scope] = { ...(scopes[scope] || {}), [name]: value }; 

    return {
      ...state,
      // changeRequiresReset : false,
      scopes: newScopes,
    };
  },
  unset: (state, { name, scope = ROOT_SCOPE }) => {
    const { scopes } = state;

    if (!(scopes[scope] && name in scopes[scope])) {
      return state;
    }

    const {[scope]: old} = scopes;

    // Apply updates the first time they are read.
    const {
      [name]: oldValue,
      ...others
    } = old;

    return {
      ...state,
      // changeRequiresReset : false,
      scopes: {
        ...scopes,
        [scope]: others,
      },
    };
  },
  // If the exact same payload is dispatched again, it makes sense for some state
  // to "stick to" the payload during the first dispatch.
  // It can safely be assumed that if the same payload object gets dispatched a second time,
  // it's because history is being kept of these actions.
  // Since we're dealing with looping many entries to generate a unique name by suffixing it,
  // it's much safer to ensure this behavior only happens on new actions, not on replaying history.
  // As a bonus, this "internal state" can be used in the history view to drag and drop the newly created
  // alias, which is not really possible otherwise.
  createAlias(state, payload) {
    const {name: origName, value, generatedName} = payload;

    let name;
    if (generatedName) {
      name = generatedName;
    } else {
      name = `--${origName.replaceAll(' ', '-')}`;
      let i = 0;
      function scopeUsesForOther(vars) {
          return vars.hasOwnProperty(name) && vars[name] !== value;
      }

      function nameUsedForOtherValue() {
        const usedInSource = Object.values(definedValues).some(scopeUsesForOther);

        return usedInSource || Object.values(state.scopes).some(scopeUsesForOther);
      }

      while (nameUsedForOtherValue()) {
        i++;
        name = `--${origName.replaceAll(' ', '-')}-${i}`;
      }
      // Store the name for history and later replays of same payload object.
      payload.generatedName = name;
    }

    const newVarString = `var(${name})`;
    const newScopes = {};

    // Replace source
    let hasRoot = false;
    for (const selector of Object.keys(definedValues)) {
      for (const [k, v] of Object.entries(definedValues[selector])) {
        if (v === value) {
          if (!newScopes.hasOwnProperty(selector)) {
            newScopes[selector] = {}
          }
          newScopes[selector][k] = newVarString;
        }
      }
    }

    // Replace in editor state
    for (const selector in state.scopes) {
      if (!newScopes[selector]) {
        newScopes[selector] = {};
      }
      const scopeVars = state.scopes[selector];

      for (const varName in scopeVars) {
        const isSameValue = scopeVars[varName] === value;
        newScopes[selector][varName] = isSameValue
          ? newVarString
          : scopeVars[varName];
      }

      if (selector === ROOT_SCOPE) {
        newScopes[selector][name] = value;
        hasRoot = true;
      }
    }

    if (!hasRoot) {
      if (!newScopes[ROOT_SCOPE]) {
        newScopes[ROOT_SCOPE] = {};
      }
      newScopes[ROOT_SCOPE][name] = value;
    }

    return {
      ...state,
      scopes: newScopes,
    }
  },

  // The code below was partially coupled to a naming scheme.
  // This made it less reusable, I want to ideally find another way to achieve
  // similar functionality just using selectors. Perhaps supporting multiple naming schemes is an option too.
  // Commented out because it doesn't work with scoped properties.

//  startPreview: (state, { name, value }) => {
//     return {
//       ...state,
//       previewProps: {
//         ...state.previewProps,
//         [name]: value,
//       }
//     };
//   },
//   endPreview: (state, { name }) => {
//     const {
//       [name]: previewedValue,
//       ...otherProps
//     } = state.previewProps;

//     if (
//       !(name in state.theme)
//       && !Object.keys(state.previewPseudoVars).some(s => s.replace(PSEUDO_REGEX, '--') === name)
//     ) {
//       keysToRemove.push(name)
//     }
//     return {
//       ...state,
//       previewProps: { ...otherProps },
//     };
//   },
//   startPreviewPseudoState: (state, { name }) => {
//     const element = name.replace(PSEUDO_REGEX, '--').replace(/\w+(-\w+)*$/, '');

//     const pseudoState = (name.match(PSEUDO_REGEX) || [null])[0];

//     return {
//       ...state,
//       previewPseudoVars: {
//         ...state.previewPseudoVars,
//         [element]: pseudoState,
//       },
//     };
//   },
//   endPreviewPseudoState: (state, { name }) => {
//     const elementToEnd = name.replace(PSEUDO_REGEX, '--').replace(PROP_REGEX, '');

//     const {
//       [elementToEnd]: discard,
//       ...otherPseudos
//     } = state.previewPseudoVars;

//     Object.keys(state.defaultValues).forEach(k => {
//       const withoutElement = k.replace(elementToEnd, '');

//       if (withoutElement.replace(PROP_REGEX, '') !== '') {
//         return;
//       }

//       if (!(k in state.theme)) {
//         keysToRemove.push(k);
//       }
//       // Unset the regular property so that it gets set again.
//       lastWritten[k] = null;
//     });

//     return {
//       ...state,
//       previewPseudoVars: otherPseudos,
//     };
//   },
  loadTheme: (state, { theme = {} }) => {
    const isNewTheme = 'scopes' in theme;

    return {
      ...state,
      scopes: isNewTheme ? theme.scopes : {
        [ROOT_SCOPE]: theme,
      },
      // changeRequiresReset : true,
    };
  },
};

const reducer = reducerOf<typeof DEFAULT_STATE>(ACTIONS);

export function useThemeEditor() {
  return useResumableReducer(
    reducer,
    DEFAULT_STATE,
    null,
    'themeEditor'
  );
};

// A function that returns the themeEditor dispatcher only, without listening.
// Doing this locally, but would be nice to have a catch all way with proper types.
const dispatcher = useDispatcher('themeEditor');
export function editTheme() {
  return dispatcher;
}


// INCOMPLETE
type A = typeof ACTIONS;
type S = typeof DEFAULT_STATE;

type Effects = {
  [K in keyof A]: (prevState: S, nextState: S, action: Parameters<A[K]>[1]) => void;
}

// I guess it needs 2 way lookup.
// referredVar > selector > variables (that reference it)
const references = new Map<string, Map<string, Set<string>>>();
// referringVar > selector > variable
const sources = new Map<string, Map<string, string>>();

function initReference(selector: string, from: string, to: string) {

  if (!references.has(to)) {
    const refsMap = new Map();
    refsMap.set(selector, new Set());
    references.set(to, refsMap);
  } else {
    const selectors = references.get(to)
    if (!selectors.has(selector)) {
      selectors.set(selector, new Set());
    }
  }

  if (!sources.has(from)) {
    const map = new Map();
    map.set(selector, to);
    sources.set(from, map)
  } else {
    sources.get(from).set(selector, to);
  }
}

function getReference(value: string) {
  const varMatches = value && value.match(/^var\(\s*(\-\-[\w-]+)\s*[\,\)]/);    
  if (varMatches) {
    return varMatches[1];
  }
  return null;
}

// Incrementally update references along with state.
// open question: define apply and unapply handlers? Or one way handler only and keep results in memory.
// First approach would work with a single copy of the map, but requires a lot of updates when history changes.
// Second approach is overall much simpler, but would probably incur a max length on history.
export const refsHandlers: Effects = {
  set(prevState, nextState, action) {
    const {scope = ROOT_SCOPE, name, value} = action;
    // existing reference was maybe removed
    const selectors = sources.get(name);
    if (selectors && selectors.has(scope)) {
      selectors.delete(scope);
    }

    if (prevState.scopes.hasOwnProperty(scope)) {
      const prevValue = prevState.scopes[scope][name];
      const prevReferencedName = getReference(prevValue);
      // console.log(prevReferencedName)
      if (prevReferencedName) {
        references.get(prevReferencedName).get(scope).delete(name);
        sources.get(name).delete(scope);
      }
    }

    // new reference was maybe added
    const referencedName = getReference(value);

    if (referencedName) {
      initReference(scope, name, referencedName);
      references.get(referencedName).get(scope).add(name);
      sources.get(name).set(scope, referencedName);
    }
    // console.log(
    //   [...sources.entries()].map(([k,v]) => [k, [...v.entries()]]), 
    //   [...references.entries()].map(([k,v]) => [k, [...v.entries()].map(([k,v]) => [k, [...v.values()]])]),
    //   action );
  },
  unset(prevState, nextState, action) {
    // added reference is maybe removed
    // default reference is maybe restored
  },
  createAlias(prevState, nextState, action) {
    // new reference for each substitution

  },
  loadTheme(prevState, nextState, action) {
    // references can completely change, so load from scratch as initially
  },
};