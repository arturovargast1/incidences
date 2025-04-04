'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import UserList from '@/components/users/UserList';
import CreateUserForm from '@/components/users/CreateUserForm';
import AuthGuard from '@/components/AuthGuard';

export default function UsersPage() {
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
