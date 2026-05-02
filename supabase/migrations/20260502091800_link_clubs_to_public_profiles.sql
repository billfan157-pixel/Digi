alter table public.club_messages
  drop constraint if exists club_messages_user_public_profile_fkey,
  add constraint club_messages_user_public_profile_fkey
    foreign key (user_id) references public.public_profiles(id) on delete cascade;

alter table public.club_members
  drop constraint if exists club_members_user_public_profile_fkey,
  add constraint club_members_user_public_profile_fkey
    foreign key (user_id) references public.public_profiles(id) on delete cascade;

alter table public.club_activity
  drop constraint if exists club_activity_user_public_profile_fkey,
  add constraint club_activity_user_public_profile_fkey
    foreign key (user_id) references public.public_profiles(id) on delete cascade;
