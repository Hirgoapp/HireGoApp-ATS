import { useState, useRef } from 'react';

interface DynamicJdEditorProps {
    value: string;
    format: 'plain' | 'markdown' | 'html';
    onContentChange: (content: string, format: string) => void;
    onFileUpload?: (file: File) => void;
}

/**
 * Dynamic JD Editor Component
 * Supports:
 * - Rich text paste with format preservation
 * - Markdown editing
 * - File upload (PDF, DOCX, TXT)
 * - Format switching
 */
export default function DynamicJdEditor({ value, format, onContentChange, onFileUpload }: DynamicJdEditorProps) {
    const [activeTab, setActiveTab] = useState<'editor' | 'upload'>('editor');
    const [selectedFormat, setSelectedFormat] = useState<string>(format);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onContentChange(e.target.value, selectedFormat);
    };

    const handleFormatChange = (newFormat: string) => {
        setSelectedFormat(newFormat);
        onContentChange(value, newFormat);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileUpload = (e?: React.MouseEvent) => {
        e?.preventDefault();
        fileInputRef.current?.click();
    };

    return (
        <div style={{ border: '2px solid #dee2e6', borderRadius: 12, overflow: 'hidden' }}>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '2px solid #dee2e6', background: '#f8f9fa' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: activeTab === 'editor' ? 'white' : 'transparent',
                        color: activeTab === 'editor' ? '#0c5ccc' : '#6c757d',
                        border: 'none',
                        borderBottom: activeTab === 'editor' ? '3px solid #0c5ccc' : '3px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    ✏️ Paste/Type JD
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: activeTab === 'upload' ? 'white' : 'transparent',
                        color: activeTab === 'upload' ? '#0c5ccc' : '#6c757d',
                        border: 'none',
                        borderBottom: activeTab === 'upload' ? '3px solid #0c5ccc' : '3px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    📎 Upload File
                </button>
            </div>

            {/* Editor Tab */}
            {activeTab === 'editor' && (
                <div style={{ padding: 20 }}>
                    {/* Format Selector */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 8 }}>
                            Format
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['plain', 'markdown', 'html'].map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => handleFormatChange(fmt)}
                                    style={{
                                        padding: '6px 16px',
                                        background: selectedFormat === fmt ? '#0c5ccc' : 'white',
                                        color: selectedFormat === fmt ? 'white' : '#6c757d',
                                        border: `2px solid ${selectedFormat === fmt ? '#0c5ccc' : '#dee2e6'}`,
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Editor */}
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 8 }}>
                            Job Description Content
                        </label>
                        <textarea
                            value={value}
                            onChange={handleTextChange}
                            rows={20}
                            placeholder={
                                selectedFormat === 'markdown'
                                    ? '# Senior Software Engineer\n\n## About the Role\nWe are seeking an experienced...\n\n## Responsibilities\n- Lead development of...\n- Mentor junior developers...'
                                    : selectedFormat === 'html'
                                        ? '<h1>Senior Software Engineer</h1>\n<h2>About the Role</h2>\n<p>We are seeking...</p>'
                                        : 'Paste or type your complete job description here...\n\nInclude all sections, headings, and formatting.\nThe system will preserve your layout.'
                            }
                            style={{
                                width: '100%',
                                padding: 12,
                                border: '2px solid #dee2e6',
                                borderRadius: 6,
                                fontSize: 14,
                                fontFamily: selectedFormat === 'html' || selectedFormat === 'markdown' ? 'monospace' : 'inherit',
                                lineHeight: 1.6,
                                resize: 'vertical',
                                outline: 'none',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#0c5ccc')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#dee2e6')}
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: '#6c757d' }}>
                            {selectedFormat === 'markdown' && '💡 Supports Markdown syntax for formatting'}
                            {selectedFormat === 'html' && '💡 Use HTML tags for rich formatting'}
                            {selectedFormat === 'plain' && '💡 Plain text with line breaks preserved'}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.eml,.msg"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    <div
                        onClick={triggerFileUpload}
                        style={{
                            border: '3px dashed #dee2e6',
                            borderRadius: 12,
                            padding: 60,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#0c5ccc';
                            e.currentTarget.style.background = '#f0f7ff';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#dee2e6';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#212529', marginBottom: 8 }}>
                            Click to upload JD file
                        </div>
                        <div style={{ fontSize: 14, color: '#6c757d', marginBottom: 16 }}>
                            or drag and drop your file here
                        </div>
                        <div style={{ fontSize: 12, color: '#adb5bd' }}>
                            Supported formats: PDF, DOCX, DOC, TXT, EML, MSG (max 5MB)
                        </div>
                    </div>

                    <div style={{ marginTop: 24, padding: 16, background: '#e7f5ff', borderRadius: 8, border: '1px solid #74c0fc' }}>
                        <div style={{ fontSize: 13, color: '#0c5ccc', fontWeight: 600, marginBottom: 8 }}>
                            ℹ️ About File Upload
                        </div>
                        <div style={{ fontSize: 13, color: '#495057', lineHeight: 1.6 }}>
                            Upload your existing JD document. The system will automatically extract text content and make it
                            searchable. Original file will be preserved for download.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
