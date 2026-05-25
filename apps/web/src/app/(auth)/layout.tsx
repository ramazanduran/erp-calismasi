export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="h-8 w-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-bold">E</span>
          </div>
          <span>ERP System</span>
        </div>

        <div className="space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Evrensel, dinamik ve modüler — işletmenizin tüm süreçlerini tek platformda yönetin.&rdquo;
            </p>
          </blockquote>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Modül', value: '12+' },
              { label: 'Entegrasyon', value: '50+' },
              { label: 'Kullanıcı', value: '10K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 rounded-lg p-3">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} ERP System. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Right panel - auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
