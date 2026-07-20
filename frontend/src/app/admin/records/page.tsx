'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Download, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import EntryEditModal from '@/components/admin/EntryEditModal';
import { SkeletonTable } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';

interface Entry {
  id: string;
  slotNumber: number;
  // General
  profileId: string;
  postedOn?: string;
  lastUpdatedOn?: string;
  // Personal
  fullName: string;
  gender?: string;
  age?: number;
  education?: string;
  educationDetail?: string;
  occupation?: string;
  maritalStatus?: string;
  religion?: string;
  caste?: string;
  subCaste?: string;
  gothram?: string;
  familyType?: string;
  motherTongue?: string;
  star?: string;
  rassi?: string;
  dhosham?: string;
  horoscopeMatch?: string;
  height?: string;
  weight?: string;
  bodyType?: string;
  physicalStatus?: string;
  complexion?: string;
  eatingHabit?: string;
  smokeHabit?: string;
  drinkHabit?: string;
  citizenOf?: string;
  countryLivingIn?: string;
  homeState?: string;
  familyValue?: string;
  familyStatus?: string;
  annualIncome?: string;
  // Description
  aboutFamily?: string;
  moreDescription?: string;
  expectations?: string;
  // Legacy
  mobile?: string;
  city?: string;
  state?: string;
  additionalNotes?: string;
  // Workflow
  status: string;
  submittedBy?: string;
  submittedAt?: string;
}

export default function AdminRecordsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery<{ entries: Entry[]; total: number; pages: number }>({
    queryKey: ['admin-entries', search, page],
    queryFn: async () => {
      const res = await adminApi.getEntries({ search, page, limit: 20 });
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entries: res.data.data.map((e: any) => ({
          id: e._id,
          slotNumber: e.slotNumber,
          // General
          profileId:       e.profileId     || '—',
          postedOn:        e.postedOn,
          lastUpdatedOn:   e.lastUpdatedOn,
          // Personal
          fullName:        e.name          || '—',
          gender:          e.gender,
          age:             e.age,
          education:       e.education,
          educationDetail: e.educationDetail,
          occupation:      e.occupation,
          maritalStatus:   e.maritalStatus,
          religion:        e.religion,
          caste:           e.caste,
          subCaste:        e.subCaste,
          gothram:         e.gothram,
          familyType:      e.familyType,
          motherTongue:    e.motherTongue,
          star:            e.star,
          rassi:           e.rassi,
          dhosham:         e.dhosham,
          horoscopeMatch:  e.horoscopeMatch,
          height:          e.height,
          weight:          e.weight,
          bodyType:        e.bodyType,
          physicalStatus:  e.physicalStatus,
          complexion:      e.complexion,
          eatingHabit:     e.eatingHabit,
          smokeHabit:      e.smokeHabit,
          drinkHabit:      e.drinkHabit,
          citizenOf:       e.citizenOf,
          countryLivingIn: e.countryLivingIn,
          homeState:       e.homeState,
          familyValue:     e.familyValue,
          familyStatus:    e.familyStatus,
          annualIncome:    e.annualIncome,
          // Description
          aboutFamily:     e.aboutFamily,
          moreDescription: e.moreDescription,
          expectations:    e.expectations,
          // Legacy
          mobile:          e.mobileNumber,
          city:            e.city,
          state:           e.state,
          additionalNotes: e.additionalNotes,
          // Workflow
          status:          e.status,
          submittedBy:     e.userId?.fullName || '—',
          submittedAt:     e.submittedAt,
        })),
        total: res.data.pagination.total,
        pages: res.data.pagination.pages,
      };
    },
  });

  const entries = (data?.entries || []).filter((entry) => entry.status !== "blank");
  const totalPages = data?.pages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEntry(id),
    onSuccess: () => {
      toast.success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-entries'] });
      setDeleteEntry(null);
    },
    onError: () => toast.error('Failed to delete entry'),
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await adminApi.exportEntries();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `matrientry-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Matrimonial Records</h1>
          <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() || '0'} total entries</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by profile ID, name, or username..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={8} /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No submitted or draft entries found.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Slot</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Profile ID</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Age</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">City</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">Submitted By</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-indigo-600">#{entry.slotNumber}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-700">{entry.profileId}</TableCell>
                      <TableCell className="font-medium text-slate-800 text-sm">{entry.fullName}</TableCell>
                      <TableCell className="text-slate-500 text-sm hidden md:table-cell">{entry.age || '—'}</TableCell>
                      <TableCell className="text-slate-500 text-sm hidden lg:table-cell">{entry.city || '—'}</TableCell>
                      <TableCell className="text-slate-400 text-xs hidden xl:table-cell">{entry.submittedBy || '—'}</TableCell>
                      <TableCell className="text-slate-400 text-xs hidden xl:table-cell">
                        {entry.submittedAt ? formatDateTime(entry.submittedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs border-0 ${
                            entry.status === 'submitted'
                              ? 'bg-emerald-100 text-emerald-700'
                              : entry.status === 'draft'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.status === 'submitted'
                            ? 'Submitted'
                            : entry.status === 'draft'
                            ? 'Draft'
                            : 'Blank'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => setEditEntry(entry)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteEntry(entry)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500 px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg"
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <EntryEditModal
        entry={editEntry}
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-entries'] })}
      />

      <Dialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Reset Entry</DialogTitle>
            <DialogDescription>
               Are you sure you want to reset the entry for <strong>{deleteEntry?.fullName}</strong>?
               This will clear all entered data and restore this slot back to a blank entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteEntry && deleteMutation.mutate(deleteEntry.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
