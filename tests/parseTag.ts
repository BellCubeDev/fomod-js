const parser = new DOMParser();

export default function parseTag(literals: TemplateStringsArray, ...expressions: string[]) {
    let str = '';
    literals.forEach((string, i) => {
        str += string + (expressions[i] ?? '');
    });
    const doc = parser.parseFromString(str, 'text/xml');
    return doc.documentElement;
}
