'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Eye, FileText, Lock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/LoadingSpinner';

interface Entry {
  id: string;
  slotNumber: number;
  // General
  profileId: string;
  postedOn?: string;
  lastUpdatedOn?: string;
  // Personal
  name: string;
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
  mobileNumber?: string;
  city?: string;
  state?: string;
  additionalNotes?: string;
  // Workflow
  status: string;
  submittedAt?: string;
}

function EntryDetailRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-400 w-40 flex-shrink-0 font-medium">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 border-b border-indigo-100 pb-1 mt-3 mb-1">
      {children}
    </p>
  );
}

export default function UserRecordsPage() {
  const [search, setSearch] = useState('');
  const [viewEntry, setViewEntry] = useState<Entry | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ entries: Entry[]; total: number; pages: number }>({
    queryKey: ['user-entries', search, page],
    queryFn: async () => {
      const res = await userApi.getMyEntries({ search, page, limit: 20 });
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entries: res.data.data.map((e: any) => ({
          id: e._id,
          slotNumber: e.slotNumber,
          // General
          profileId:      e.profileId    || '—',
          postedOn:       e.postedOn,
          lastUpdatedOn:  e.lastUpdatedOn,
          // Personal
          name:           e.name         || '—',
          gender:         e.gender,
          age:            e.age,
          education:      e.education,
          educationDetail:e.educationDetail,
          occupation:     e.occupation,
          maritalStatus:  e.maritalStatus,
          religion:       e.religion,
          caste:          e.caste,
          subCaste:       e.subCaste,
          gothram:        e.gothram,
          familyType:     e.familyType,
          motherTongue:   e.motherTongue,
          star:           e.star,
          rassi:          e.rassi,
          dhosham:        e.dhosham,
          horoscopeMatch: e.horoscopeMatch,
          height:         e.height,
          weight:         e.weight,
          bodyType:       e.bodyType,
          physicalStatus: e.physicalStatus,
          complexion:     e.complexion,
          eatingHabit:    e.eatingHabit,
          smokeHabit:     e.smokeHabit,
          drinkHabit:     e.drinkHabit,
          citizenOf:      e.citizenOf,
          countryLivingIn:e.countryLivingIn,
          homeState:      e.homeState,
          familyValue:    e.familyValue,
          familyStatus:   e.familyStatus,
          annualIncome:   e.annualIncome,
          // Description
          aboutFamily:    e.aboutFamily,
          moreDescription:e.moreDescription,
          expectations:   e.expectations,
          // Legacy
          mobileNumber:   e.mobileNumber,
          city:           e.city,
          state:          e.state,
          additionalNotes:e.additionalNotes,
          // Workflow
          status:      e.status,
          submittedAt: e.submittedAt,
        })),
        total: res.data.pagination.total,
        pages: res.data.pagination.pages,
      };
    },
  });

  const entries    = data?.entries   || [];
  const totalPages = data?.pages     || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Records</h1>
        <p className="text-slate-500 text-sm">{data?.total?.toLocaleString() || '0'} total entries</p>
      </div>

      {/* Search */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by profile ID or name..."
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
            <div className="p-4"><SkeletonTable rows={6} /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No entries found</p>
              <p className="text-slate-300 text-sm">Start entering data to see records here</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Slot</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Profile ID</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Religion / Caste</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Submitted At</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-indigo-600">#{entry.slotNumber}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-700">{entry.profileId}</TableCell>
                      <TableCell className="font-medium text-slate-800 text-sm">{entry.name}</TableCell>
                      <TableCell className="text-slate-500 text-sm hidden md:table-cell">
                        {[entry.religion, entry.caste].filter(Boolean).join(' / ') || '—'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs hidden lg:table-cell">
                        {entry.submittedAt ? formatDateTime(entry.submittedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {entry.status === 'submitted' && (
                            <Lock className="w-3 h-3 text-emerald-500" />
                          )}
                          <Badge className={`text-xs border-0 ${entry.status === 'submitted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'}`}>
                            {entry.status === 'submitted' ? 'Submitted' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => setViewEntry(entry)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg">Previous</Button>
          <span className="text-sm text-slate-500 px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg">Next</Button>
        </div>
      )}

      {/* View Entry Modal */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              Entry Details — Slot #{viewEntry?.slotNumber}
              {viewEntry?.status === 'submitted' && (
                <span className="ml-auto flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <SectionLabel>General Information</SectionLabel>
            <EntryDetailRow label="Profile ID"       value={viewEntry?.profileId} />
            <EntryDetailRow label="Posted On"        value={viewEntry?.postedOn} />
            <EntryDetailRow label="Last Updated On"  value={viewEntry?.lastUpdatedOn} />

            <SectionLabel>Personal Information</SectionLabel>
            <EntryDetailRow label="Name"             value={viewEntry?.name} />
            <EntryDetailRow label="Gender"           value={viewEntry?.gender} />
            <EntryDetailRow label="Age"              value={viewEntry?.age} />
            <EntryDetailRow label="Education"        value={viewEntry?.education} />
            <EntryDetailRow label="Education Detail" value={viewEntry?.educationDetail} />
            <EntryDetailRow label="Occupation"       value={viewEntry?.occupation} />
            <EntryDetailRow label="Marital Status"   value={viewEntry?.maritalStatus} />
            <EntryDetailRow label="Religion"         value={viewEntry?.religion} />
            <EntryDetailRow label="Caste"            value={viewEntry?.caste} />
            <EntryDetailRow label="Sub Caste"        value={viewEntry?.subCaste} />
            <EntryDetailRow label="Gothram"          value={viewEntry?.gothram} />
            <EntryDetailRow label="Family Type"      value={viewEntry?.familyType} />
            <EntryDetailRow label="Mother Tongue"    value={viewEntry?.motherTongue} />
            <EntryDetailRow label="Star"             value={viewEntry?.star} />
            <EntryDetailRow label="Rassi / Moon Sign"value={viewEntry?.rassi} />
            <EntryDetailRow label="Dhosham / Mangalik" value={viewEntry?.dhosham} />
            <EntryDetailRow label="Horoscope Match"  value={viewEntry?.horoscopeMatch} />
            <EntryDetailRow label="Height"           value={viewEntry?.height} />
            <EntryDetailRow label="Weight"           value={viewEntry?.weight} />
            <EntryDetailRow label="Body Type"        value={viewEntry?.bodyType} />
            <EntryDetailRow label="Physical Status"  value={viewEntry?.physicalStatus} />
            <EntryDetailRow label="Complexion"       value={viewEntry?.complexion} />
            <EntryDetailRow label="Eating Habit"     value={viewEntry?.eatingHabit} />
            <EntryDetailRow label="Smoke Habit"      value={viewEntry?.smokeHabit} />
            <EntryDetailRow label="Drink Habit"      value={viewEntry?.drinkHabit} />
            <EntryDetailRow label="Citizen Of"       value={viewEntry?.citizenOf} />
            <EntryDetailRow label="Country Living In"value={viewEntry?.countryLivingIn} />
            <EntryDetailRow label="Home State"       value={viewEntry?.homeState} />
            <EntryDetailRow label="Family Value"     value={viewEntry?.familyValue} />
            <EntryDetailRow label="Family Status"    value={viewEntry?.familyStatus} />
            <EntryDetailRow label="Annual Income"    value={viewEntry?.annualIncome} />
            <EntryDetailRow label="Mobile Number"    value={viewEntry?.mobileNumber} />

            {(viewEntry?.aboutFamily || viewEntry?.moreDescription || viewEntry?.expectations) && (
              <SectionLabel>Description</SectionLabel>
            )}
            {viewEntry?.aboutFamily && (
              <div className="py-2 border-b border-slate-50">
                <p className="text-sm text-slate-400 font-medium mb-1">About Family</p>
                <p className="text-sm text-slate-700">{viewEntry.aboutFamily}</p>
              </div>
            )}
            {viewEntry?.moreDescription && (
              <div className="py-2 border-b border-slate-50">
                <p className="text-sm text-slate-400 font-medium mb-1">More Description</p>
                <p className="text-sm text-slate-700">{viewEntry.moreDescription}</p>
              </div>
            )}
            {viewEntry?.expectations && (
              <div className="py-2 border-b border-slate-50">
                <p className="text-sm text-slate-400 font-medium mb-1">Expectations</p>
                <p className="text-sm text-slate-700">{viewEntry.expectations}</p>
              </div>
            )}
            {viewEntry?.additionalNotes && (
              <div className="py-2 border-b border-slate-50">
                <p className="text-sm text-slate-400 font-medium mb-1">Additional Notes</p>
                <p className="text-sm text-slate-700">{viewEntry.additionalNotes}</p>
              </div>
            )}
            <EntryDetailRow label="Submitted At" value={viewEntry?.submittedAt ? formatDateTime(viewEntry.submittedAt) : undefined} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
