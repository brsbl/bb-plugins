import * as React from "react";

import {
  Checkbox,
  NativeSelect,
  Switch,
  TextArea,
  TextInput,
} from "./controls.js";
import { Cluster, cx, Heading, Stack, Text } from "./foundation.js";

type FieldStateProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
};

function useFieldIds(
  suppliedId: string | undefined,
  description: React.ReactNode,
  error: React.ReactNode,
) {
  const generatedId = React.useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    id,
    descriptionId,
    errorId,
    describedBy: [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
  };
}

function FieldMessages({
  description,
  descriptionId,
  error,
  errorId,
}: {
  description?: React.ReactNode;
  descriptionId?: string;
  error?: React.ReactNode;
  errorId?: string;
}) {
  return (
    <>
      {description ? (
        <Text id={descriptionId} className="atlas-field__description" tone="muted">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text
          id={errorId}
          className="atlas-field__error"
          role="alert"
          tone="default"
        >
          {error}
        </Text>
      ) : null}
    </>
  );
}

export interface TextFieldProps
  extends FieldStateProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "children"> {}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id: suppliedId,
      label,
      description,
      error,
      required,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const ids = useFieldIds(suppliedId, description, error);
    return (
      <div className="atlas-field">
        <label className="atlas-field__label" htmlFor={ids.id}>
          {label}
          {required ? (
            <span className="atlas-field__required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
        <TextInput
          ref={ref}
          id={ids.id}
          className={className}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={ariaDescribedBy ?? ids.describedBy}
          {...props}
        />
        <FieldMessages
          description={description}
          descriptionId={ids.descriptionId}
          error={error}
          errorId={ids.errorId}
        />
      </div>
    );
  },
);
TextField.displayName = "TextField";

export interface TextAreaFieldProps
  extends FieldStateProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> {}

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(
  (
    {
      id: suppliedId,
      label,
      description,
      error,
      required,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const ids = useFieldIds(suppliedId, description, error);
    return (
      <div className="atlas-field">
        <label className="atlas-field__label" htmlFor={ids.id}>
          {label}
          {required ? (
            <span className="atlas-field__required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
        <TextArea
          ref={ref}
          id={ids.id}
          className={className}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={ariaDescribedBy ?? ids.describedBy}
          {...props}
        />
        <FieldMessages
          description={description}
          descriptionId={ids.descriptionId}
          error={error}
          errorId={ids.errorId}
        />
      </div>
    );
  },
);
TextAreaField.displayName = "TextAreaField";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends FieldStateProps,
    Omit<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      "children" | "multiple"
    > {
  options: readonly SelectOption[];
}

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(
  (
    {
      id: suppliedId,
      label,
      description,
      error,
      required,
      options,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const ids = useFieldIds(suppliedId, description, error);
    return (
      <div className="atlas-field">
        <label className="atlas-field__label" htmlFor={ids.id}>
          {label}
          {required ? (
            <span className="atlas-field__required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
        <NativeSelect
          ref={ref}
          id={ids.id}
          className={className}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={ariaDescribedBy ?? ids.describedBy}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <FieldMessages
          description={description}
          descriptionId={ids.descriptionId}
          error={error}
          errorId={ids.errorId}
        />
      </div>
    );
  },
);
SelectField.displayName = "SelectField";

export interface BooleanFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "children" | "type"
    >,
    Omit<FieldStateProps, "error" | "required"> {
  variant?: "checkbox" | "switch";
}

export const BooleanField = React.forwardRef<
  HTMLInputElement,
  BooleanFieldProps
>(
  (
    {
      id: suppliedId,
      label,
      description,
      variant = "checkbox",
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const ids = useFieldIds(suppliedId, description, undefined);
    const Control = variant === "switch" ? Switch : Checkbox;
    return (
      <div className="atlas-boolean-field">
        <Control
          ref={ref}
          id={ids.id}
          className={className}
          aria-describedby={ariaDescribedBy ?? ids.describedBy}
          {...props}
        />
        <div>
          <label className="atlas-field__label" htmlFor={ids.id}>
            {label}
          </label>
          <FieldMessages
            description={description}
            descriptionId={ids.descriptionId}
          />
        </div>
      </div>
    );
  },
);
BooleanField.displayName = "BooleanField";

export interface FormSectionProps
  extends Omit<
    React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
    "title"
  > {
  title: React.ReactNode;
  description?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <fieldset className={cx("atlas-form-section", className)} {...props}>
      <legend>
        <Heading level={3} size="sm">
          {title}
        </Heading>
      </legend>
      {description ? <Text tone="muted">{description}</Text> : null}
      <Stack gap="md">{children}</Stack>
    </fieldset>
  );
}

export function FormActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Cluster
      className={cx("atlas-form-actions", className)}
      justify="end"
      {...props}
    />
  );
}
