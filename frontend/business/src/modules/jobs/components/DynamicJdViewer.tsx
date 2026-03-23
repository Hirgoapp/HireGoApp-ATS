import ReactMarkdown from 'react-markdown';

interface DynamicJdViewerProps {
    content: string;
    format: 'plain' | 'markdown' | 'html' | 'structured';
    sections?: Array<{
        heading: string;
        content: string;
        order: number;
        type?: string;
    }>;
}

/**
 * Dynamic JD Viewer Component
 * Renders JD content based on format
 * Supports: plain text, markdown, HTML, structured sections
 */
export default function DynamicJdViewer({ content, format, sections }: DynamicJdViewerProps) {
    // Render structured sections if available
    if (format === 'structured' && sections && sections.length > 0) {
        return (
            <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
                {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: index < sections.length - 1 ? 32 : 0,
                                paddingBottom: index < sections.length - 1 ? 24 : 0,
                                borderBottom: index < sections.length - 1 ? '1px solid #e9ecef' : 'none',
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: '#212529',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                {getSectionIcon(section.type)}
                                {section.heading}
                            </h2>
                            <div
                                style={{
                                    fontSize: 15,
                                    lineHeight: 1.8,
                                    color: '#495057',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {formatSectionContent(section.content)}
                            </div>
                        </div>
                    ))}
            </div>
        );
    }

    // Render markdown
    if (format === 'markdown') {
        return (
            <div
                style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 24,
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: '#495057',
                }}
                className="markdown-content"
            >
                <ReactMarkdown
                    components={{
                        h1: ({ node, ...props }) => (
                            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#212529', marginTop: 0, marginBottom: 16 }} {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#212529', marginTop: 24, marginBottom: 12 }} {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#212529', marginTop: 20, marginBottom: 10 }} {...props} />
                        ),
                        p: ({ node, ...props }) => <p style={{ marginBottom: 12 }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ marginLeft: 24, marginBottom: 12 }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ marginLeft: 24, marginBottom: 12 }} {...props} />,
                        li: ({ node, ...props }) => <li style={{ marginBottom: 6 }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: '#212529' }} {...props} />,
                        em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                        code: ({ node, ...props }) => (
                            <code
                                style={{
                                    background: '#f8f9fa',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontSize: 13,
                                    fontFamily: 'monospace',
                                }}
                                {...props}
                            />
                        ),
                        pre: ({ node, ...props }) => (
                            <pre
                                style={{
                                    background: '#f8f9fa',
                                    padding: 16,
                                    borderRadius: 8,
                                    overflow: 'auto',
                                    fontSize: 13,
                                    fontFamily: 'monospace',
                                }}
                                {...props}
                            />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }

    // Render HTML (sanitized)
    if (format === 'html') {
        return (
            <div
                style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 24,
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: '#495057',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />
        );
    }

    // Render plain text with preserved formatting
    return (
        <div
            style={{
                background: 'white',
                borderRadius: 12,
                padding: 24,
                fontSize: 15,
                lineHeight: 1.8,
                color: '#495057',
                whiteSpace: 'pre-wrap',
            }}
        >
            {content}
        </div>
    );
}

// Helper: Get icon for section type
function getSectionIcon(type?: string): string {
    const icons: Record<string, string> = {
        about: '📋',
        responsibilities: '✅',
        qualifications: '🎓',
        preferred: '⭐',
        benefits: '🎁',
        company: '🏢',
        description: '📄',
    };
    return icons[type || 'description'] || '📌';
}

// Helper: Format section content (detect and render lists)
function formatSectionContent(content: string): JSX.Element {
    // Split by lines and detect bullet points
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];

    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Detect unordered list
        if (trimmed.match(/^[•\-\*]\s/)) {
            if (listType !== 'ul') {
                if (currentList.length > 0) {
                    elements.push(renderList(currentList, listType!));
                    currentList = [];
                }
                listType = 'ul';
            }
            currentList.push(trimmed.replace(/^[•\-\*]\s/, ''));
        }
        // Detect ordered list
        else if (trimmed.match(/^\d+[\.\)]\s/)) {
            if (listType !== 'ol') {
                if (currentList.length > 0) {
                    elements.push(renderList(currentList, listType!));
                    currentList = [];
                }
                listType = 'ol';
            }
            currentList.push(trimmed.replace(/^\d+[\.\)]\s/, ''));
        }
        // Regular paragraph
        else {
            if (currentList.length > 0) {
                elements.push(renderList(currentList, listType!));
                currentList = [];
                listType = null;
            }
            if (trimmed) {
                elements.push(<p key={`p-${index}`} style={{ marginBottom: 8 }}>{trimmed}</p>);
            }
        }
    });

    // Flush remaining list
    if (currentList.length > 0) {
        elements.push(renderList(currentList, listType!));
    }

    return <>{elements}</>;
}

// Helper: Render list
function renderList(items: string[], type: 'ul' | 'ol'): JSX.Element {
    const ListTag = type;
    return (
        <ListTag key={`list-${Math.random()}`} style={{ marginLeft: 24, marginBottom: 12 }}>
            {items.map((item, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                    {item}
                </li>
            ))}
        </ListTag>
    );
}

// Helper: Sanitize HTML (basic sanitization - use DOMPurify in production)
function sanitizeHtml(html: string): string {
    // Basic sanitization - remove script tags and dangerous attributes
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
}
