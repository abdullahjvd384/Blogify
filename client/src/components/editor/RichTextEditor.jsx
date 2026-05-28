import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Minus,
  Loader2,
} from 'lucide-react';
import { useUploadImage } from '@/features/uploads/hooks';
import { cn } from '@/lib/cn';

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: false, // configured explicitly below
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
  }),
  Image.configure({ inline: false, allowBase64: false }),
  Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
  Placeholder.configure({ placeholder: 'Tell your story…' }),
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition disabled:opacity-40 dark:text-slate-300',
        active
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />;
}

export function RichTextEditor({ value, onChange, editable = true }) {
  const lastEmitted = useRef(value || '');
  // True while we programmatically load content (async draft load) so the
  // resulting update doesn't fire onChange and falsely mark the draft dirty.
  const programmatic = useRef(false);
  const upload = useUploadImage();
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions,
    content: value || '',
    editable,
    editorProps: {
      attributes: {
        class:
          'article-body font-serif text-[1.075rem] leading-[1.85] text-slate-700 dark:text-slate-300 min-h-[320px] focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmitted.current = html;
      if (programmatic.current) return;
      onChange?.(html, ed.getText());
    },
  });

  // Sync external value changes (e.g. async draft load) without clobbering typing.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== lastEmitted.current && incoming !== editor.getHTML()) {
      programmatic.current = true;
      editor.commands.setContent(incoming);
      programmatic.current = false;
      lastEmitted.current = incoming;
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  function setLink() {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Links must start with http:// or https://');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function addYoutube() {
    const url = window.prompt('YouTube video URL');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await upload.mutateAsync({ file, kind: 'inline' });
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      {editable && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16} />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={16} />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 size={16} />
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Insert image" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
            {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          </ToolbarButton>
          <ToolbarButton title="Embed YouTube video" onClick={addYoutube}>
            <YoutubeIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={16} />
          </ToolbarButton>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </div>
      )}
      <div className="px-4 py-4 sm:px-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
