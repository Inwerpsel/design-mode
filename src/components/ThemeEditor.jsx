import React, {createContext, Fragment, useRef, useState} from 'react';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ui/ServerThemesList';
import {CustomVariableInput} from './ui/CustomVariableInput';
import {StylesheetDisabler} from './ui/StylesheetDisabler';
import {PropertyCategoryFilter} from './ui/PropertyCategoryFilter';
import {PropertySearch} from './ui/PropertySearch';
import {Checkbox, Checkbox2} from './controls/Checkbox';
import {ToggleButton} from './controls/ToggleButton';
import {ImportExportTools} from './ui/ImportExportTools';
import {ThemeUploadPanel} from './ui/ThemeUploadPanel';
import {MovablePanels} from './movable/MovablePanels';
import {FrameSizeSettings} from './ui/FrameSizeSettings';
import {ScreenSwitcher} from './ui/ScreenSwitcher';
import {CursorBehavior} from './ui/ThemeEditorExtraOptions';
import {MoveControls} from './movable/MoveControls';
import {Area} from './movable/Area';
import {FrameScaleSlider} from './ui/FrameScaleSlider';
import {Drawer} from './movable/Drawer';
import {CurrentTheme} from './ui/CurrentTheme';
import { RemoveAnnoyingPrefix } from './inspector/RemoveAnnoyingPrefix';
import { NameReplacements } from './inspector/NameReplacements';
import { HistoryControls } from './ui/HistoryControls';
import { FullHeightFrameScale, SmallFullHeightFrame } from './SmallFullHeightFrame';
import { Inspector } from './ui/Inspector';
import { get, use } from '../state';
import { Hotkeys } from './Hotkeys';
import { ColorSettings } from './ui/ColorSettings';
import { InformationVisibilitySettings } from './ui/InformationVisibilitySettings';
import { WebpackHomeInput } from './ui/WebpackHomeInput';
import { SignalExample } from './_examples/SignalExample';
// import { VoiceCommands } from './ui/VoiceCommands';
// import { SpeakGlobalHooks } from '../voice/menu/state';
import { HistoryVisualization } from './ui/HistoryVisualization';
import { Palette } from './ui/Palette';
import { HistoryStash } from './ui/HistoryStash';
import { StartTutorial } from '../_unstable/Tutorial';
import { ApplyStyles } from './effects/ApplyStyles';
import { AcceptDroppedOptions } from './effects/AcceptDroppedOptions';
import { FullscreenToggle } from './ui/FullScreenToggle';
import { PickedValue } from './ui/PickedValue';
import { PickedValueCursor } from './PickedValueCursor';
import { Selectors } from './ui/Selectors';
import { NoteBox } from './ui/NoteBox';
import { Xray } from './ui/Xray';
import { ToggleViewTransitions } from '../functions/viewTransition';
import { Play } from './ui/Play';
import { Session } from './ui/Session';
import { PlayTime } from './ui/PlayTime';

export const ThemeEditorContext = createContext({});

export const prevGroups = [];

export const ThemeEditor = (props) => {
  const {frameLoaded} = get;
  const {
    allVars,
    defaultValues,
  } = props;
  const frameRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const xrayFrameRef = useRef(null);

  // Don't move out along with similar global state, hiding and showing of panels probably needs a different solution.
  const [importDisplayed, setImportDisplayed] = useState(false);
  const [serverThemesDisplayed, setServerThemesDisplayed] = useLocalStorage('server-themes-displayed', true);
  const [sheetsDisablerDisplayed, setSheetDisablerDisplayed] = useState(false);

  const [fullPagePreview, setFullPagePreview] = useLocalStorage('full-page-preview', false)
  const [openFirstOnInspect, setOpenFirstOnInspect] = use.openFirstOnInspect();

  return (
    <ThemeEditorContext.Provider
      value={{
        allVars,
        defaultValues,
        frameRef,
        scrollFrameRef,
        xrayFrameRef,
        setSheetDisablerDisplayed,
      }}
    >
      <ApplyStyles />
      <AcceptDroppedOptions />
      <PickedValueCursor />
      {/* <SpeakGlobalHooks hooks={use} /> */}
      <Hotkeys {...{frameRef}}/>
      <div className="theme-editor">
        <MovablePanels stateHook={use.uiLayout}>
          <div
            style={{
              display: 'flex',
              columns: 2,
              justifyContent: 'space-between',
            }}
          >
            <Area
              id="area-top"
              style={{ justifyContent: 'flex-start', flexGrow: 1 }}
            >
              <HistoryControls />
              <HistoryStash />
            </Area>
            <Area
              id="area-top-reverse"
              style={{
                flexDirection: 'row-reverse',
                justifyContent: 'flex-start',
                flexGrow: 1,
              }}
            >
              <ScreenSwitcher />
              <FrameScaleSlider/>
              <ThemeUploadPanel/>
            </Area>
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-start', flexGrow: '1'}}>
            <Area id="area-left">
              <HistoryVisualization />
              <Xray />
            </Area>
            <Area id="area-left-inner" >
              <StartTutorial />
              <div id="Filters" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                }}>
                <PropertyCategoryFilter/>
                <PropertySearch/>
              </div>
              <div id="Inspector">
                {frameLoaded && <Inspector />}
              </div>
            </Area>
            <ResizableFrame src={window.location.href} />
            {!!fullPagePreview && <SmallFullHeightFrame src={window.location.href} />}
            
            <Area id="area-right">
              <Fragment id='ThemesList'>
                {serverThemesDisplayed && <ServerThemesList/>}
              </Fragment>
              <Fragment id='StylesheetDisabler'>{sheetsDisablerDisplayed && <StylesheetDisabler />}</Fragment>
              <Fragment id='ImportExportTools'>{importDisplayed && <ImportExportTools />}</Fragment>

            </Area>
          </div>
          <div
            style={{
              display: 'flex',
              columns: 2,
              justifyContent: 'space-between',
              flexGrow: 0,
              alignItems: 'flex-end',
            }}
          >
            <Area id="area-bottom">
              <Selectors />
              <NoteBox />
              <Palette />
              <PickedValue />
              <ColorSettings />
            </Area>
            <Area
              id="area-bottom-reverse"
              style={{
                flexDirection: 'row-reverse',
              }}
            >
              <div id='ExtraPanelsMenu' className={'theme-editor-menu'}>
                <ToggleButton controls={[importDisplayed, setImportDisplayed]}>
                  Import/export
                </ToggleButton>
                <ToggleButton controls={[sheetsDisablerDisplayed, setSheetDisablerDisplayed]}>
                  Stylesheets
                </ToggleButton>
                <ToggleButton controls={[serverThemesDisplayed, setServerThemesDisplayed]}>
                  Themes
                </ToggleButton>
              </div>
            </Area>
            <Drawer>
              <PlayTime />
              <Session />
              <Play />
              <MoveControls />
              <FullscreenToggle />
              <CursorBehavior />
              <div id='InspectionSettings'>
                <Checkbox
                  controls={[fullPagePreview, setFullPagePreview]}
                  title='WARNING!!! 1) Affects performance on large pages 2) If scrollable section is below body, it cannot be fully shown (e.g. Halfmoon) 3) Does not work properly for pages that have different styles based on screen height.'
                >Full height preview</Checkbox>
                <Checkbox
                  controls={[openFirstOnInspect, setOpenFirstOnInspect]}
                  title="Whether a new inspection should leave the open groups unchanged, or it should set the open groups to only the first one of the new inspection."
                >Auto open first group on inspect</Checkbox>
                <Checkbox2
                  hook={use.texturedTree}
                  title="Increase visual grounding when scrolling the inspector by allowing elements to take up less space, leading to a random-ish texture."
                >Textured tree</Checkbox2>
                <Checkbox
                  controls={use.enableScrollingInView()}
                  title="Should the content frame be scrolled along when going through history?"
                >Scroll frame with history</Checkbox>
                <ToggleViewTransitions />
                <Checkbox2
                  hook={use.demoMode}
                  title="Block all input when replaying history. It does allow you to do exactly the same action, which will advance history."
                >Demo mode</Checkbox2>
              </div>
              <WebpackHomeInput />
              <RemoveAnnoyingPrefix />
              <NameReplacements/>
              {/* <SignalExample /> */}
              {/* <VoiceCommands /> */}
              <CurrentTheme />
              <FullHeightFrameScale />
              <InformationVisibilitySettings />
              <CustomVariableInput/>
              <FrameSizeSettings />
            </Drawer>
          </div>
        </MovablePanels>
      </div>
    </ThemeEditorContext.Provider>
  );
};
