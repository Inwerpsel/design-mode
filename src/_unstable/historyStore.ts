import { createTimeline,  initialStates, interestingKeys, restorePins, restoreOffset, setStates } from "../hooks/useResumableReducer";
import { use } from "../state";

let db;
const DBOpenRequest = window.indexedDB.open('history', 1);

const ACTIONS = 'actions';

DBOpenRequest.onupgradeneeded = function(event) { 
    const db = event.target.result;

    db.onerror = function(event) {
        console.log('upgrade failed', event);
    };

    db.createObjectStore(ACTIONS, { autoIncrement: true });  
};

const snapshotKey = 'history-start-snapshot';

let snapshot = JSON.parse(localStorage.getItem(snapshotKey));

let i = 0;
let needsSnapshot: boolean;
DBOpenRequest.onsuccess = function (event) {
    // Quick fix to exclude frame
    if (window.self !== window.top) return;
    db = DBOpenRequest.result;
};

export function restoreHistory() {
    if (window.self !== window.top) return;
    const transaction = db.transaction([ACTIONS], 'readonly');
    const store = transaction.objectStore(ACTIONS);

    store.getAll().onsuccess = event => {
        const records = event.target.result;
        setStates(new Map(snapshot));

        createTimeline(records);

        needsSnapshot = i === 0;
        restorePins();
        restoreOffset();
    };
}

export let firstEntry = Infinity;

// problem:
// - If an action was done against a locked state, we need to keep track of this base index
//   so that it can be applied when replaying.
export function storeActions(actions: [string, any][], clearFuture, index): void {
    if (needsSnapshot) {
        // Quick way to exclude dynamic keys, which would cause initial state to keep growing.
        const snap = JSON.stringify([...initialStates.entries()].filter(([k]) => use.hasOwnProperty(k)));
        localStorage.setItem(snapshotKey, snap);
        localStorage.setItem('originalUrl', window.location.href);
        needsSnapshot = false;
        snapshot = snap;
    }
    const transaction = db.transaction([ACTIONS], 'readwrite');
    const store = transaction.objectStore(ACTIONS);

    if (clearFuture) {
        const range = IDBKeyRange.lowerBound(index);
        store.delete(range);
    }

    // Mark start of session by adding url to first action data.
    if (index <= firstEntry) {
        actions[0].push(window.location.href);
        firstEntry = index;
    }
    store.put(actions, index);
}

export function deleteStoredHistory(createSnap = false, lastState = null) {
    const start = performance.now()
    const transaction = db.transaction([ACTIONS], 'readwrite');
    transaction.oncomplete = e => { console.log('Deleted store in', performance.now( ) - start) }
    const store = transaction.objectStore(ACTIONS);

    store.clear();
    localStorage.removeItem(snapshotKey);

    if (lastState) {
        // Use interesting part of current state as snapshot.
        const snap = JSON.stringify([...lastState.entries()].filter(([k]) => interestingKeys.includes(k)));
        localStorage.setItem(snapshotKey, snap); 
    }
    firstEntry = Infinity;

    // console.log('Start store delete transaction in ', performance.now( ) - start) 
}