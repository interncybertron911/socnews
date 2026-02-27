export function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 80);
}

export function buildYamlLink(sourcePath: string): string {
    // link ไปที่ GitHub viewer ของ SigmaHQ
    return `https://github.com/SigmaHQ/sigma/blob/master/${sourcePath}`;
}

export function buildText(title: string, tags: string[] = [], logsource: any = {}): string {
    const ls = [
        logsource?.product,
        logsource?.service,
        logsource?.category,
    ]
        .filter(Boolean)
        .join(" ");

    return [title, tags.join(" "), ls].filter(Boolean).join(" ");
}
