// FieldModule — renders a single field of a record in view or edit mode.
// It resolves the field's type (+ any per-field render override) from the
// registry, so behavior is defined once per type and inherited everywhere.
import { Field } from "../components/ui";
import { resolveField } from "../fields/registry";

export const FieldModule = ({ object, name, record, mode = "view", onChange, db, navigate, bare = false }) => {
  const field = object.fields[name];
  if (!field) return null;
  const impl = resolveField(field);
  const value = record?.[name];

  const control = mode === "edit"
    ? impl.edit({ value, onChange: (v) => onChange(name, v), field, record, db, navigate })
    : impl.view({ value, field, record, db, navigate });

  if (bare) return control;
  return <Field label={field.label}>{control}</Field>;
};

// Render a set of fields as a responsive grid of FieldModules
export const FieldSection = ({ object, fields, cols = 2, record, mode, onChange, db, navigate }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 14 }}>
    {fields.map((name) => {
      const f = object.fields[name];
      const span = f?.type === "textarea" || f?.full ? cols : 1;
      return (
        <div key={name} style={{ gridColumn: `span ${span}` }}>
          <FieldModule object={object} name={name} record={record} mode={mode} onChange={onChange} db={db} navigate={navigate} />
        </div>
      );
    })}
  </div>
);
