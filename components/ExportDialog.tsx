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
        setUserName(user.user_metadata?.name || user.email || 'User');
      }
    };
    getUser();
  }, [supabase.auth]);

  if (!isOpen) return null;

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
        content += `${role}:\n${msg.content}\n\n`;
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
        // PDF格式 - 使用浏览器打印功能
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                .message { margin-bottom: 30px; }
                .role { font-weight: bold; color: #555; margin-bottom: 5px; }
                .content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${conversationTitle}</h1>
              ${conversation.messages.map((msg: { role: string; content: string }) => `
                <div class="message">
                  <div class="role">${msg.role === 'user' ? userName : 'Resonance'}:</div>
                  <div class="content">${msg.content.replace(/\n/g, '<br>')}</div>
                </div>
              `).join('')}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } else if (selectedFormat === 'docx') {
        // DOCX格式 - 创建简单的HTML格式下载（浏览器会处理）
        const htmlContent = `
          <!DOCTYPE html>
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head><meta charset='utf-8'></head>
          <body>
            <h1>${conversationTitle}</h1>
            ${conversation.messages.map((msg: { role: string; content: string }) => `
              <p><strong>${msg.role === 'user' ? userName : 'Resonance'}:</strong></p>
              <p>${msg.content.replace(/\n/g, '<br>')}</p>
            `).join('')}
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
                ? '文件将下载到浏览器默认下载位置'
                : 'File will be downloaded to your browser\'s default download location'}
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
