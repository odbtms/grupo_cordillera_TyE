import type { ReactNode } from 'react'

type AdminLayoutProps = {
  children: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="app-shell">{children}</div>
}

export default AdminLayout
