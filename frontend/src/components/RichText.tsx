import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Bold, CaseSensitive, Highlighter, Italic, Underline } from 'lucide-react'

type RichTextAreaProps = {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  required?: boolean
  placeholder?: string
  className?: string
}

type TextFormat = 'bold' | 'italic' | 'underline' | 'highlight'

const formatMarkers: Array<{ opening: string; closing: string; format: TextFormat }> = [
  { opening: '{{bold}}', closing: '{{/bold}}', format: 'bold' },
  { opening: '{{italic}}', closing: '{{/italic}}', format: 'italic' },
  { opening: '{{underline}}', closing: '{{/underline}}', format: 'underline' },
  { opening: '{{highlight}}', closing: '{{/highlight}}', format: 'highlight' },
]

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function formattedTextToHtml(text: string): string {
  let html = ''
  let index = 0

  while (index < text.length) {
    const colorOpening = text.slice(index).match(/^\{\{(color|highlight):(#[\da-fA-F]{6})\}\}/)
    const marker = formatMarkers.find(({ opening }) => text.startsWith(opening, index))
    const opening = colorOpening?.[0] ?? marker?.opening

    if (opening) {
      const format = colorOpening?.[1] ?? marker?.format
      const color = colorOpening?.[2]
      const closing = colorOpening ? `{{/${format}}}` : marker?.closing
      const contentStart = index + opening.length
      const closeIndex = closing ? text.indexOf(closing, contentStart) : -1
      if (closeIndex !== -1 && closing) {
        const content = formattedTextToHtml(text.slice(contentStart, closeIndex))
        if (color) {
          const style = format === 'color'
            ? `color:${color}`
            : `background-color:${color};border-radius:2px;box-shadow:0 0 0 2px ${color}`
          html += `<span style="${style}">${content}</span>`
        } else if (format === 'bold') {
          html += `<strong>${content}</strong>`
        } else if (format === 'italic') {
          html += `<em>${content}</em>`
        } else if (format === 'underline') {
          html += `<u>${content}</u>`
        } else {
          html += `<span class="rich-text-highlight">${content}</span>`
        }
        index = closeIndex + closing.length
        continue
      }
    }

    if (text[index] === '\n') {
      html += '<br>'
    } else {
      html += escapeHtml(text[index])
    }
    index += 1
  }

  return html
}

function colorToHex(color: string) {
  const hex = color.match(/^#([\da-f]{6})$/i)
  if (hex) return `#${hex[1].toUpperCase()}`
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!rgb) return undefined
  return `#${rgb.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (!(node instanceof HTMLElement)) return ''

  if (node.tagName === 'BR') return '\n'

  const content = Array.from(node.childNodes).map(serializeNode).join('')
  const style = node.style
  const textColor = colorToHex(style.color)
  const backgroundColor = colorToHex(style.backgroundColor)

  if (node.tagName === 'B' || node.tagName === 'STRONG') return `{{bold}}${content}{{/bold}}`
  if (node.tagName === 'I' || node.tagName === 'EM') return `{{italic}}${content}{{/italic}}`
  if (node.tagName === 'U') return `{{underline}}${content}{{/underline}}`
  if (node.classList.contains('rich-text-highlight')) return `{{highlight}}${content}{{/highlight}}`
  if (node.tagName === 'FONT') {
    const fontColor = colorToHex(node.getAttribute('color') ?? '')
    if (fontColor) return `{{color:${fontColor}}}${content}{{/color}}`
  }
  if (textColor) return `{{color:${textColor}}}${content}{{/color}}`
  if (backgroundColor) return `{{highlight:${backgroundColor}}}${content}{{/highlight}}`
  if (node.tagName === 'DIV' || node.tagName === 'P') return `${content}\n`
  return content
}

function plainTextFromEditor(editor: HTMLDivElement) {
  return editor.innerText.replace(/\r/g, '')
}

export function RichTextArea({ value, onChange, maxLength, required, placeholder, className }: RichTextAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedValue = useRef<string | null>(null)
  const [plainText, setPlainText] = useState('')
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false })
  const text = typeof value === 'string' ? value : ''

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || text === lastEmittedValue.current) return
    editor.innerHTML = formattedTextToHtml(text)
    lastEmittedValue.current = text
    setPlainText(plainTextFromEditor(editor))
  }, [text])

  function updateActiveFormats() {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  function handleInput() {
    const editor = editorRef.current
    if (!editor) return
    const nextPlainText = plainTextFromEditor(editor)
    if (maxLength !== undefined && nextPlainText.length > maxLength) {
      editor.innerHTML = formattedTextToHtml(lastEmittedValue.current)
      return
    }
    const nextValue = Array.from(editor.childNodes).map(serializeNode).join('')
    lastEmittedValue.current = nextValue
    setPlainText(nextPlainText)
    onChange(nextValue)
    updateActiveFormats()
  }

  function applyCommand(command: string, commandValue?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    handleInput()
    updateActiveFormats()
  }

  function formatButton(format: 'bold' | 'italic' | 'underline', label: string, icon: ReactNode) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={activeFormats[format]}
        className={activeFormats[format] ? 'is-active' : undefined}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applyCommand(format)}
      >
        {icon}
      </button>
    )
  }

  return (
    <div className={`rich-text-editor${className ? ` ${className}` : ''}`}>
      <div className="rich-text-toolbar" role="toolbar" aria-label="Text formatting">
        {formatButton('bold', 'Bold', <Bold size={16} aria-hidden="true" />)}
        {formatButton('italic', 'Italic', <Italic size={16} aria-hidden="true" />)}
        {formatButton('underline', 'Underline', <Underline size={16} aria-hidden="true" />)}
        <label className="rich-text-color-control" title="Highlight color">
          <Highlighter size={16} aria-hidden="true" />
          <input
            type="color"
            aria-label="Highlight color"
            defaultValue="#fff09a"
            onInput={(event) => applyCommand('hiliteColor', event.currentTarget.value)}
          />
        </label>
        <label className="rich-text-color-control" title="Text color">
          <CaseSensitive size={17} aria-hidden="true" />
          <input
            type="color"
            aria-label="Text color"
            defaultValue="#39815d"
            onInput={(event) => applyCommand('foreColor', event.currentTarget.value)}
          />
        </label>
      </div>
      <div
        ref={editorRef}
        className="rich-text-content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-required={required}
        aria-label={placeholder ?? 'Description'}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onSelect={updateActiveFormats}
        onBlur={updateActiveFormats}
      />
      {required && (
        <textarea
          className="rich-text-validation"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={plainText}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault()
            editorRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}

type FormattedTextProps = {
  text: string
  className?: string
  as?: 'div' | 'p' | 'span'
}

type FormatStyle = CSSProperties & {
  backgroundColor?: string
  color?: string
}

function parseFormattedText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let plainText = ''
  let index = 0

  const flushPlainText = () => {
    if (plainText) {
      nodes.push(plainText)
      plainText = ''
    }
  }

  while (index < text.length) {
    const colorOpening = text.slice(index).match(/^\{\{(color|highlight):(#[\da-fA-F]{6})\}\}/)
    if (colorOpening) {
      const closeMarker = `{{/${colorOpening[1]}}}`
      const contentStart = index + colorOpening[0].length
      const closeIndex = text.indexOf(closeMarker, contentStart)
      if (closeIndex !== -1) {
        flushPlainText()
        const style: FormatStyle = colorOpening[1] === 'color'
          ? { color: colorOpening[2] }
          : { backgroundColor: colorOpening[2], borderRadius: '2px', boxShadow: '0 0 0 2px ' + colorOpening[2] }
        nodes.push(
          <span key={`${keyPrefix}-${index}`} style={style}>
            {parseFormattedText(text.slice(contentStart, closeIndex), `${keyPrefix}-${index}`)}
          </span>,
        )
        index = closeIndex + closeMarker.length
        continue
      }
    }

    const marker = formatMarkers.find(({ opening }) => text.startsWith(opening, index))
    if (marker) {
      const contentStart = index + marker.opening.length
      const closeIndex = text.indexOf(marker.closing, contentStart)
      if (closeIndex !== -1 && closeIndex >= contentStart) {
        flushPlainText()
        const content = parseFormattedText(text.slice(contentStart, closeIndex), `${keyPrefix}-${index}`)
        const className = marker.format === 'italic'
          ? 'rich-text-italic'
          : marker.format === 'underline'
            ? 'rich-text-underline'
            : marker.format === 'highlight'
              ? 'rich-text-highlight'
              : undefined
        nodes.push(marker.format === 'bold'
          ? <strong key={`${keyPrefix}-${index}`}>{content}</strong>
          : <span key={`${keyPrefix}-${index}`} className={className}>{content}</span>)
        index = closeIndex + marker.closing.length
        continue
      }
    }

    plainText += text[index]
    index += 1
  }

  flushPlainText()
  return nodes
}

export function FormattedText({ text, className, as = 'span' }: FormattedTextProps) {
  const Tag = as
  return <Tag className={className}>{parseFormattedText(text, 'formatted')}</Tag>
}
