'use client';

import { useState } from 'react';
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
import { Loader2, UserPlus } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  assignedCount: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Must be a number' }).int().min(1, 'Must assign at least 1 record').max(10000)
  ),
  expiryDays: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Must be a number' }).int().min(1, 'Must be at least 1 day').max(365)
  ),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      assignedCount: 100,
      expiryDays: 30,
    },
  });

  const onSubmit: SubmitHandler<CreateUserForm> = async (data) => {
    setIsLoading(true);
    try {
      await adminApi.createUser({
        fullName: data.name,
        username: data.username,
        password: data.password,
        mobileNumber: data.mobile || undefined,
        email: data.email || undefined,
        assignedCount: data.assignedCount,
        expiryDays: data.expiryDays,
      });
      toast.success(`User "${data.name}" created successfully`);
      reset();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            Create New User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
              <Input id="name" {...register('name')} placeholder="John Doe" className="h-9" />
              {errors.name && <p className="text-rose-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">Username *</Label>
              <Input id="username" {...register('username')} placeholder="john_doe" className="h-9" />
              {errors.username && <p className="text-rose-500 text-xs">{errors.username.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
            <Input id="password" type="password" {...register('password')} placeholder="Min 6 characters" className="h-9" />
            {errors.password && <p className="text-rose-500 text-xs">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
              <Input id="mobile" {...register('mobile')} placeholder="9876543210" className="h-9" />
              {errors.mobile && <p className="text-rose-500 text-xs">{errors.mobile.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john@example.com" className="h-9" />
              {errors.email && <p className="text-rose-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignedCount" className="text-sm font-medium">Assigned Records *</Label>
              <Input id="assignedCount" type="number" {...register('assignedCount')} className="h-9" />
              {errors.assignedCount && <p className="text-rose-500 text-xs">{errors.assignedCount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDays" className="text-sm font-medium">Expiry (Days) *</Label>
              <Input id="expiryDays" type="number" {...register('expiryDays')} className="h-9" />
              {errors.expiryDays && <p className="text-rose-500 text-xs">{errors.expiryDays.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl border-0"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Create User</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
