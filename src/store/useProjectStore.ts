import { create } from 'zustand';
import type { Project, SectionId } from '../types';
import { cloneProject, createDefaultProject, now } from '../lib/model';

interface ProjectStore {
  project: Project;
  projectPath: string | null;
  selectedSection: SectionId;
  selectedId: string | null;
  dirty: boolean;
  history: Project[];
  future: Project[];
  updateProject: (updater: (project: Project) => void) => void;
  replaceProject: (project: Project, projectPath?: string | null) => void;
  setProjectPath: (path: string | null) => void;
  markSaved: (path?: string | null) => void;
  selectSection: (section: SectionId, id?: string | null) => void;
  undo: () => void;
  redo: () => void;
  newProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: createDefaultProject(),
  projectPath: null,
  selectedSection: 'cards',
  selectedId: null,
  dirty: true,
  history: [],
  future: [],
  updateProject: (updater) => set((state) => {
    const next = cloneProject(state.project);
    updater(next);
    next.updatedAt = now();
    return { project: next, dirty: true, history: [...state.history, cloneProject(state.project)].slice(-80), future: [] };
  }),
  replaceProject: (project, projectPath = null) => set({ project: cloneProject(project), projectPath, dirty: false, history: [], future: [], selectedSection: 'character', selectedId: null }),
  setProjectPath: (projectPath) => set({ projectPath }),
  markSaved: (projectPath) => set((state) => ({ projectPath: projectPath === undefined ? state.projectPath : projectPath, dirty: false })),
  selectSection: (selectedSection, selectedId = null) => set({ selectedSection, selectedId }),
  undo: () => set((state) => {
    const previous = state.history.at(-1);
    if (!previous) return state;
    return { project: previous, history: state.history.slice(0, -1), future: [cloneProject(state.project), ...state.future], dirty: true };
  }),
  redo: () => set((state) => {
    const next = state.future[0];
    if (!next) return state;
    return { project: next, history: [...state.history, cloneProject(state.project)], future: state.future.slice(1), dirty: true };
  }),
  newProject: () => set({ project: createDefaultProject(), projectPath: null, dirty: true, history: [], future: [], selectedSection: 'character', selectedId: null }),
}));
