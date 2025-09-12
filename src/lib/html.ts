export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return value.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => {
    const val = values[i];
    if (val === undefined || val === null) {
      return result + str;
    }
    return result + str + escapeHtml(String(val));
  }, '');
}
