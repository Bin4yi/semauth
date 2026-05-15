'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';

import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X, Paperclip, ArrowUp, Square, Send } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface UIMessage {
  id: string;
  content: string;
  role: string;
  attachments?: Attachment[];
}

export type VisibilityType = 'public' | 'private' | 'unlisted' | string;

// ── Button ────────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Black background, white text
        default: 'bg-zinc-900 text-white hover:bg-zinc-700',
        // Light red — critical/destructive
        destructive: 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200',
        // White bg, black border
        outline: 'border border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50',
        // Light grey
        secondary: 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200',
        // Transparent hover
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

// ── Textarea ──────────────────────────────────────────────────────────────────

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[80px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

// ── Suggested Actions ─────────────────────────────────────────────────────────

interface SuggestedActionsProps {
  chatId: string;
  onSelectAction: (action: string) => void;
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({ onSelectAction }: SuggestedActionsProps) {
  const actions = [
    { title: 'How can I improve', label: 'my time management skills?', action: 'How can I improve my time management skills?' },
    { title: 'Suggest ideas for', label: 'a creative writing project', action: 'Suggest ideas for a creative writing project' },
    { title: 'What are some tips', label: 'for staying motivated?', action: 'What are some tips for staying motivated?' },
    { title: 'Help me brainstorm', label: 'ideas for a new hobby', action: 'Help me brainstorm ideas for a new hobby' },
  ];

  return (
    <div className="grid pb-2 sm:grid-cols-2 gap-2 w-full">
      <AnimatePresence>
        {actions.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * i }}
            className={i > 1 ? 'hidden sm:block' : 'block'}
          >
            <Button
              variant="ghost"
              onClick={() => onSelectAction(a.action)}
              className="text-left border border-zinc-200 rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start hover:border-zinc-400 hover:bg-zinc-50"
            >
              <span className="font-semibold text-zinc-800">{a.title}</span>
              <span className="text-zinc-500">{a.label}</span>
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const SuggestedActions = memo(PureSuggestedActions, (prev, next) =>
  prev.chatId === next.chatId && prev.selectedVisibilityType === next.selectedVisibilityType
);

// ── Attachment Preview ────────────────────────────────────────────────────────

const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;
  return (
    <div className="flex flex-col gap-1">
      <div className="w-20 h-16 bg-zinc-100 border border-zinc-200 rounded-lg relative flex items-center justify-center overflow-hidden">
        {contentType?.startsWith('image/') && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="size-full object-cover rounded-lg" />
        ) : (
          <span className="text-xs text-zinc-500 text-center px-1">
            {name?.split('.').pop()?.toUpperCase() || 'FILE'}
          </span>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="size-4 text-zinc-500 animate-spin" />
          </div>
        )}
      </div>
      <span className="text-xs text-zinc-500 max-w-20 truncate">{name}</span>
    </div>
  );
};

// ── Sub-buttons ───────────────────────────────────────────────────────────────

function PureAttachmentsButton({
  fileInputRef,
  disabled,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  return (
    <Button
      variant="ghost"
      className="rounded-lg p-2 h-fit text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200"
      onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
      disabled={disabled}
      aria-label="Attach files"
    >
      <Paperclip className="size-4 -rotate-45" />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton, (p, n) => p.disabled === n.disabled);

function PureStopButton({ onStop }: { onStop: () => void }) {
  return (
    // Critical stop action — light red
    <Button
      variant="destructive"
      className="rounded-full p-2 h-fit"
      onClick={(e) => { e.preventDefault(); onStop(); }}
      aria-label="Stop generating"
    >
      <Square className="size-3.5" />
    </Button>
  );
}

const StopButton = memo(PureStopButton, (p, n) => p.onStop === n.onStop);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  attachments,
  canSend,
  isGenerating,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: string[];
  attachments: Attachment[];
  canSend: boolean;
  isGenerating: boolean;
}) {
  const disabled =
    uploadQueue.length > 0 ||
    !canSend ||
    isGenerating ||
    (input.trim().length === 0 && attachments.length === 0);

  return (
    <Button
      variant="default"
      className="rounded-full p-2 h-fit"
      onClick={(e) => { e.preventDefault(); if (!disabled) submitForm(); }}
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUp className="size-3.5" />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (p, n) => {
  if (p.input !== n.input) return false;
  if (p.uploadQueue.length !== n.uploadQueue.length) return false;
  if (p.attachments.length !== n.attachments.length) return false;
  if (p.attachments.length > 0 && !equal(p.attachments, n.attachments)) return false;
  if (p.canSend !== n.canSend) return false;
  if (p.isGenerating !== n.isGenerating) return false;
  return true;
});

// ── Main Component ────────────────────────────────────────────────────────────

export interface MultimodalInputProps {
  chatId: string;
  messages: UIMessage[];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  onSendMessage: (params: { input: string; attachments: Attachment[] }) => void;
  onStopGenerating: () => void;
  isGenerating: boolean;
  canSend: boolean;
  className?: string;
  selectedVisibilityType: VisibilityType;
}

function PureMultimodalInput({
  chatId,
  messages,
  attachments,
  setAttachments,
  onSendMessage,
  onStopGenerating,
  isGenerating,
  canSend,
  className,
  selectedVisibilityType,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; }
  };

  const resetHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; adjustHeight(); }
  }, []);

  useEffect(() => { adjustHeight(); }, [input]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const url = URL.createObjectURL(file);
          resolve({ url, name: file.name, contentType: file.type || 'application/octet-stream', size: file.size });
        } catch {
          resolve(undefined);
        } finally {
          setUploadQueue((q) => q.filter((n) => n !== file.name));
        }
      }, 700);
    });
  };

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadQueue((q) => [...q, ...files.map((f) => f.name)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const MAX = 25 * 1024 * 1024;
    const valid = files.filter((f) => f.size <= MAX);
    const invalid = files.filter((f) => f.size > MAX);
    if (invalid.length) setUploadQueue((q) => q.filter((n) => !invalid.some((f) => f.name === n)));
    const results = await Promise.all(valid.map(uploadFile));
    setAttachments((prev) => [...prev, ...results.filter((a): a is Attachment => !!a)]);
  }, [setAttachments]);

  const handleRemove = useCallback((att: Attachment) => {
    if (att.url.startsWith('blob:')) URL.revokeObjectURL(att.url);
    setAttachments((prev) => prev.filter((a) => a.url !== att.url || a.name !== att.name));
    textareaRef.current?.focus();
  }, [setAttachments]);

  const submitForm = useCallback(() => {
    if (!input.trim() && !attachments.length) return;
    onSendMessage({ input, attachments });
    attachments.forEach((a) => { if (a.url.startsWith('blob:')) URL.revokeObjectURL(a.url); });
    setInput('');
    setAttachments([]);
    resetHeight();
    textareaRef.current?.focus();
  }, [input, attachments, onSendMessage, setAttachments, resetHeight]);

  const showSuggested = messages.length === 0 && !attachments.length && !uploadQueue.length;

  return (
    <div className={cn('relative w-full flex flex-col gap-4', className)}>
      <AnimatePresence>
        {showSuggested && (
          <motion.div
            key="suggested"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SuggestedActions
              chatId={chatId}
              selectedVisibilityType={selectedVisibilityType}
              onSelectAction={(action) => {
                setInput(action);
                requestAnimationFrame(() => { adjustHeight(); textareaRef.current?.focus(); });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={isGenerating || uploadQueue.length > 0}
        accept="image/*,video/*,audio/*,.pdf"
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-3 overflow-x-auto items-end pb-2 pt-2 pl-1">
          {attachments.map((att) => (
            <div key={att.url || att.name} className="relative group">
              <PreviewAttachment attachment={att} />
              {/* Remove attachment — critical: light red */}
              <button
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(att)}
                aria-label={`Remove ${att.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {uploadQueue.map((name, i) => (
            <PreviewAttachment
              key={`upload-${name}-${i}`}
              attachment={{ url: '', name, contentType: '', size: 0 }}
              isUploading
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={cn(
            'min-h-[52px] max-h-[calc(75dvh)] overflow-y-auto',
            'pb-12 pr-12 pl-4 pt-3.5 text-base rounded-2xl',
            'bg-white border-zinc-200 shadow-sm',
          )}
          rows={1}
          autoFocus
          disabled={!canSend || isGenerating || uploadQueue.length > 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              const ok = canSend && !isGenerating && !uploadQueue.length && (input.trim() || attachments.length);
              if (ok) submitForm();
            }
          }}
        />

        {/* Attach button — bottom left */}
        <div className="absolute bottom-2.5 left-2.5">
          <AttachmentsButton
            fileInputRef={fileInputRef}
            disabled={isGenerating || uploadQueue.length > 0}
          />
        </div>

        {/* Send / Stop — bottom right */}
        <div className="absolute bottom-2.5 right-2.5">
          {isGenerating
            ? <StopButton onStop={onStopGenerating} />
            : <SendButton submitForm={submitForm} input={input} uploadQueue={uploadQueue} attachments={attachments} canSend={canSend} isGenerating={isGenerating} />
          }
        </div>
      </div>
    </div>
  );
}

export { PureMultimodalInput };
