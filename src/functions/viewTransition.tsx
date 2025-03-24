import { Checkbox } from "../components/controls/Checkbox";
import { useLocalStorage } from "../hooks/useLocalStorage";

const supports = !!document.startViewTransition;

const stored = localStorage.getItem('enableTransitions');
let enableTransitions = stored && stored !== 'false';

export function ToggleViewTransitions() {
    const [on, setOn] = useLocalStorage('enableTransitions', enableTransitions);

    function toggle(on) {
        enableTransitions = on;
        setOn(on);
    }

    return (
      <Checkbox
        title="Enable view transitions on navigation and UI layout changes. Some interactions will still not animate because they're too fast for view transitions."
        controls={[on, toggle]}
      >
        View transitions
      </Checkbox>
    );
}

export function toggleViewTransitions(on: boolean) {
    enableTransitions = on;
}

export function viewTransitionsEnabled() {
    return enableTransitions;
}

function actuallyDoTransition(changeDom) {
    document.startViewTransition(changeDom);
}

function performChangesDirectly(changeDom) {
    changeDom();
}

export const doTransition =
    supports
        ? (changeDom => enableTransitions ? actuallyDoTransition(changeDom) : performChangesDirectly(changeDom))
        : performChangesDirectly;
