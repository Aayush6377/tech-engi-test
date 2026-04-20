import DashboardShell from '@/components/layout/DashboardShell'
import RoleDashboard from '@/components/RoleDashboard'
import React from 'react'

const page = () => {
  return (
    <DashboardShell><RoleDashboard role="ENGINEER" /></DashboardShell>
  )
}

export default page