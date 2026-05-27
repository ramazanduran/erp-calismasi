'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Send, Plus, Users, User, Circle, Paperclip, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  department: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
}

const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Zeynep Kara', status: 'online', department: 'Finans' },
  { id: 'c2', name: 'Ahmet Koç', status: 'online', department: 'Operasyon' },
  { id: 'c3', name: 'Elif Doğan', status: 'away', department: 'Satış' },
  { id: 'c4', name: 'Canan Polat', status: 'online', department: 'İK' },
  { id: 'c5', name: 'Barış Yılmaz', status: 'offline', department: 'IT' },
  { id: 'c6', name: 'Tolga Aydın', status: 'online', department: 'Satın Alma' },
];

const CONVERSATIONS: Conversation[] = [
  { id: 'conv1', type: 'direct', name: 'Zeynep Kara', participants: ['c1'], lastMessage: 'Bütçe raporunu inceledim, harika çalışma!', lastMessageTime: '10:32', unreadCount: 2, isActive: true },
  { id: 'conv2', type: 'group', name: 'Satış Ekibi', participants: ['c3', 'c1', 'c4'], lastMessage: 'Bu hafta hedef %92 tamamlandı', lastMessageTime: '09:15', unreadCount: 5, isActive: true },
  { id: 'conv3', type: 'direct', name: 'Ahmet Koç', participants: ['c2'], lastMessage: 'Üretim planı için toplantı ne zaman?', lastMessageTime: 'Dün', unreadCount: 0, isActive: true },
  { id: 'conv4', type: 'group', name: 'Proje Çekirdeği', participants: ['c2', 'c5', 'c6'], lastMessage: 'API entegrasyonu tamamlandı', lastMessageTime: 'Dün', unreadCount: 0, isActive: true },
  { id: 'conv5', type: 'direct', name: 'Canan Polat', participants: ['c4'], lastMessage: 'Yeni işe alım takvimini paylaştım', lastMessageTime: 'Pazartesi', unreadCount: 1, isActive: true },
  { id: 'conv6', type: 'direct', name: 'Barış Yılmaz', participants: ['c5'], lastMessage: 'Sunucu bakımı Cuma gecesi yapılacak', lastMessageTime: 'Pazartesi', unreadCount: 0, isActive: false },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  conv1: [
    { id: 'm1', conversationId: 'conv1', senderId: 'c1', senderName: 'Zeynep Kara', content: 'Merhaba! Mayıs ayı bütçe raporunu hazırladın mı?', timestamp: '10:20', isOwn: false, status: 'read' },
    { id: 'm2', conversationId: 'conv1', senderId: 'me', senderName: 'Ben', content: 'Evet, az önce tamamladım. Drive\'a yükledim.', timestamp: '10:24', isOwn: true, status: 'read' },
    { id: 'm3', conversationId: 'conv1', senderId: 'c1', senderName: 'Zeynep Kara', content: 'Mükemmel! Hemen inceleyeyim.', timestamp: '10:25', isOwn: false, status: 'read' },
    { id: 'm4', conversationId: 'conv1', senderId: 'me', senderName: 'Ben', content: 'Brüt marj %36.1 ile geçen yılın aynı dönemine göre 4.2 puan artmış.', timestamp: '10:28', isOwn: true, status: 'read' },
    { id: 'm5', conversationId: 'conv1', senderId: 'c1', senderName: 'Zeynep Kara', content: 'Bütçe raporunu inceledim, harika çalışma!', timestamp: '10:32', isOwn: false, status: 'delivered' },
  ],
  conv2: [
    { id: 'm10', conversationId: 'conv2', senderId: 'c3', senderName: 'Elif Doğan', content: 'Sabah toplantısı için satış rakamlarını hazırladı mı?', timestamp: '08:45', isOwn: false, status: 'read' },
    { id: 'm11', conversationId: 'conv2', senderId: 'me', senderName: 'Ben', content: 'Evet, sisteme güncelledim. Q2 hedefinin %78\'indeyiz.', timestamp: '08:52', isOwn: true, status: 'read' },
    { id: 'm12', conversationId: 'conv2', senderId: 'c1', senderName: 'Zeynep Kara', content: 'Müşteri ziyaretleri nasıl gidiyor?', timestamp: '09:10', isOwn: false, status: 'read' },
    { id: 'm13', conversationId: 'conv2', senderId: 'c3', senderName: 'Elif Doğan', content: 'Bu hafta hedef %92 tamamlandı', timestamp: '09:15', isOwn: false, status: 'delivered' },
  ],
};

const STATUS_DOT: Record<Contact['status'], string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function MessagingPage() {
  const [selectedConv, setSelectedConv] = useState<string>('conv1');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv, messages]);

  const activeConv = CONVERSATIONS.find((c) => c.id === selectedConv);
  const activeMessages = messages[selectedConv] ?? [];

  const filteredConvs = CONVERSATIONS.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!messageText.trim() || !selectedConv) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: selectedConv,
      senderId: 'me',
      senderName: 'Ben',
      content: messageText.trim(),
      timestamp: timeStr,
      isOwn: true,
      status: 'sent',
    };
    setMessages((prev) => ({
      ...prev,
      [selectedConv]: [...(prev[selectedConv] ?? []), newMsg],
    }));
    setMessageText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-80 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Mesajlar</h2>
            <button className="p-1.5 rounded-lg hover:bg-muted">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Konuşma ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv) => {
            const contact = conv.type === 'direct' ? CONTACTS.find((c) => c.id === conv.participants[0]) : null;
            const isSelected = selectedConv === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50',
                  isSelected && 'bg-primary/10 border-l-2 border-l-primary'
                )}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {conv.type === 'group' ? <Users className="h-5 w-5 text-muted-foreground" /> : getInitials(conv.name)}
                  </div>
                  {contact && (
                    <Circle className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card', STATUS_DOT[contact.status])} fill="currentColor" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0 ml-1">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1 shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Online users */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Çevrimiçi ({CONTACTS.filter(c => c.status === 'online').length})</p>
          <div className="flex gap-1.5 flex-wrap">
            {CONTACTS.filter(c => c.status === 'online').map((c) => (
              <div key={c.id} title={c.name} className="relative cursor-pointer" onClick={() => {}}>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-primary">
                  {getInitials(c.name)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Chat area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                {activeConv.type === 'group' ? <Users className="h-4 w-4" /> : getInitials(activeConv.name)}
              </div>
              <div>
                <p className="font-semibold text-sm">{activeConv.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeConv.type === 'group'
                    ? `${activeConv.participants.length + 1} katılımcı`
                    : (() => {
                        const c = CONTACTS.find((c) => c.id === activeConv.participants[0]);
                        return c ? `${c.status === 'online' ? 'Çevrimiçi' : c.status === 'away' ? 'Uzakta' : 'Çevrimdışı'} · ${c.department}` : '';
                      })()
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted"><Phone className="h-4 w-4 text-muted-foreground" /></button>
              <button className="p-2 rounded-lg hover:bg-muted"><Video className="h-4 w-4 text-muted-foreground" /></button>
              <button className="p-2 rounded-lg hover:bg-muted"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <User className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Henüz mesaj yok. İlk mesajı gönderin!</p>
              </div>
            ) : (
              activeMessages.map((msg, idx) => {
                const prevMsg = activeMessages[idx - 1];
                const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={cn('flex gap-2', msg.isOwn ? 'flex-row-reverse' : 'flex-row')}>
                    {!msg.isOwn && showSender && (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                        {getInitials(msg.senderName)}
                      </div>
                    )}
                    {!msg.isOwn && !showSender && <div className="w-7 shrink-0" />}
                    <div className={cn('max-w-xs lg:max-w-md xl:max-w-lg')}>
                      {!msg.isOwn && showSender && (
                        <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.senderName}</p>
                      )}
                      <div className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm',
                        msg.isOwn
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      )}>
                        {msg.content}
                      </div>
                      <p className={cn('text-xs text-muted-foreground mt-1', msg.isOwn ? 'text-right' : 'text-left')}>
                        {msg.timestamp}
                        {msg.isOwn && (
                          <span className="ml-1">{msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-border bg-card shrink-0">
            <div className="flex items-end gap-3">
              <button className="p-2 rounded-lg hover:bg-muted shrink-0"><Paperclip className="h-4 w-4 text-muted-foreground" /></button>
              <div className="flex-1 min-h-10 rounded-xl border border-border bg-background px-4 py-2.5 flex items-center gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Mesajınızı yazın... (Enter ile gönder)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                <button className="p-1 hover:bg-muted rounded shrink-0"><Smile className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!messageText.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Bir konuşma seçin</p>
          </div>
        </div>
      )}
    </div>
  );
}
