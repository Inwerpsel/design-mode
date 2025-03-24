import { use } from "../../state"

const options ={appendOnly: true, skipHistory: true}; 

export function PlayTime() {
    const [playTime, setPlayTime] = use.playTime();

    if (playTime === 0) {
        return <button title="No custom playtime" onClick={e=>setPlayTime(4, options)} >
            🕑
        </button>
    }

    return (
      <div>
        <input
          min={1}
          type="number"
          value={playTime}
          onChange={(e) => setPlayTime(Number(e.target.value), options)}
        />
        🕑
      </div>
    );
}

PlayTime.fName = 'PlayTime';