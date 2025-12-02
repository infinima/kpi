export type FieldType =
    | "text"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "number"
    | "image"
    | "date"
  | "file";

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: { value: string | number; label: string }[]; // для select
    hiddenWhenEditing?: boolean;
    hiddenWhenCreating?: boolean;
}

export interface FormConfig {
    titleCreate: string;
    titleEdit: string;
    endpoint: string;
    fields: FormField[];
}