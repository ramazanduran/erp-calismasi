'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Send, Sparkles, User, RotateCcw, Copy, ThumbsUp, ThumbsDown,
  BarChart3, Package, DollarSign, Users, ChevronRight, Loader2,
  FileText, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'up' | 'down';
  sources?: Array<{ module: string; label: string }>;
}

interface QuickPrompt {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: 'Stok durumunu özetle', prompt: 'Bu ayki stok durumunu ve kritik seviyelerdeki ürünleri özetle.', icon: Package, category: 'Stok' },
  { label: 'Satış analizi yap', prompt: 'Son 30 günlük satış performansını analiz et ve önemli trendleri belirt.', icon: TrendingUp, category: 'Satış' },
  { label: 'Gecikmiş ödemeleri listele', prompt: 'Vadesi geçmiş alacak ve borçları listele.', icon: DollarSign, category: 'Finans' },
  { label: 'Açık siparişler', prompt: 'Bugün teslim edilmesi gereken veya geciken siparişleri listele.', icon: FileText, category: 'Sipariş' },
  { label: 'Personel devamsızlık raporu', prompt: 'Bu ay personel devamsızlık raporunu hazırla.', icon: Users, category: 'İK' },
  { label: 'Stok anomalisi var mı?', prompt: 'Son 7 günde anormal stok hareketleri veya negatif stok durumu tespit et.', icon: AlertTriangle, category: 'Uyarı' },
  { label: 'KPI özeti', prompt: 'Şirketin bu ayki KPI hedeflerine göre durumunu özetle.', icon: BarChart3, category: 'KPI' },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: 'Üzgünüm, bu soruyu şu an yanıtlayamıyorum. Lütfen tekrar deneyin veya daha spesifik bir soru sorun.',
  stok: `**Stok Durumu Özeti — Mayıs 2026**

Kritik Düzeydeki Ürünler (Minimum Stok Altı):
- **A-101 Bilgisayar Kasası** — Mevcut: 3 adet, Min: 10 adet ⚠️
- **B-205 USB Hub** — Mevcut: 0 adet, Min: 5 adet 🔴
- **C-312 Klavye** — Mevcut: 7 adet, Min: 15 adet ⚠️

Toplam aktif ürün sayısı: **1.248**
Kritik stok sayısı: **23 ürün**
Stok değeri: **₺4.850.000**

En hızlı tükenen kategoriler: Elektronik, Aksesuar

💡 Öneri: B-205 USB Hub için acil satın alma talebi oluşturulmasını öneriyorum.`,
  satış: `**Satış Analizi — Son 30 Gün**

📈 Toplam Satış: **₺2.340.000** (+12% önceki aya göre)
📦 Sipariş Sayısı: **387 sipariş**
👥 Aktif Müşteri: **142**

En çok satan ürünler:
1. Dizüstü Bilgisayar — 85 adet
2. Monitör — 62 adet
3. Klavye & Mouse Set — 54 adet

Bölgesel dağılım:
- İstanbul: %42
- Ankara: %23
- İzmir: %15
- Diğer: %20

⚠️ Dikkat: Geçen aya kıyasla iade oranı %3'ten %5'e yükseldi. Müşteri şikayetleri incelenmeli.`,
};

function getResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('stok') || lower.includes('ürün')) return MOCK_RESPONSES.stok;
  if (lower.includes('satış') || lower.includes('sipariş')) return MOCK_RESPONSES.satış;
  return MOCK_RESPONSES.default;
}

function MessageBubble({ message, onFeedback }: { message: Message; onFeedback: (id: string, type: 'up' | 'down') => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (/^\d+\./.test(line)) {
        return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      if (line === '') return <br key={i} />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="rounded-xl rounded-br-sm bg-primary text-primary-foreground px-4 py-3 text-sm">
            {message.content}
          </div>
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="group">
          <div className="rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm space-y-1">
            {renderContent(message.content)}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1">
                {message.sources.map((s, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="rounded p-1 hover:bg-muted text-muted-foreground" title="Kopyala">
              <Copy className="h-3.5 w-3.5" />
            </button>
            {copied && <span className="text-xs text-muted-foreground">Kopyalandı!</span>}
            <button onClick={() => onFeedback(message.id, 'up')}
              className={cn('rounded p-1 hover:bg-muted transition-colors', message.feedback === 'up' ? 'text-green-600' : 'text-muted-foreground')}>
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onFeedback(message.id, 'down')}
              className={cn('rounded p-1 hover:bg-muted transition-colors', message.feedback === 'down' ? 'text-red-600' : 'text-muted-foreground')}>
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Merhaba! Ben ERP AI Asistanınızım. Stok durumu, satış analizi, finansal raporlar ve daha fazlası hakkında sorularınızı yanıtlayabilirim. Nasıl yardımcı olabilirim?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const response = getResponse(prompt);
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      sources: [{ module: 'inventory', label: 'Stok Modülü' }, { module: 'sales', label: 'Satış Modülü' }],
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, feedback: type } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: 'Sohbet sıfırlandı. Size nasıl yardımcı olabilirim?',
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ERP AI Asistanı</h1>
            <p className="text-xs text-muted-foreground">Verilerinizi analiz edin, içgörüler edinin</p>
          </div>
        </div>
        <button onClick={handleReset} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {QUICK_PROMPTS.map((qp, i) => {
          const Icon = qp.icon;
          return (
            <button
              key={i}
              onClick={() => sendMessage(qp.prompt)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-muted transition-colors shrink-0"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {qp.label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card/50 p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onFeedback={handleFeedback} />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-3 items-end">
        <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir şey sorun... (Enter ile gönder, Shift+Enter ile yeni satır)"
            rows={1}
            className="w-full resize-none bg-transparent text-sm focus:outline-none max-h-32"
            style={{ minHeight: '24px' }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="rounded-xl bg-primary text-primary-foreground p-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
