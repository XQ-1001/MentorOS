'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  language: Language;
  isDarkMode?: boolean;
}

type ExportFormat = 'txt' | 'pdf' | 'docx';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  language,
  isDarkMode = true
}) => {
  const supabase = createClient();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState<string>('');

  // 生成默认文件名
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const defaultFileName = `Resonance Lab_${conversationTitle}_${dateStr}`;

  // 可编辑的文件名
  const [fileName, setFileName] = useState(defaultFileName);

  const t = {
    title: language === 'zh' ? '导出对话' : 'Export Conversation',
    format: language === 'zh' ? '选择格式' : 'Select Format',
    location: language === 'zh' ? '保存位置' : 'Save Location',
    fileName: language === 'zh' ? '文件名' : 'File Name',
    cancel: language === 'zh' ? '取消' : 'Cancel',
    export: language === 'zh' ? '导出' : 'Export',
    exporting: language === 'zh' ? '导出中...' : 'Exporting...',
    browserDownload: language === 'zh' ? '浏览器下载文件夹' : 'Browser Downloads Folder',
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user's display name from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        // Use display_name from profile, fallback to email
        setUserName(profile?.display_name || user.email || 'User');
      }
    };
    getUser();
  }, [supabase]);

  if (!isOpen) return null;

  // Convert Markdown formatting to HTML
  const convertMarkdownToHtml = (text: string): string => {
    return text
      // Bold: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text* -> <em>$1</em> (but avoid matching ** inside)
      .replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  // Remove Markdown formatting for plain text
  const removeMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(?!\*)(.*?)\*(?!\*)/g, '$1');  // Remove italic markers
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage('');

    try {
      // 获取对话完整内容
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');

      const data = await response.json();
      const conversation = data.conversation;

      // 格式化对话内容
      let content = `${conversationTitle}\n${'='.repeat(50)}\n\n`;

      conversation.messages.forEach((msg: { role: string; content: string }) => {
        const role = msg.role === 'user' ? userName : 'Resonance';
        // Remove Markdown formatting for plain text
        content += `${role}:\n${removeMarkdown(msg.content)}\n\n`;
      });

      // 根据格式导出
      if (selectedFormat === 'txt') {
        // TXT格式
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (selectedFormat === 'pdf') {
        // PDF格式 - 使用浏览器打印功能，专业剧本式布局
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // 获取会话日期
          const sessionDate = new Date(conversation.createdAt || Date.now());
          const dateStr = language === 'zh'
            ? `会话日期：${sessionDate.getFullYear()}年${sessionDate.getMonth() + 1}月${sessionDate.getDate()}日`
            : `Session Date: ${sessionDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;

          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${fileName}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
              <style>
                @page {
                  margin: 2.5cm 2.5cm 3cm 2.5cm;
                  @top-center {
                    content: "RESONANCE LAB";
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    color: #854D0E;
                    font-size: 10pt;
                    letter-spacing: 1px;
                  }
                  @bottom-center {
                    content: "Generated by Resonance Lab";
                    font-family: 'Inter', sans-serif;
                    font-size: 8pt;
                    color: #999;
                  }
                }
                body {
                  font-family: 'Merriweather', Georgia, serif;
                  line-height: 1.6;
                  color: #18181b;
                  margin: 0;
                  padding: 0;
                }
                .page-header {
                  position: fixed;
                  top: -2.5cm;
                  left: 0;
                  right: 0;
                  text-align: center;
                  padding: 10px 0;
                }
                .logo {
                  font-family: 'Inter', sans-serif;
                  font-size: 10pt;
                  font-weight: 700;
                  color: #854D0E;
                  letter-spacing: 1px;
                }
                .page-footer {
                  position: fixed;
                  bottom: -2cm;
                  left: 0;
                  right: 0;
                  text-align: center;
                  font-family: 'Inter', sans-serif;
                  font-size: 8pt;
                  color: #999;
                  padding: 10px 0;
                }
                .content {
                  margin-top: 20px;
                }
                .title {
                  text-align: center;
                  font-family: 'Inter', sans-serif;
                  font-size: 18pt;
                  font-weight: 600;
                  color: #18181b;
                  margin: 0 0 5px 0;
                }
                .session-info {
                  text-align: right;
                  font-family: 'Inter', sans-serif;
                  font-size: 8pt;
                  color: #666;
                  margin: 5px 0 15px 0;
                }
                .divider {
                  border: none;
                  border-top: 0.5px solid #B45309;
                  margin: 0 0 30px 0;
                }
                .conversation {
                  margin-bottom: 25px;
                }
                .message {
                  display: table;
                  width: 100%;
                  margin-bottom: 20px;
                  page-break-inside: avoid;
                }
                .speaker {
                  display: table-cell;
                  width: 20%;
                  padding-right: 15px;
                  font-family: 'Inter', sans-serif;
                  font-weight: 700;
                  font-size: 11pt;
                  color: #854D0E;
                  text-align: right;
                  vertical-align: top;
                  text-transform: uppercase;
                }
                .dialogue {
                  display: table-cell;
                  width: 80%;
                  font-size: 11pt;
                  line-height: 1.6;
                }
                .dialogue strong {
                  font-weight: 700;
                  color: #854D0E;
                }
                @media print {
                  .page-header {
                    position: fixed;
                    top: 0;
                  }
                  .page-footer {
                    position: fixed;
                    bottom: 0;
                  }
                }
              </style>
            </head>
            <body>
              <div class="content">
                <h1 class="title">${conversationTitle}</h1>
                <div class="session-info">${dateStr}</div>
                <hr class="divider">

                <div class="conversation">
                  ${conversation.messages.map((msg: { role: string; content: string }) => `
                    <div class="message">
                      <div class="speaker">${msg.role === 'user' ? userName.toUpperCase() : 'RESONANCE'}</div>
                      <div class="dialogue">${convertMarkdownToHtml(msg.content)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } else if (selectedFormat === 'docx') {
        // DOCX格式 - 专业剧本式布局
        // 获取会话日期
        const sessionDate = new Date(conversation.createdAt || Date.now());
        const dateStr = language === 'zh'
          ? `会话日期：${sessionDate.getFullYear()}年${sessionDate.getMonth() + 1}月${sessionDate.getDate()}日`
          : `Session Date: ${sessionDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;

        const htmlContent = `
          <!DOCTYPE html>
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head>
            <meta charset='utf-8'>
            <xml>
              <w:worddocument>
                <w:view>Print</w:view>
                <w:donotembedsmartags/>
              </w:worddocument>
            </xml>
            <style>
              @page {
                margin: 2.5cm 2.5cm 3cm 2.5cm;
                mso-header-margin: 1.5cm;
                mso-footer-margin: 1cm;
              }
              @page Section1 {
                mso-header: h1;
                mso-footer: f1;
              }
              div.Section1 { page: Section1; }

              body {
                font-family: Georgia, 'Times New Roman', serif;
                line-height: 1.6;
                color: #18181b;
              }

              /* 页眉 */
              p.header {
                text-align: center;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 10pt;
                color: #854D0E;
                letter-spacing: 1px;
                margin: 0;
                mso-element: header;
              }

              /* 页脚 */
              p.footer {
                text-align: center;
                font-family: Arial, sans-serif;
                font-size: 8pt;
                color: #999;
                margin: 0;
                mso-element: footer;
              }

              .title {
                text-align: center;
                font-family: Arial, sans-serif;
                font-size: 18pt;
                font-weight: bold;
                color: #18181b;
                margin: 0 0 5px 0;
              }

              .session-info {
                text-align: right;
                font-family: Arial, sans-serif;
                font-size: 8pt;
                color: #666;
                margin: 5px 0 15px 0;
              }

              .divider {
                border: none;
                border-top: 0.5px solid #B45309;
                margin: 0 0 30px 0;
              }

              .message {
                margin-bottom: 20px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
              }

              .speaker {
                width: 20%;
                padding-right: 15px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 11pt;
                color: #854D0E;
                text-align: right;
                vertical-align: top;
                text-transform: uppercase;
              }

              .dialogue {
                width: 80%;
                font-size: 11pt;
                line-height: 1.6;
              }

              .dialogue strong {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="Section1">
              <!-- 正文内容 -->
              <h1 class="title">${conversationTitle}</h1>
              <div class="session-info">${dateStr}</div>
              <hr class="divider">

              ${conversation.messages.map((msg: { role: string; content: string }) => `
                <table class="message">
                  <tr>
                    <td class="speaker">${msg.role === 'user' ? userName.toUpperCase() : 'RESONANCE'}</td>
                    <td class="dialogue">${convertMarkdownToHtml(msg.content)}</td>
                  </tr>
                </table>
              `).join('')}
            </div>
          </body>
          </html>
        `;
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setMessage(language === 'zh' ? '导出成功！' : 'Export successful!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      setMessage(language === 'zh' ? '导出失败，请重试' : 'Export failed, please try again');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-black/50'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-[#1C1C1E] border border-[#2C2C2E]'
            : 'bg-white border border-zinc-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-semibold ${
              isDarkMode ? 'text-[#EDEDED]' : 'text-zinc-900'
            }`}
          >
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-[#2C2C2E] text-zinc-500'
                : 'hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* File Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.fileName}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-[#EDEDED] focus:border-[#FCD34D]'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#B45309]'
              }`}
            />
          </div>

          {/* Format Selection */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.format}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['txt', 'pdf', 'docx'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedFormat === format
                      ? isDarkMode
                        ? 'bg-[#FCD34D]/20 border-[#FCD34D] text-[#FCD34D]'
                        : 'bg-[#B45309]/20 border-[#B45309] text-[#B45309]'
                      : isDarkMode
                      ? 'bg-transparent border-[#2C2C2E] text-zinc-400 hover:bg-[#1C1C1E]'
                      : 'bg-transparent border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Save Location Info */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {t.location}
            </label>
            <div
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#0A0A0A] border-[#2C2C2E] text-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-500'
              }`}
            >
              {t.browserDownload}
            </div>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? 'text-zinc-600' : 'text-zinc-500'
              }`}
            >
              {language === 'zh'
                ? '文件将下载到浏览器设置的下载位置。如需选择保存位置，请在浏览器设置中启用"下载前询问每个文件的保存位置"。'
                : 'File will be downloaded to your browser\'s download location. To choose save location, enable "Ask where to save each file before downloading" in your browser settings.'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <p
              className={`text-sm text-center ${
                message.includes('成功') || message.includes('successful')
                  ? 'text-green-500'
                  : isDarkMode
                  ? 'text-red-400'
                  : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-transparent border-[#2C2C2E] text-[#EDEDED] hover:bg-[#1C1C1E]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isExporting
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isDarkMode
                  ? 'bg-[#FCD34D]/20 border border-[#FCD34D]/30 text-[#FCD34D] hover:bg-[#FCD34D]/30'
                  : 'bg-[#B45309]/20 border border-[#B45309]/30 text-[#B45309] hover:bg-[#B45309]/30'
              }`}
            >
              {isExporting ? t.exporting : t.export}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
