
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ProfileUpdateFormData } from '@/lib/validators';
import { ProfileUpdateSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserProfilePicture } from '@/app/actions/profile';
import { useEffect, useState, useRef } from 'react';
import { Loader2, UploadCloud, UserCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import type { Metadata } from 'next';

// export const metadata: Metadata = { // Cannot be used in client component
//   title: 'My Profile - DeutschTalk',
//   description: 'View and update your DeutschTalk profile.',
// };


const germanLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      germanLevel: null,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        germanLevel: userProfile.germanLevel || null,
      });
    }
  }, [userProfile, form]);

  async function onSubmit(data: ProfileUpdateFormData) {
    if (!user) return;
    setIsSubmitting(true);
    const result = await updateUserProfile(user.uid, data);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } else {
      toast({ title: "Update Failed", description: result.error || "Could not update profile.", variant: "destructive" });
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    setIsUploading(true);
    const result = await updateUserProfilePicture(user.uid, file);
    setIsUploading(false);
    if (result.success) {
      toast({ title: "Profile Picture Updated", description: "Your new picture is now live." });
      // The userProfile context should update automatically via onSnapshot listener
    } else {
      toast({ title: "Upload Failed", description: result.error || "Could not update profile picture.", variant: "destructive" });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'DT';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !userProfile) {
    return <p>User not found or not logged in.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">Your Profile</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your avatar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
            <AvatarFallback className="text-3xl">{getInitials(userProfile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              className="hidden" 
              id="profilePictureInput"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Change Picture'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your public name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little about yourself and your German learning goals." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Max 200 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="germanLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>German Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your German proficiency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {germanLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>This helps us match you with suitable partners.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
