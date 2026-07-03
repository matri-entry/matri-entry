'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  username: string;
  mobile?: string;
  email?: string;
  assignedCount: number;
  isActive: boolean;
}

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  assignedCount: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Must be a number' }).int().min(1, 'Must assign at least 1 record')
  ),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, open, onClose, onSuccess }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editUserSchema) as any,
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        mobile: user.mobile || '',
        email: user.email || '',
        assignedCount: user.assignedCount,
      });
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<EditUserForm> = async (data) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Update basic info
      await adminApi.updateUser(user.id, {
        fullName: data.name,
        mobileNumber: data.mobile || undefined,
        email: data.email || undefined,
      });

      // 2. If assignedCount changed, update it separately
      if (data.assignedCount !== user.assignedCount) {
        await adminApi.updateAssignedCount(user.id, data.assignedCount);
      }

      toast.success('User updated successfully');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-amber-600" />
            </div>
            Edit User — {user?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Username</Label>
            <Input value={user?.username || ''} disabled className="h-9 bg-slate-50 text-slate-400" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-sm font-medium">Full Name *</Label>
            <Input id="edit-name" {...register('name')} className="h-9" />
            {errors.name && <p className="text-rose-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-mobile" className="text-sm font-medium">Mobile</Label>
              <Input id="edit-mobile" {...register('mobile')} className="h-9" />
              {errors.mobile && <p className="text-rose-500 text-xs">{errors.mobile.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-assigned" className="text-sm font-medium">Assigned Records *</Label>
              <Input id="edit-assigned" type="number" {...register('assignedCount')} className="h-9" />
              {errors.assignedCount && <p className="text-rose-500 text-xs">{errors.assignedCount.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
            <Input id="edit-email" type="email" {...register('email')} className="h-9" />
            {errors.email && <p className="text-rose-500 text-xs">{errors.email.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl border-0"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Pencil className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
