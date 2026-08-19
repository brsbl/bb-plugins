import {
  createElement,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import type { CompactComposerProps } from "@get-bb/plugin-sdk/app";

function TestCompactComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  disabled = false,
  validationMessage,
  placeholder,
  autoFocus,
  accessibleLabel,
  submitLabel = "Submit",
  className,
}: CompactComposerProps) {
  return createElement(
    "div",
    { "data-testid": "bb-compact-composer", className },
    createElement("textarea", {
      "data-testid": "bb-compact-composer-input",
      "aria-label": accessibleLabel,
      placeholder,
      autoFocus,
      value: value.text,
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
        onChange({ text: event.target.value, mentions: [] }),
      onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape" && onCancel !== undefined) {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          if (!disabled && !isSubmitting) void onSubmit(value);
        }
      },
    }),
    createElement(
      "button",
      {
        type: "button",
        "aria-label": submitLabel,
        disabled: disabled || isSubmitting,
        onClick: () => void onSubmit(value),
      },
      submitLabel,
    ),
    validationMessage
      ? createElement("p", { role: "alert" }, validationMessage)
      : null,
  );
}

interface RuntimeHost {
  __bbPluginRuntime?: {
    pluginSdkApp?: Record<string, unknown>;
  };
}

const host = globalThis as RuntimeHost;
host.__bbPluginRuntime = {
  ...host.__bbPluginRuntime,
  pluginSdkApp: {
    ...host.__bbPluginRuntime?.pluginSdkApp,
    experimental_CompactComposer: TestCompactComposer,
  },
};
