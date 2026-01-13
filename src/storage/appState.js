import { loadData, saveData } from "./storageEngine.js";

export const defaultAppState = {
  meta: null,
  userProfile: null,
  tasks: [],
  timetables: [],
  attendance: [],
  calendar: null,
  exams: [],
  notes: [],
  settings: null,
  history: []
};

let appState = loadData() || structuredClone(defaultAppState);

export function getAppState() {
  return appState;
}

export function setAppState(newState) {
  appState = newState;
  saveData(appState);
}
