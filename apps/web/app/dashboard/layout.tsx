import { ReactNode } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'

export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
