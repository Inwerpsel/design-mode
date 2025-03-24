import React, { useState } from 'react';
import { get, use } from "../../state";


function EditNote({setReadonly}) {
  const [note, setNote] = use.note();

  return (
    <textarea
      style={{ fontSize: '1.2rem', minHeight: 160 }}
      autoFocus
      onBlur={() => {
        setReadonly(true);
      }}
      value={note}
      onInput={(e) =>
        setNote(e.target.value, { debounceTime: Infinity, skipHistory: true })
      }
    />
  );
}

export function NoteBox() {
  const { note } = get;
  const [readonly, setReadonly] = useState(true);

  if (!readonly) {
    return <EditNote {...{setReadonly}}/>;
  }

  const activate = () => setReadonly(false);
  if (note === '') {
    return <button onClick={activate}>
      Note
    </button>
  }
  return (
    (<div
      style={{
        background: 'white',
        border: '2px solid black',
        fontSize: 'max(1.2rem, 24px)',
        maxWidth: 800,
        // wordWrap: 'break-word',
      }}
      onClick={activate}
    >
      <pre style={{textWrap: 'auto'}}>
        {note}
      </pre>
    </div>)
  );
}
NoteBox.fName = 'NoteBox';