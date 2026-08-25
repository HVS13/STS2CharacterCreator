import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, helper, error, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {helper && <div className="field-helper" id={htmlFor + '-help'}>{helper}</div>}
      {error && <div className="field-error" id={htmlFor + '-error'} role="alert">{error}</div>}
    </div>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string }) {
  const { label, helper, error, id = label.toLowerCase().replace(/\s+/g, '-'), ...inputProps } = props;
  const describedBy = [helper && id + '-help', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
    </Field>
  );
}

export function NumberField(props: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string }) {
  return <TextField type="number" inputMode="numeric" {...props} />;
}

export function TextAreaField(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; helper?: string; error?: string }) {
  const { label, helper, error, id = label.toLowerCase().replace(/\s+/g, '-'), ...inputProps } = props;
  const describedBy = [helper && id + '-help', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
    </Field>
  );
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<[string, string]>; helper?: string; error?: string }) {
  const { label, options, helper, error, id = label.toLowerCase().replace(/\s+/g, '-'), ...selectProps } = props;
  const describedBy = [helper && id + '-help', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...selectProps}>
        {options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
      </select>
    </Field>
  );
}

export function SectionIntro({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="section-intro"><h2>{title}</h2>{children && <p>{children}</p>}</div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={'badge badge-' + tone}>{children}</span>;
}