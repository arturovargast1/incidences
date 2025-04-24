'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import UserList from '@/components/users/UserList';
import CreateUserForm from '@/components/users/CreateUserForm';
import AuthGuard from '@/components/AuthGuard';
import { useCurrentUser } from '@/lib/auth';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  
  // Redirect non-T1 users to dashboard
  useEffect(() => {
    if (!userLoading && user && user.company !== 'T1') {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);
  
  // If user is loading or not from T1, don't render the actual content
  if (userLoading || (user && user.company !== 'T1')) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
              </div>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateUser = () => {
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Aquí podríamos recargar la lista de usuarios si fuera necesario
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {showCreateForm ? (
              <CreateUserForm 
                onCancel={handleCancelCreate} 
                onSuccess={handleCreateSuccess} 
              />
            ) : (
              <UserList onCreateUser={handleCreateUser} />
            )}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
