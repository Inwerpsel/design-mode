import { LOCAL_STORAGE_KEY } from '../initializeThemeEditor';

export const exportThemeJson = (fileName, scopes) => {
  saveAsJsonFile({ scopes }, fileName)
};

export function saveAsJsonFile(data, fileName) {
  document.exitFullscreen();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.download    = `${fileName}.json`;
  a.href        = url;
  a.textContent = 'Download json';
  a.click();
}

const formatVars = vars => {
  const lines = Object.keys(vars).map(k => `  ${ k }: ${ vars[k] };`);

  return lines.join('\n');
};

function formatCss(scopes) {
  return Object.entries(scopes).map(([k,v]) => `${k} {\n${formatVars(v)}\n}`).join('\n');
}

export const exportCss = (fileName, scopes) => {
  const css = formatCss(scopes);
  const blob = new Blob([css], {type: 'application/css'});
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.download    = `${fileName || 'theme'}.css`;
  a.href        = url;
  a.textContent = 'Download backup.json';
  a.click();
};

