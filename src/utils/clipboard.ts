/** Copies text to the clipboard, silently ignoring permission errors. */
export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}
