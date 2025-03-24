import React from "react";
import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";

export function ColorSettings() {

    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Checkbox
          title="Should the color pickers include shortcuts to all default variable values found in the CSS of the page?"
          controls={use.includeDefaultPalette()}
        >
          Include default palette
        </Checkbox>
        <Checkbox title="Disable this to get the best experience." controls={use.nativeColorPicker()}>
          Native color picker
        </Checkbox>
        <Checkbox
          title="When applying a hue to an element (by dropping on its title in the inspector), should chroma be increased to its maximum allowed value? Regardless of this setting, if the resulting chroma value does not exist, it will be lowered to the maximum."
          controls={use.maximizeChroma()}
        >
          Maximize chroma when dropping
        </Checkbox>
      </div>
    );
}

ColorSettings.fName = 'ColorSettings';