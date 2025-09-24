"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useState } from "react";

export function Dashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Vitajte, {user.name}!
              </h1>
              <p className="text-gray-600">
                Role: {user.role === 'admin' ? 'AdministrĂˇtor' : 
                       user.role === 'accountant' ? 'ĂšÄŤtovnĂ­k' : 'PouĹľĂ­vateÄľ'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard
                title="Moje firmy"
                description="SprĂˇva vaĹˇich firiem"
                href="/companies"
                icon="đźŹ˘"
              />
              <DashboardCard
                title="Dokumenty"
                description="SprĂˇva dokumentov"
                href="/documents"
                icon="đź“„"
              />
              <DashboardCard
                title="Ăšlohy"
                description="SprĂˇva Ăşloh a zadanĂ­"
                href="/tasks"
                icon="âś…"
              />
              <DashboardCard
                title="SprĂˇvy"
                description="KomunikĂˇcia s ĂşÄŤtovnĂ­kom"
                href="/messages"
                icon="đź’¬"
              />
              {user.role === 'admin' && (
                <DashboardCard
                  title="AdministrĂˇcia"
                  description="SprĂˇva pouĹľĂ­vateÄľov a systĂ©mu"
                  href="/admin"
                  icon="âš™ď¸Ź"
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardCard({ 
  title, 
  description, 
  href, 
  icon 
}: { 
  title: string; 
  description: string; 
  href: string; 
  icon: string; 
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-sm text-gray-900">
                {description}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a
            href={href}
            className="font-medium text-blue-700 hover:text-blue-900"
          >
            ZobraziĹĄ
          </a>
        </div>
      </div>
    </div>
  );
}

