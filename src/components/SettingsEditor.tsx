import type { Project, RuntimeStatus, ValidationIssue } from '../types';
import { Badge, EmptyState, TextAreaField, TextField } from './Field';

export function SettingsEditor({ project, issues, runtime, onChange, onDetect, onNew, onSave, onOpen, onExport, onImport, onPlay }: {
  project: Project;
  issues: ValidationIssue[];
  runtime: RuntimeStatus | null;
  onChange: (updater: (project: Project) => void) => void;
  onDetect: () => void;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onExport: () => void;
  onImport: () => void;
  onPlay: () => void;
}) {
  const errors = issues.filter((item) => item.severity === 'error');
  const warnings = issues.filter((item) => item.severity === 'warning');
  return (
    <div className="editor-stack">
      <div className="editor-title-row"><div><p className="eyebrow">Project configuration</p><h2>Settings</h2></div><Badge tone={errors.length ? 'danger' : warnings.length ? 'warning' : 'success'}>{errors.length ? errors.length + ' errors' : warnings.length ? warnings.length + ' warnings' : 'Ready'}</Badge></div>
      <div className="form-grid"><TextField label="Project name" value={project.name} onChange={(event) => onChange((item) => { item.name = event.target.value; })} /><TextAreaField label="Project description" rows={3} value={project.description} onChange={(event) => onChange((item) => { item.description = event.target.value; })} /></div>
      <div className="subsection"><div className="subsection-heading"><div><h3>Project files</h3><p>Use a local folder while editing. Export a single .sts2char archive when sharing.</p></div></div><div className="button-row wrap"><button className="secondary-button" type="button" onClick={onNew}>New project</button><button className="secondary-button" type="button" onClick={onOpen}>Open folder</button><button className="secondary-button" type="button" onClick={onSave}>Save project</button><button className="secondary-button" type="button" onClick={onImport}>Import archive</button><button className="secondary-button" type="button" onClick={onExport}>Export .sts2char</button></div></div>
      <div className="subsection"><div className="subsection-heading"><div><h3>Play setup</h3><p>Detection is read-only until you explicitly choose Play. Runtime deployment creates a reversible backup.</p></div><div className="button-row"><button className="secondary-button" type="button" onClick={onDetect}>Detect STS2</button><button className="primary-button" type="button" onClick={onPlay}>Play</button></div></div>{runtime ? <div className="runtime-panel"><div><span>Game</span><strong>{runtime.game_found ? 'Found' : 'Not detected'}</strong><small>{runtime.game_path ?? 'No local path detected.'}</small></div><div><span>Game build</span><strong>{runtime.game_version ?? 'Unknown'}</strong><small>{runtime.message}</small></div><div><span>Runtime support</span><strong>{runtime.base_lib_found && runtime.blank_found ? 'BaseLib + BLANK found' : 'Not ready'}</strong><small>Advanced runtime details stay here instead of in normal authoring.</small></div></div> : <EmptyState title="Runtime not checked" text="Detect the local game only when you are ready to use Play." action={<button className="secondary-button" type="button" onClick={onDetect}>Detect runtime</button>} />}</div>
      <div className="subsection"><div className="subsection-heading"><div><h3>Validation</h3><p>Issues are grouped by user-facing section. Fix errors before runtime deployment.</p></div><span className="quiet-status">{issues.length} total</span></div>{issues.length ? <ul className="issue-list">{issues.map((item) => <li className={item.severity} key={item.id}><strong>{item.severity === 'error' ? 'Error' : 'Warning'}</strong><span>{item.message}</span></li>)}</ul> : <p className="success-copy">No validation issues.</p>}</div>
    </div>
  );
}