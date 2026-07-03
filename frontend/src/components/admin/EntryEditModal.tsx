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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { adminApi } from '@/lib/api';
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
}

const entrySchema = z.object({
  profileId:       z.string().min(1, 'Profile ID is required'),
  postedOn:        z.string().optional(),
  lastUpdatedOn:   z.string().optional(),
  fullName:        z.string().min(2, 'Full name is required'),
  gender:          z.string().optional(),
  age: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(1, 'Min age 1').max(120, 'Max age 120').optional()
  ),
  education:       z.string().optional(),
  educationDetail: z.string().optional(),
  occupation:      z.string().optional(),
  maritalStatus:   z.string().optional(),
  religion:        z.string().optional(),
  caste:           z.string().optional(),
  subCaste:        z.string().optional(),
  gothram:         z.string().optional(),
  familyType:      z.string().optional(),
  motherTongue:    z.string().optional(),
  star:            z.string().optional(),
  rassi:           z.string().optional(),
  dhosham:         z.string().optional(),
  horoscopeMatch:  z.string().optional(),
  height:          z.string().optional(),
  weight:          z.string().optional(),
  bodyType:        z.string().optional(),
  physicalStatus:  z.string().optional(),
  complexion:      z.string().optional(),
  eatingHabit:     z.string().optional(),
  smokeHabit:      z.string().optional(),
  drinkHabit:      z.string().optional(),
  citizenOf:       z.string().optional(),
  countryLivingIn: z.string().optional(),
  homeState:       z.string().optional(),
  familyValue:     z.string().optional(),
  familyStatus:    z.string().optional(),
  annualIncome:    z.string().optional(),
  aboutFamily:     z.string().optional(),
  moreDescription: z.string().optional(),
  expectations:    z.string().optional(),
  mobile:          z.string().optional(),
  city:            z.string().optional(),
  state:           z.string().optional(),
  additionalNotes: z.string().optional(),
});

type EntryForm = z.infer<typeof entrySchema>;

interface EntryEditModalProps {
  entry: Entry | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function Inp({ label, name, register }: { label: string; name: string; register: ReturnType<typeof useForm<EntryForm>>['register'] }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {/* Admin has normal copy-paste - no noCopyPaste props here */}
      <Input {...register(name as keyof EntryForm)} className="h-8 text-sm" />
    </div>
  );
}

function Sec({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 border-b border-indigo-100 pb-1 mt-3 mb-2 col-span-2">
      {children}
    </p>
  );
}

export default function EntryEditModal({ entry, open, onClose, onSuccess }: EntryEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EntryForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(entrySchema) as any,
  });

  useEffect(() => {
    if (entry) {
      reset({
        profileId:       entry.profileId      || '',
        postedOn:        entry.postedOn        || '',
        lastUpdatedOn:   entry.lastUpdatedOn   || '',
        fullName:        entry.fullName        || '',
        gender:          entry.gender          || '',
        age:             entry.age,
        education:       entry.education       || '',
        educationDetail: entry.educationDetail || '',
        occupation:      entry.occupation      || '',
        maritalStatus:   entry.maritalStatus   || '',
        religion:        entry.religion        || '',
        caste:           entry.caste           || '',
        subCaste:        entry.subCaste        || '',
        gothram:         entry.gothram         || '',
        familyType:      entry.familyType      || '',
        motherTongue:    entry.motherTongue    || '',
        star:            entry.star            || '',
        rassi:           entry.rassi           || '',
        dhosham:         entry.dhosham         || '',
        horoscopeMatch:  entry.horoscopeMatch  || '',
        height:          entry.height          || '',
        weight:          entry.weight          || '',
        bodyType:        entry.bodyType        || '',
        physicalStatus:  entry.physicalStatus  || '',
        complexion:      entry.complexion      || '',
        eatingHabit:     entry.eatingHabit     || '',
        smokeHabit:      entry.smokeHabit      || '',
        drinkHabit:      entry.drinkHabit      || '',
        citizenOf:       entry.citizenOf       || '',
        countryLivingIn: entry.countryLivingIn || '',
        homeState:       entry.homeState       || '',
        familyValue:     entry.familyValue     || '',
        familyStatus:    entry.familyStatus    || '',
        annualIncome:    entry.annualIncome    || '',
        aboutFamily:     entry.aboutFamily     || '',
        moreDescription: entry.moreDescription || '',
        expectations:    entry.expectations    || '',
        mobile:          entry.mobile          || '',
        city:            entry.city            || '',
        state:           entry.state           || '',
        additionalNotes: entry.additionalNotes || '',
      });
    }
  }, [entry, reset]);

  const onSubmit: SubmitHandler<EntryForm> = async (data) => {
    if (!entry) return;
    setIsLoading(true);
    try {
      await adminApi.updateEntry(entry.id, {
        profileId:       data.profileId       || undefined,
        postedOn:        data.postedOn        || undefined,
        lastUpdatedOn:   data.lastUpdatedOn   || undefined,
        name:            data.fullName,           // map fullName -> name for backend
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
        mobileNumber:    data.mobile          || undefined,
        city:            data.city            || undefined,
        state:           data.state           || undefined,
        additionalNotes: data.additionalNotes || undefined,
      });
      toast.success('Entry updated successfully');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to update entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[760px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Save className="w-4 h-4 text-indigo-600" />
            </div>
            Edit Entry — Slot #{entry?.slotNumber}
            <span className="ml-2 text-xs font-normal text-slate-400">(Admin — full access)</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-2">
          <div className="grid grid-cols-2 gap-3">

            {/* ── GENERAL ──────────────────────────────────── */}
            <Sec>General Information</Sec>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Profile ID *</Label>
              <Input {...register('profileId')} className="h-8 text-sm" />
              {errors.profileId && <p className="text-rose-500 text-xs">{errors.profileId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Full Name *</Label>
              <Input {...register('fullName')} className="h-8 text-sm" />
              {errors.fullName && <p className="text-rose-500 text-xs">{errors.fullName.message}</p>}
            </div>
            <Inp label="Posted On"       name="postedOn"      register={register} />
            <Inp label="Last Updated On" name="lastUpdatedOn" register={register} />

            {/* ── PERSONAL ─────────────────────────────────── */}
            <Sec>Personal Information</Sec>

            {/* Gender + Age row */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Gender</Label>
              <Select value={watch('gender') ?? ''} onValueChange={(v) => setValue('gender', v ?? undefined)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Age</Label>
              <Input type="number" {...register('age')} className="h-8 text-sm" />
            </div>

            <Inp label="Education"        name="education"       register={register} />
            <Inp label="Education Detail" name="educationDetail" register={register} />
            <Inp label="Occupation"       name="occupation"      register={register} />

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Marital Status</Label>
              <Select value={watch('maritalStatus') ?? ''} onValueChange={(v) => setValue('maritalStatus', v ?? undefined)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UnMarried">UnMarried</SelectItem>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Inp label="Religion"         name="religion"       register={register} />
            <Inp label="Caste"            name="caste"          register={register} />
            <Inp label="Sub Caste"        name="subCaste"       register={register} />
            <Inp label="Gothram"          name="gothram"        register={register} />
            <Inp label="Family Type"      name="familyType"     register={register} />
            <Inp label="Mother Tongue"    name="motherTongue"   register={register} />
            <Inp label="Star"             name="star"           register={register} />
            <Inp label="Rassi / Moon Sign" name="rassi"         register={register} />
            <Inp label="Dhosham / Mangalik" name="dhosham"      register={register} />
            <Inp label="Horoscope Match"  name="horoscopeMatch" register={register} />
            <Inp label="Height"           name="height"         register={register} />
            <Inp label="Weight"           name="weight"         register={register} />
            <Inp label="Body Type"        name="bodyType"       register={register} />
            <Inp label="Physical Status"  name="physicalStatus" register={register} />
            <Inp label="Complexion"       name="complexion"     register={register} />
            <Inp label="Eating Habit"     name="eatingHabit"    register={register} />
            <Inp label="Smoke Habit"      name="smokeHabit"     register={register} />
            <Inp label="Drink Habit"      name="drinkHabit"     register={register} />
            <Inp label="Citizen Of"       name="citizenOf"      register={register} />
            <Inp label="Country Living In" name="countryLivingIn" register={register} />
            <Inp label="Home State"       name="homeState"      register={register} />
            <Inp label="Family Value"     name="familyValue"    register={register} />
            <Inp label="Family Status"    name="familyStatus"   register={register} />
            <Inp label="Annual Income"    name="annualIncome"   register={register} />
            <Inp label="Mobile Number"    name="mobile"         register={register} />

            {/* ── DESCRIPTION ──────────────────────────────── */}
            <Sec>Description Sections</Sec>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-slate-600">About Family</Label>
              <Textarea {...register('aboutFamily')} className="resize-none h-16 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-slate-600">More Description</Label>
              <Textarea {...register('moreDescription')} className="resize-none h-16 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-slate-600">Expectations</Label>
              <Textarea {...register('expectations')} className="resize-none h-16 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-slate-600">Additional Notes</Label>
              <Textarea {...register('additionalNotes')} className="resize-none h-14 text-sm" />
            </div>

          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl border-0"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Entry</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
