import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/app/components/dashboard/dashboard-header'
import SystemInstructionsEditor from '@/app/components/dashboard/system-instructions-editor'
import ChannelManager from '@/app/components/dashboard/channel-manager'
import MemoryViewer from '@/app/components/dashboard/memory-viewer'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div
            className="min-h-screen p-4 md:p-8"
            style={{ background: 'var(--bg-primary)' }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header Card */}
                <DashboardHeader userEmail={user.email || ''} />

                {/* System Instructions */}
                <div className="mb-6">
                    <SystemInstructionsEditor />
                </div>

                {/* Channel Manager */}
                <div className="mb-6">
                    <ChannelManager />
                </div>

                {/* Memory Viewer */}
                <div className="mb-6">
                    <MemoryViewer />
                </div>

                {/* Footer */}
                <div
                    className="text-center py-4"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    <p className="text-xs">
                        Discord Copilot Admin Dashboard By Bharat Dangi
                    </p>
                </div>
            </div>
        </div>
    )
}
