import { useContext, useInsertionEffect, useLayoutEffect } from "react";
import { get } from "../../state";
import { styleId, updateStyles } from "../../initializeThemeEditor";
import { ThemeEditorContext } from "../ThemeEditor";

const frames = new Map;

function addFrame(frameElement, scopes) {
  if (frames.has(frameElement)) return;
  const sheet = frameElement.contentWindow.document.getElementById(styleId);
  const rulemap = new Map();
  frames.set(frameElement,{sheet , selectorRuleMap: rulemap})
  updateStyles(scopes, sheet, rulemap);
}

function removeFrame(frameElement) {
  frames.delete(frameElement);
}

function useFrame(ref, scopes) {
    const sheet = ref.current?.contentWindow.document.getElementById(styleId);
    useInsertionEffect(() => {
      if (!sheet) return;
      if (ref.current) {
        addFrame(ref.current, scopes)
      } else {
        removeFrame(ref.current)
      }
    }, [ref.current, sheet, scopes]);
}

export function ApplyStyles() {
    const {themeEditor: {scopes}, frameLoaded} = get;
    const {
      frameRef,
      scrollFrameRef,
      xrayFrameRef,
    } = useContext(ThemeEditorContext);
    useFrame(frameRef, scopes);
    useFrame(scrollFrameRef, scopes);
    useFrame(xrayFrameRef, scopes);

    useInsertionEffect(() => {
      updateStyles(scopes);
    }, [scopes]);

    // Still experimenting with exact timing of these effects.
    useLayoutEffect(() => {
      // const t = setTimeout(() => {
        for (const {sheet, selectorRuleMap} of frames.values()) {
          updateStyles(scopes, sheet, selectorRuleMap);
        }
      // }, 0);
      // return () => {clearTimeout(t)}
    }, [scopes]);
}