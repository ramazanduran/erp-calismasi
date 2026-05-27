'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ChevronDown, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar?: string;
  email?: string;
  employeeCount?: number;
  children?: OrgNode[];
}

const MOCK_ORG: OrgNode = {
  id: 'ceo',
  name: 'Mehmet Aydın',
  title: 'Genel Müdür (CEO)',
  department: 'Yönetim',
  email: 'mehmet.aydin@sirket.com',
  children: [
    {
      id: 'cfo',
      name: 'Zeynep Kara',
      title: 'CFO / Finans Direktörü',
      department: 'Finans',
      email: 'zeynep.kara@sirket.com',
      children: [
        { id: 'acc_mgr', name: 'Ali Yılmaz', title: 'Muhasebe Müdürü', department: 'Muhasebe', employeeCount: 6 },
        { id: 'fin_mgr', name: 'Fatma Demir', title: 'Finans Müdürü', department: 'Finans', employeeCount: 4 },
        { id: 'bud_mgr', name: 'Hasan Çelik', title: 'Bütçe Uzmanı', department: 'Finans', employeeCount: 2 },
      ],
    },
    {
      id: 'coo',
      name: 'Ahmet Koç',
      title: 'COO / Operasyon Direktörü',
      department: 'Operasyon',
      email: 'ahmet.koc@sirket.com',
      children: [
        {
          id: 'prod_dir',
          name: 'Murat Şahin',
          title: 'Üretim Müdürü',
          department: 'Üretim',
          email: 'murat.sahin@sirket.com',
          children: [
            { id: 'prod_sup1', name: 'Selin Arslan', title: 'Üretim Şefi - Hat A', department: 'Üretim', employeeCount: 18 },
            { id: 'prod_sup2', name: 'Emre Güler', title: 'Üretim Şefi - Hat B', department: 'Üretim', employeeCount: 15 },
            { id: 'maint_mgr', name: 'Burak Yıldız', title: 'Bakım Müdürü', department: 'Bakım', employeeCount: 8 },
          ],
        },
        {
          id: 'log_mgr',
          name: 'Derya Öztürk',
          title: 'Lojistik Müdürü',
          department: 'Lojistik',
          children: [
            { id: 'wh_mgr', name: 'Cem Kaya', title: 'Depo Yöneticisi', department: 'Lojistik', employeeCount: 12 },
            { id: 'ship_mgr', name: 'Nil Şen', title: 'Sevkiyat Şefi', department: 'Lojistik', employeeCount: 7 },
          ],
        },
        { id: 'qual_mgr', name: 'Dilek Yılmaz', title: 'Kalite Güvence Müdürü', department: 'Kalite', employeeCount: 9 },
      ],
    },
    {
      id: 'cso',
      name: 'Elif Doğan',
      title: 'CSO / Satış Direktörü',
      department: 'Satış',
      email: 'elif.dogan@sirket.com',
      children: [
        { id: 'dom_sales', name: 'Kemal Acar', title: 'Yurt İçi Satış Müdürü', department: 'Satış', employeeCount: 14 },
        { id: 'exp_sales', name: 'Leyla Özdemir', title: 'İhracat Müdürü', department: 'İhracat', employeeCount: 6 },
        { id: 'crm_mgr', name: 'Serkan Uzun', title: 'CRM Müdürü', department: 'CRM', employeeCount: 5 },
        { id: 'mkt_mgr', name: 'Güneş Aslan', title: 'Pazarlama Müdürü', department: 'Pazarlama', employeeCount: 8 },
      ],
    },
    {
      id: 'hr_dir',
      name: 'Canan Polat',
      title: 'İK Direktörü',
      department: 'İnsan Kaynakları',
      email: 'canan.polat@sirket.com',
      children: [
        { id: 'rec_mgr', name: 'Tuba Aksoy', title: 'İşe Alım Yöneticisi', department: 'İK', employeeCount: 3 },
        { id: 'pay_mgr', name: 'Oya Çınar', title: 'Bordro Uzmanı', department: 'İK', employeeCount: 2 },
        { id: 'isg_mgr', name: 'Volkan Erdoğan', title: 'İSG Uzmanı', department: 'İSG', employeeCount: 2 },
      ],
    },
    {
      id: 'cto',
      name: 'Barış Yılmaz',
      title: 'CTO / Teknoloji Direktörü',
      department: 'IT',
      email: 'baris.yilmaz@sirket.com',
      children: [
        { id: 'dev_mgr', name: 'Orhan Kılıç', title: 'Yazılım Geliştirme Müdürü', department: 'IT', employeeCount: 12 },
        { id: 'it_mgr', name: 'Pınar Demir', title: 'IT Altyapı Yöneticisi', department: 'IT', employeeCount: 5 },
      ],
    },
    {
      id: 'pur_dir',
      name: 'Tolga Aydın',
      title: 'Satın Alma Direktörü',
      department: 'Satın Alma',
      email: 'tolga.aydin@sirket.com',
      children: [
        { id: 'dom_pur', name: 'Rengin Şahin', title: 'Yurt İçi Satın Alma Müdürü', department: 'Satın Alma', employeeCount: 5 },
        { id: 'imp_mgr', name: 'Uğur Taş', title: 'İthalat Müdürü', department: 'Satın Alma', employeeCount: 4 },
      ],
    },
  ],
};

const DEPT_COLORS: Record<string, string> = {
  'Yönetim': 'border-t-purple-500',
  'Finans': 'border-t-blue-500',
  'Muhasebe': 'border-t-blue-400',
  'Üretim': 'border-t-orange-500',
  'Lojistik': 'border-t-yellow-500',
  'Kalite': 'border-t-green-500',
  'Satış': 'border-t-red-500',
  'İhracat': 'border-t-red-400',
  'CRM': 'border-t-pink-500',
  'Pazarlama': 'border-t-pink-400',
  'İnsan Kaynakları': 'border-t-teal-500',
  'İK': 'border-t-teal-400',
  'İSG': 'border-t-teal-300',
  'IT': 'border-t-indigo-500',
  'Satın Alma': 'border-t-cyan-500',
  'Operasyon': 'border-t-gray-500',
  'Bakım': 'border-t-amber-500',
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function NodeCard({ node, depth = 0, searchQuery }: { node: OrgNode; depth?: number; searchQuery: string }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const matchesSearch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.department.toLowerCase().includes(searchQuery.toLowerCase())
    : true;

  const colorClass = DEPT_COLORS[node.department] ?? 'border-t-gray-400';

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative rounded-xl border-t-4 border border-border bg-card shadow-sm p-3 w-52 select-none',
          colorClass,
          matchesSearch && searchQuery ? 'ring-2 ring-primary' : ''
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(node.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{node.name}</p>
            <p className="text-xs text-muted-foreground truncate">{node.title}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{node.department}</span>
          {node.employeeCount && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />{node.employeeCount}
            </span>
          )}
        </div>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border border-border bg-card shadow flex items-center justify-center text-muted-foreground hover:bg-muted z-10"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="relative mt-6">
          <div className="absolute top-0 left-1/2 w-px h-4 bg-border -translate-y-full" />
          <div className="flex gap-6 items-start">
            {node.children!.map((child, idx, arr) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {arr.length > 1 && (
                  <>
                    {idx === 0 && <div className="absolute top-0 right-0 h-px w-1/2 bg-border" style={{ top: '-1px' }} />}
                    {idx === arr.length - 1 && <div className="absolute top-0 left-0 h-px w-1/2 bg-border" style={{ top: '-1px' }} />}
                    {idx > 0 && idx < arr.length - 1 && <div className="absolute top-0 left-0 h-px w-full bg-border" style={{ top: '-1px' }} />}
                    <div className="absolute top-0 left-1/2 h-4 w-px bg-border -translate-x-1/2" style={{ top: '-17px' }} />
                  </>
                )}
                <NodeCard node={child} depth={depth + 1} searchQuery={searchQuery} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function countNodes(node: OrgNode): number {
  return 1 + (node.children?.reduce((s, c) => s + countNodes(c), 0) ?? 0);
}

function countDepts(node: OrgNode, depts = new Set<string>()): Set<string> {
  depts.add(node.department);
  node.children?.forEach((c) => countDepts(c, depts));
  return depts;
}

export default function OrgChartPage() {
  const [search, setSearch] = useState('');

  const { data: org = MOCK_ORG } = useQuery<OrgNode>({
    queryKey: ['org-chart'],
    queryFn: async () => {
      const res = await fetch('/api/v1/hr/org-chart');
      if (!res.ok) return MOCK_ORG;
      return res.json();
    },
    initialData: MOCK_ORG,
  });

  const totalNodes = countNodes(org);
  const departments = countDepts(org);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizasyon Şeması</h1>
          <p className="text-muted-foreground">Şirket hiyerarşisi, departmanlar ve pozisyonlar</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kişi veya departman ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Toplam Pozisyon</p></div>
          <p className="text-2xl font-bold">{totalNodes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Departman</p></div>
          <p className="text-2xl font-bold">{departments.size}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Üst Yönetim</p>
          <p className="text-2xl font-bold">{org.children?.length ?? 0} direktör</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-auto">
        <div className="min-w-max pb-8">
          <NodeCard node={org} depth={0} searchQuery={search} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold mb-3 text-sm">Departman Renk Rehberi</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(departments).map((dept) => {
            const colorClass = (DEPT_COLORS[dept] ?? 'border-t-gray-400').replace('border-t-', 'bg-');
            return (
              <span key={dept} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">
                <span className={cn('h-2 w-2 rounded-full', colorClass)} />
                {dept}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
