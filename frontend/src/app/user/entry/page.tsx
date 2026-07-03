'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Save,
  Send,
  ChevronRight,
  Hash,
  Keyboard,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Prevent copy / cut / paste / drag on a field. Applied to every input. */
const noCopyPaste = {
  onCopy:      (e: React.ClipboardEvent) => e.preventDefault(),
  onCut:       (e: React.ClipboardEvent) => e.preventDefault(),
  onPaste:     (e: React.ClipboardEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent)      => e.preventDefault(),
  onDrop:      (e: React.DragEvent)      => e.preventDefault(),
  onContextMenu: (e: React.MouseEvent)   => e.preventDefault(),
  autoComplete: 'off' as const,
  autoCorrect:  'off' as const,
  spellCheck:   false as const,
};

// ── Schema ────────────────────────────────────────────────────────────────────

const entrySchema = z.object({
  // General
  profileId:      z.string().min(1, 'Profile ID is required'),
  postedOn:       z.string().optional(),
  lastUpdatedOn:  z.string().optional(),
  // Personal — required fields
  name:           z.string().min(2, 'Name must be at least 2 characters'),
  gender:         z.string().min(1, 'Gender is required'),
  age: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Age is required', invalid_type_error: 'Age must be a number' })
      .int().min(18, 'Age must be at least 18').max(100, 'Age must be at most 100')
  ),
  education:      z.string().min(1, 'Education is required'),
  occupation:     z.string().min(1, 'Occupation is required'),
  religion:       z.string().min(1, 'Religion is required'),
  caste:          z.string().min(1, 'Caste is required'),
  // Personal — optional fields
  educationDetail:  z.string().optional(),
  maritalStatus:    z.string().optional(),
  subCaste:         z.string().optional(),
  gothram:          z.string().optional(),
  familyType:       z.string().optional(),
  motherTongue:     z.string().optional(),
  star:             z.string().optional(),
  rassi:            z.string().optional(),
  dhosham:          z.string().optional(),
  horoscopeMatch:   z.string().optional(),
  height:           z.string().optional(),
  weight:           z.string().optional(),
  bodyType:         z.string().optional(),
  physicalStatus:   z.string().optional(),
  complexion:       z.string().optional(),
  eatingHabit:      z.string().optional(),
  smokeHabit:       z.string().optional(),
  drinkHabit:       z.string().optional(),
  citizenOf:        z.string().optional(),
  countryLivingIn:  z.string().optional(),
  homeState:        z.string().optional(),
  familyValue:      z.string().optional(),
  familyStatus:     z.string().optional(),
  annualIncome:     z.string().optional(),
  // Description — optional long text
  aboutFamily:      z.string().optional(),
  moreDescription:  z.string().optional(),
  expectations:     z.string().optional(),
  // Legacy / location
  mobileNumber:     z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit number').optional().or(z.literal('')),
  city:             z.string().optional(),
  state:            z.string().optional(),
  additionalNotes:  z.string().optional(),
});

type EntryForm = z.infer<typeof entrySchema>;

interface SlotInfo {
  _id: string;
  slotNumber: number;
  completedCount: number;
  assignedCount: number;
}

// ── Styled field wrapper ──────────────────────────────────────────────────────
function FieldGroup({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-600">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-rose-500 text-xs">{error}</p>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 pt-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 border-b border-indigo-100 pb-1.5">
        {children}
      </h3>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DataEntryPage() {
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [isLoadingSlot, setIsLoadingSlot] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EntryForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(entrySchema) as any,
  });

  // ── Block clipboard shortcuts globally on this page ───────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isField = ['INPUT', 'TEXTAREA'].includes(tag);
      if (!isField) return;

      const blocked =
        (e.ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') ||
        (e.ctrlKey && e.key === 'Enter');

      // Allow Ctrl+Enter to submit
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmit(onSubmit)();
        e.preventDefault();
        return;
      }

      if (blocked) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNextSlot = useCallback(async () => {
    setIsLoadingSlot(true);
    try {
      const [slotRes, progressRes] = await Promise.all([
        userApi.getNextSlot(),
        userApi.getProgress(),
      ]);
      const slotData    = slotRes.data?.data;
      const progressData = progressRes.data?.data;
      if (slotData) {
        setSlot({
          _id:            slotData._id,
          slotNumber:     slotData.slotNumber,
          completedCount: progressData?.completed  ?? 0,
          assignedCount:  progressData?.assigned   ?? 0,
        });
        reset(); // clear form for new slot
      } else {
        setSlot(null);
      }
    } catch {
      toast.error('Failed to load next slot');
    } finally {
      setIsLoadingSlot(false);
    }
  }, [reset]);

  useEffect(() => { loadNextSlot(); }, [loadNextSlot]);

  const onSubmit: SubmitHandler<EntryForm> = async (data) => {
    if (!slot) return;
    setIsSubmitting(true);
    try {
      await userApi.updateEntry(slot._id, {
        // General
        profileId:      data.profileId,
        postedOn:       data.postedOn       || undefined,
        lastUpdatedOn:  data.lastUpdatedOn  || undefined,
        // Personal
        name:           data.name,
        gender:         data.gender,
        age:            data.age,
        education:      data.education,
        educationDetail:data.educationDetail|| undefined,
        occupation:     data.occupation,
        maritalStatus:  data.maritalStatus  || undefined,
        religion:       data.religion,
        caste:          data.caste,
        subCaste:       data.subCaste       || undefined,
        gothram:        data.gothram        || undefined,
        familyType:     data.familyType     || undefined,
        motherTongue:   data.motherTongue   || undefined,
        star:           data.star           || undefined,
        rassi:          data.rassi          || undefined,
        dhosham:        data.dhosham        || undefined,
        horoscopeMatch: data.horoscopeMatch || undefined,
        height:         data.height         || undefined,
        weight:         data.weight         || undefined,
        bodyType:       data.bodyType       || undefined,
        physicalStatus: data.physicalStatus || undefined,
        complexion:     data.complexion     || undefined,
        eatingHabit:    data.eatingHabit    || undefined,
        smokeHabit:     data.smokeHabit     || undefined,
        drinkHabit:     data.drinkHabit     || undefined,
        citizenOf:      data.citizenOf      || undefined,
        countryLivingIn:data.countryLivingIn|| undefined,
        homeState:      data.homeState      || undefined,
        familyValue:    data.familyValue    || undefined,
        familyStatus:   data.familyStatus   || undefined,
        annualIncome:   data.annualIncome   || undefined,
        // Description
        aboutFamily:    data.aboutFamily    || undefined,
        moreDescription:data.moreDescription|| undefined,
        expectations:   data.expectations   || undefined,
        // Legacy
        mobileNumber:   data.mobileNumber   || undefined,
        city:           data.city           || undefined,
        state:          data.state          || undefined,
        additionalNotes:data.additionalNotes|| undefined,
        status: 'submitted',
      });
      setLastSubmitted(data.name);
      toast.success(`Entry for "${data.name}" submitted!`, {
        description: `Slot #${slot.slotNumber} completed. Loading next slot...`,
      });
      await loadNextSlot();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to submit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async () => {
    if (!slot) return;
    const data = watch();
    setIsSavingDraft(true);
    try {
      await userApi.updateEntry(slot._id, {
        profileId:       data.profileId       || undefined,
        postedOn:        data.postedOn        || undefined,
        lastUpdatedOn:   data.lastUpdatedOn   || undefined,
        name:            data.name            || undefined,
        gender:          data.gender          || undefined,
        age:             data.age             || undefined,
        education:       data.education       || undefined,
        educationDetail: data.educationDetail || undefined,
        occupation:      data.occupation      || undefined,
        maritalStatus:   data.maritalStatus   || undefined,
        religion:        data.religion        || undefined,
        caste:           data.caste           || undefined,
        subCaste:        data.subCaste        || undefined,
        gothram:         data.gothram         || undefined,
        familyType:      data.familyType      || undefined,
        motherTongue:    data.motherTongue    || undefined,
        star:            data.star            || undefined,
        rassi:           data.rassi           || undefined,
        dhosham:         data.dhosham         || undefined,
        horoscopeMatch:  data.horoscopeMatch  || undefined,
        height:          data.height          || undefined,
        weight:          data.weight          || undefined,
        bodyType:        data.bodyType        || undefined,
        physicalStatus:  data.physicalStatus  || undefined,
        complexion:      data.complexion      || undefined,
        eatingHabit:     data.eatingHabit     || undefined,
        smokeHabit:      data.smokeHabit      || undefined,
        drinkHabit:      data.drinkHabit      || undefined,
        citizenOf:       data.citizenOf       || undefined,
        countryLivingIn: data.countryLivingIn || undefined,
        homeState:       data.homeState       || undefined,
        familyValue:     data.familyValue     || undefined,
        familyStatus:    data.familyStatus    || undefined,
        annualIncome:    data.annualIncome    || undefined,
        aboutFamily:     data.aboutFamily     || undefined,
        moreDescription: data.moreDescription || undefined,
        expectations:    data.expectations    || undefined,
        mobileNumber:    data.mobileNumber    || undefined,
        city:            data.city            || undefined,
        state:           data.state           || undefined,
        additionalNotes: data.additionalNotes || undefined,
        status: 'draft',
      });
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const completionPct = slot
    ? Math.round((slot.completedCount / Math.max(slot.assignedCount, 1)) * 100)
    : 0;

  // ── Shared input className ────────────────────────────────────────────────
  const inputCls = (hasErr?: boolean) =>
    cn(
      'h-10 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
      hasErr && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20'
    );

  // ── Select helper (no copy/paste on select) ───────────────────────────────
  const sel = (
    field: keyof EntryForm,
    placeholder: string,
    options: string[]
  ) => (
    <Select
      value={(watch(field) as string) || ''}
      onValueChange={(v) => setValue(field, v as never)}
    >
      <SelectTrigger className={inputCls()} {...noCopyPaste}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  // ── All Done State ────────────────────────────────────────────────────────
  if (!isLoadingSlot && slot === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">All Entries Submitted!</h2>
          <p className="text-slate-500 text-sm">
            You have completed all {slot === null ? '' : ''} assigned records. Great work!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Progress Bar Header */}
      <Card className="rounded-xl border-slate-100 shadow-sm bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Progress</p>
                <p className="text-2xl font-bold tabular-nums">
                  {slot?.completedCount?.toLocaleString() ?? '—'} / {slot?.assignedCount?.toLocaleString() ?? '—'}
                </p>
                <p className="text-indigo-200 text-xs mt-0.5">Records Completed</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Current Slot</p>
                <div className="flex items-center gap-1">
                  <Hash className="w-5 h-5 text-indigo-300" />
                  <p className="text-2xl font-bold tabular-nums">
                    {isLoadingSlot ? '...' : slot?.slotNumber?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <p className="text-indigo-200 text-xs mt-0.5">of {slot?.assignedCount?.toLocaleString() ?? '—'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-[180px]">
              <div className="flex justify-between text-xs text-indigo-200">
                <span>Completion</span>
                <span className="font-semibold text-white">{completionPct}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Submitted Banner */}
      {lastSubmitted && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 text-sm font-medium">
            Last submitted: <strong>{lastSubmitted}</strong>
          </p>
        </div>
      )}

      {/* Data Entry Form */}
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <Card className="rounded-xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              </div>
              Entry Form — Slot #{isLoadingSlot ? '...' : slot?.slotNumber}
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  <Lock className="w-3 h-3" />
                  <span>Copy/Paste disabled</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-normal">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Ctrl+Enter to submit</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            {isLoadingSlot ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ── GENERAL INFORMATION ─────────────────────────────── */}
                <SectionTitle>General Information</SectionTitle>

                <FieldGroup label="Profile ID" required error={errors.profileId?.message}>
                  <Input
                    id="profileId"
                    {...register('profileId')}
                    {...noCopyPaste}
                    placeholder="Enter profile ID from source"
                    className={inputCls(!!errors.profileId)}
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Posted On">
                  <Input
                    {...register('postedOn')}
                    {...noCopyPaste}
                    placeholder="e.g. 15-Jan-2024"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Last Updated On">
                  <Input
                    {...register('lastUpdatedOn')}
                    {...noCopyPaste}
                    placeholder="e.g. 20-Mar-2024"
                    className={inputCls()}
                  />
                </FieldGroup>

                {/* ── PERSONAL INFORMATION ────────────────────────────── */}
                <SectionTitle>Personal Information</SectionTitle>

                <FieldGroup label="Name" required error={errors.name?.message}>
                  <Input
                    {...register('name')}
                    {...noCopyPaste}
                    placeholder="Full name"
                    className={inputCls(!!errors.name)}
                  />
                </FieldGroup>

                <FieldGroup label="Gender / Age" required error={errors.gender?.message || errors.age?.message}>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {sel('gender', 'Gender', ['Male', 'Female', 'Other'])}
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min={18}
                        max={100}
                        {...register('age')}
                        {...noCopyPaste}
                        placeholder="Age"
                        className={inputCls(!!errors.age)}
                      />
                    </div>
                  </div>
                </FieldGroup>

                <FieldGroup label="Education" required error={errors.education?.message}>
                  <Input
                    {...register('education')}
                    {...noCopyPaste}
                    placeholder="e.g. Bachelor in Computer Science"
                    className={inputCls(!!errors.education)}
                  />
                </FieldGroup>

                <FieldGroup label="Education Detail">
                  <Input
                    {...register('educationDetail')}
                    {...noCopyPaste}
                    placeholder="e.g. BE Computers"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Occupation" required error={errors.occupation?.message}>
                  <Input
                    {...register('occupation')}
                    {...noCopyPaste}
                    placeholder="e.g. Software professional"
                    className={inputCls(!!errors.occupation)}
                  />
                </FieldGroup>

                <FieldGroup label="Marital Status">
                  {sel('maritalStatus', 'Select status', ['UnMarried', 'Single', 'Married', 'Divorced', 'Widowed', 'Awaiting Divorce'])}
                </FieldGroup>

                <FieldGroup label="Religion" required error={errors.religion?.message}>
                  <Input
                    {...register('religion')}
                    {...noCopyPaste}
                    placeholder="e.g. Hindu"
                    className={inputCls(!!errors.religion)}
                  />
                </FieldGroup>

                <FieldGroup label="Caste" required error={errors.caste?.message}>
                  <Input
                    {...register('caste')}
                    {...noCopyPaste}
                    placeholder="e.g. Karuneegar"
                    className={inputCls(!!errors.caste)}
                  />
                </FieldGroup>

                <FieldGroup label="Sub Caste">
                  <Input
                    {...register('subCaste')}
                    {...noCopyPaste}
                    placeholder="e.g. seerkaruneegar"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Gothram">
                  <Input
                    {...register('gothram')}
                    {...noCopyPaste}
                    placeholder="e.g. Kousikam"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Family Type">
                  <Input
                    {...register('familyType')}
                    {...noCopyPaste}
                    placeholder="e.g. Nuclear Family"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Mother Tongue">
                  <Input
                    {...register('motherTongue')}
                    {...noCopyPaste}
                    placeholder="e.g. Tamil"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Star">
                  <Input
                    {...register('star')}
                    {...noCopyPaste}
                    placeholder="e.g. Jyesta / Kettai"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Rassi / Moon Sign">
                  <Input
                    {...register('rassi')}
                    {...noCopyPaste}
                    placeholder="e.g. Scorpio (Vrichiga)"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Dhosham / Mangalik">
                  <Input
                    {...register('dhosham')}
                    {...noCopyPaste}
                    placeholder="e.g. No"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Horoscope Match">
                  <Input
                    {...register('horoscopeMatch')}
                    {...noCopyPaste}
                    placeholder="e.g. Essential"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Height">
                  <Input
                    {...register('height')}
                    {...noCopyPaste}
                    placeholder="e.g. 5 Ft 7 In"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Weight">
                  <Input
                    {...register('weight')}
                    {...noCopyPaste}
                    placeholder="e.g. 64 Kgs"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Body Type">
                  <Input
                    {...register('bodyType')}
                    {...noCopyPaste}
                    placeholder="e.g. Average"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Physical Status">
                  <Input
                    {...register('physicalStatus')}
                    {...noCopyPaste}
                    placeholder="e.g. Normal"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Complexion">
                  <Input
                    {...register('complexion')}
                    {...noCopyPaste}
                    placeholder="e.g. Fair"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Eating Habit">
                  <Input
                    {...register('eatingHabit')}
                    {...noCopyPaste}
                    placeholder="e.g. Vegetarian"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Smoke Habit">
                  <Input
                    {...register('smokeHabit')}
                    {...noCopyPaste}
                    placeholder="e.g. Non-Smoker"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Drink Habit">
                  <Input
                    {...register('drinkHabit')}
                    {...noCopyPaste}
                    placeholder="e.g. Non-Drinker"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Citizen Of">
                  <Input
                    {...register('citizenOf')}
                    {...noCopyPaste}
                    placeholder="e.g. India"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Country Living In">
                  <Input
                    {...register('countryLivingIn')}
                    {...noCopyPaste}
                    placeholder="e.g. India"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Home State">
                  <Input
                    {...register('homeState')}
                    {...noCopyPaste}
                    placeholder="e.g. Karnataka"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Family Value">
                  <Input
                    {...register('familyValue')}
                    {...noCopyPaste}
                    placeholder="e.g. Moderate"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Family Status">
                  <Input
                    {...register('familyStatus')}
                    {...noCopyPaste}
                    placeholder="e.g. Upper Middle Class"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Annual Income">
                  <Input
                    {...register('annualIncome')}
                    {...noCopyPaste}
                    placeholder="e.g. Above Rs.7 Lakh to Rs.8 Lakh"
                    className={inputCls()}
                  />
                </FieldGroup>

                <FieldGroup label="Mobile Number">
                  <Input
                    {...register('mobileNumber')}
                    {...noCopyPaste}
                    placeholder="10-digit number"
                    maxLength={10}
                    className={inputCls(!!errors.mobileNumber)}
                  />
                  {errors.mobileNumber && <p className="text-rose-500 text-xs">{errors.mobileNumber.message}</p>}
                </FieldGroup>

                {/* ── DESCRIPTION SECTIONS ──────────────────────────── */}
                <SectionTitle>Description Sections</SectionTitle>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600">About Family</Label>
                  <Textarea
                    {...register('aboutFamily')}
                    {...noCopyPaste}
                    placeholder="e.g. Father is consultant, mother is homemaker..."
                    className="resize-none h-20 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600">More Description</Label>
                  <Textarea
                    {...register('moreDescription')}
                    {...noCopyPaste}
                    placeholder="e.g. Am fun loving & broad minded person..."
                    className="resize-none h-20 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-600">Expectations</Label>
                  <Textarea
                    {...register('expectations')}
                    {...noCopyPaste}
                    placeholder="e.g. I am looking for someone who is caring..."
                    className="resize-none h-20 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono font-medium text-slate-600">Ctrl+Enter</kbd> to submit</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSavingDraft || !isDirty}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 gap-2"
            >
              {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingSlot}
              className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl gap-2 shadow-lg shadow-indigo-500/20 px-6"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit &amp; Next
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
