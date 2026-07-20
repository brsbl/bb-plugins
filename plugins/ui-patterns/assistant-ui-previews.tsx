import {
  ActionBarPrimitive,
  ActionBarMorePrimitive,
  AssistantModalPrimitive,
  AssistantRuntimeProvider,
  AttachmentPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ChainOfThoughtPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
  type SuggestionAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { Icon } from "./components/ui/icon.js";
import { usePreviewPortalContainer } from "./preview-frame-context.js";

function PreviewStage({ children }: { children: ReactNode }) {
  return children;
}

const demoAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    const prompt = messages
      .at(-1)
      ?.content.find((part) => part.type === "text")?.text;

    yield {
      content: [
        {
          type: "text",
          text: prompt
            ? `The live runtime received: “${prompt}”`
            : "This response came from the live assistant-ui runtime.",
        },
      ],
      status: { type: "complete", reason: "stop" },
    };
  },
};

const demoMessages: ThreadMessageLike[] = [
  { role: "user", content: "What is this preview rendering?" },
  {
    role: "assistant",
    content: "The actual assistant-ui React primitives, backed by a local demo runtime.",
  },
];

const demoSuggestionAdapter: SuggestionAdapter = {
  async generate() {
    return [
      { prompt: "Show the keyboard interaction", title: "Keyboard interaction", label: "Explore accessibility behavior" },
      { prompt: "Compare the implementations", title: "Compare sources", label: "Switch between approved libraries" },
    ];
  },
};

function DemoRuntime({
  children,
  messages = demoMessages,
  suggestions = false,
}: {
  children: ReactNode;
  messages?: ThreadMessageLike[];
  suggestions?: boolean;
}) {
  const runtime = useLocalRuntime(demoAdapter, {
    initialMessages: messages,
    adapters: suggestions ? { suggestion: demoSuggestionAdapter } : undefined,
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

function Composer({ placeholder = "Ask anything…" }: { placeholder?: string }) {
  return (
    <ComposerPrimitive.Root className="flex w-full flex-col rounded-2xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <ComposerPrimitive.Input
        aria-label="Message"
        placeholder={placeholder}
        className="min-h-20 w-full resize-none bg-transparent px-4 py-3 text-sm outline-none"
        rows={2}
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        <span className="text-xs text-muted-foreground">Enter to send</span>
        <ComposerPrimitive.Send className="grid size-8 cursor-pointer place-items-center rounded-full bg-foreground text-background outline-none disabled:cursor-not-allowed disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring">
          <Icon name="ArrowUp" className="size-4" aria-hidden="true" />
          <span className="sr-only">Send message</span>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex flex-col items-end gap-1">
      <span className="text-xs font-medium text-muted-foreground">You</span>
      <div className="max-w-[85%] rounded-2xl bg-foreground px-4 py-2.5 text-sm text-background">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function MessageActions() {
  return (
    <ActionBarPrimitive.Root
      aria-label="Message actions"
      autohide="never"
      className="flex flex-wrap gap-1"
    >
      <ActionBarPrimitive.Copy className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <Icon name="Copy" className="size-3.5" aria-hidden="true" />
        <span className="group-data-[copied]:hidden">Copy</span>
        <span className="hidden group-data-[copied]:inline">Copied</span>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <Icon name="RotateCcw" className="size-3.5" aria-hidden="true" />
        Regenerate
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
}

function AssistantMessage({ actions = false }: { actions?: boolean }) {
  return (
    <MessagePrimitive.Root className="flex flex-col items-start gap-1">
      <span className="text-xs font-medium text-muted-foreground">Assistant</span>
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
        <MessagePrimitive.Parts />
      </div>
      {actions ? <MessageActions /> : null}
    </MessagePrimitive.Root>
  );
}

function Messages({ actions = false }: { actions?: boolean }) {
  return (
    <ThreadPrimitive.Messages>
      {({ message }) =>
        message.role === "user" ? (
          <UserMessage />
        ) : message.role === "assistant" ? (
          <AssistantMessage actions={actions} />
        ) : null
      }
    </ThreadPrimitive.Messages>
  );
}

export function AssistantComposerPreview() {
  return (
    <PreviewStage>
      <DemoRuntime messages={[]}>
        <ThreadPrimitive.Root className="flex h-80 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-muted/20">
          <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <div className="mb-4 flex flex-1 flex-col justify-end gap-4">
              <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                Send a message. The user turn and local runtime response will appear here.
              </div>
              <Messages />
            </div>
            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-background pt-2">
              <Composer placeholder="Try the live composer…" />
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantActionBarPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport className="overflow-y-auto">
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <AssistantMessage actions />
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantMessagePreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport className="overflow-y-auto">
            <div className="grid gap-4">
              <Messages />
            </div>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantThreadPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="flex h-96 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <div className="grid flex-1 content-end gap-4 pb-4">
              <Messages actions />
            </div>
            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-background pt-2">
              <Composer placeholder="Continue the thread…" />
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

function MoreActions() {
  const portalContainer = usePreviewPortalContainer();
  return (
    <ActionBarMorePrimitive.Root>
      <ActionBarMorePrimitive.Trigger className="h-8 cursor-pointer rounded-md border border-border px-3 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        More actions
      </ActionBarMorePrimitive.Trigger>
      <ActionBarMorePrimitive.Content
        portalProps={{ container: portalContainer }}
        className="z-50 grid min-w-40 gap-1 rounded-md border border-border bg-background p-1 text-sm shadow-lg outline-none"
      >
        <ActionBarMorePrimitive.Item className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
          Read aloud
        </ActionBarMorePrimitive.Item>
        <ActionBarMorePrimitive.Separator className="my-1 h-px bg-border" />
        <ActionBarMorePrimitive.Item className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
          Report response
        </ActionBarMorePrimitive.Item>
      </ActionBarMorePrimitive.Content>
    </ActionBarMorePrimitive.Root>
  );
}

export function AssistantActionBarMorePreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <MessagePrimitive.Root className="grid gap-3">
                    <div className="rounded-xl bg-muted p-3 text-sm"><MessagePrimitive.Parts /></div>
                    <MoreActions />
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantIfPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <AuiIf condition={(state) => state.thread.messages.length > 0}>
            <div className="rounded-lg bg-muted p-4 text-sm">
              AuiIf is rendering because this live thread has messages.
            </div>
          </AuiIf>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantModalPreview() {
  const portalContainer = usePreviewPortalContainer();
  return (
    <PreviewStage>
      <DemoRuntime>
        <AssistantModalPrimitive.Root unstable_openOnRunStart={false}>
          <AssistantModalPrimitive.Trigger className="h-9 cursor-pointer rounded-md bg-foreground px-4 text-sm font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Open assistant
          </AssistantModalPrimitive.Trigger>
          <AssistantModalPrimitive.Content
            portalProps={{ container: portalContainer }}
            side="top"
            className="z-50 w-80 rounded-xl border border-border bg-background p-4 shadow-xl outline-none"
          >
            <ThreadPrimitive.Root>
              <ThreadPrimitive.Viewport className="grid max-h-72 gap-3 overflow-y-auto">
                <Messages />
                <Composer placeholder="Ask from the modal…" />
              </ThreadPrimitive.Viewport>
            </ThreadPrimitive.Root>
          </AssistantModalPrimitive.Content>
        </AssistantModalPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

export function AssistantBranchPickerPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <MessagePrimitive.Root className="grid gap-3">
                    <div className="rounded-xl bg-muted p-3 text-sm"><MessagePrimitive.Parts /></div>
                    <BranchPickerPrimitive.Root className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BranchPickerPrimitive.Previous className="size-8 cursor-pointer rounded border border-border disabled:cursor-not-allowed disabled:opacity-40">Previous</BranchPickerPrimitive.Previous>
                      <span><BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count /></span>
                      <BranchPickerPrimitive.Next className="size-8 cursor-pointer rounded border border-border disabled:cursor-not-allowed disabled:opacity-40">Next</BranchPickerPrimitive.Next>
                    </BranchPickerPrimitive.Root>
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

const errorMessages: ThreadMessageLike[] = [
  { role: "user", content: "Show an error state." },
  {
    role: "assistant",
    content: "The response could not be completed.",
    status: { type: "incomplete", reason: "error", error: "Preview request failed" },
  },
];

export function AssistantErrorPreview() {
  return (
    <PreviewStage>
      <DemoRuntime messages={errorMessages}>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <MessagePrimitive.Root>
                    <ErrorPrimitive.Root className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      <ErrorPrimitive.Message />
                    </ErrorPrimitive.Root>
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

function TextPart() {
  return <MessagePartPrimitive.Text className="whitespace-pre-wrap" />;
}

export function AssistantMessagePartPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <MessagePrimitive.Root className="rounded-xl bg-muted p-3 text-sm">
                    <MessagePrimitive.Parts components={{ Text: TextPart }} />
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

const attachmentMessages: ThreadMessageLike[] = [
  {
    role: "user",
    content: "Review the attached component notes.",
    attachments: [
      {
        id: "atlas-notes",
        type: "document",
        name: "component-notes.txt",
        contentType: "text/plain",
        status: { type: "complete" },
        content: [{ type: "text", text: "Approved-source preview notes" }],
      },
    ],
  },
];

function AttachmentCard() {
  return (
    <AttachmentPrimitive.Root className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm">
      <div className="grid size-9 place-items-center rounded bg-muted text-xs font-semibold">TXT</div>
      <span className="min-w-0 flex-1 truncate">
        <AttachmentPrimitive.Name />
      </span>
    </AttachmentPrimitive.Root>
  );
}

export function AssistantAttachmentPreview() {
  return (
    <PreviewStage>
      <DemoRuntime messages={attachmentMessages}>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "user" ? (
                  <MessagePrimitive.Root className="grid gap-3">
                    <MessagePrimitive.Attachments components={{ Attachment: AttachmentCard }} />
                    <div className="rounded-xl bg-foreground p-3 text-sm text-background"><MessagePrimitive.Parts /></div>
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

const chainMessages: ThreadMessageLike[] = [
  {
    role: "assistant",
    content: [
      { type: "reasoning", text: "Compare the interaction model, keyboard behavior, and source attribution." },
      { type: "text", text: "The approved implementations are ready to compare." },
    ],
  },
];

function ReasoningPart() {
  return <MessagePartPrimitive.Text className="block py-2 text-sm text-muted-foreground" />;
}

function ChainOfThought() {
  return (
    <ChainOfThoughtPrimitive.Root className="rounded-lg border border-border bg-muted/30 p-3">
      <ChainOfThoughtPrimitive.AccordionTrigger className="cursor-pointer text-sm font-medium">
        Toggle reasoning
      </ChainOfThoughtPrimitive.AccordionTrigger>
      <ChainOfThoughtPrimitive.Parts components={{ Reasoning: ReasoningPart }} />
    </ChainOfThoughtPrimitive.Root>
  );
}

export function AssistantChainOfThoughtPreview() {
  return (
    <PreviewStage>
      <DemoRuntime messages={chainMessages}>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === "assistant" ? (
                  <MessagePrimitive.Root className="grid gap-3">
                    <MessagePrimitive.Parts components={{ ChainOfThought }} />
                  </MessagePrimitive.Root>
                ) : null
              }
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

function Suggestion() {
  return (
    <SuggestionPrimitive.Trigger className="grid cursor-pointer gap-1 rounded-lg border border-border bg-background p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
      <SuggestionPrimitive.Title className="text-sm font-medium" />
      <SuggestionPrimitive.Description className="text-xs text-muted-foreground" />
    </SuggestionPrimitive.Trigger>
  );
}

export function AssistantSuggestionPreview() {
  return (
    <PreviewStage>
      <DemoRuntime suggestions>
        <ThreadPrimitive.Root className="w-full max-w-lg rounded-xl border border-border bg-background p-5">
          <ThreadPrimitive.Viewport className="grid gap-3">
            <ThreadPrimitive.Suggestions components={{ Suggestion }} />
            <Composer placeholder="Pick a suggestion…" />
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}

function ThreadListItem() {
  const portalContainer = usePreviewPortalContainer();
  return (
    <ThreadListItemPrimitive.Root className="flex items-center gap-2 rounded-lg border border-border bg-background p-1 data-[active]:bg-muted">
      <ThreadListItemPrimitive.Trigger className="min-w-0 flex-1 cursor-pointer truncate rounded px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ThreadListItemPrimitive.Title fallback="New conversation" />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemMorePrimitive.Root sharedFocusGroup>
        <ThreadListItemMorePrimitive.Trigger className="size-8 cursor-pointer rounded text-sm outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring">
          More
        </ThreadListItemMorePrimitive.Trigger>
        <ThreadListItemMorePrimitive.Content
          portalProps={{ container: portalContainer }}
          className="z-50 min-w-36 rounded-md border border-border bg-background p-1 text-sm shadow-lg outline-none"
        >
          <ThreadListItemMorePrimitive.Item className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">Archive</ThreadListItemMorePrimitive.Item>
          <ThreadListItemMorePrimitive.Separator className="my-1 h-px bg-border" />
          <ThreadListItemMorePrimitive.Item className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">Delete</ThreadListItemMorePrimitive.Item>
        </ThreadListItemMorePrimitive.Content>
      </ThreadListItemMorePrimitive.Root>
    </ThreadListItemPrimitive.Root>
  );
}

export function AssistantThreadListPreview() {
  return (
    <PreviewStage>
      <DemoRuntime>
        <ThreadListPrimitive.Root className="grid w-full max-w-sm gap-2 rounded-xl border border-border bg-muted/20 p-3">
          <ThreadListPrimitive.New className="cursor-pointer rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
            New thread
          </ThreadListPrimitive.New>
          <ThreadListPrimitive.Items components={{ ThreadListItem }} />
        </ThreadListPrimitive.Root>
      </DemoRuntime>
    </PreviewStage>
  );
}
