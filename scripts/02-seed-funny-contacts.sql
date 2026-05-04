-- Seed 10 fun fictional contacts for a given user.
-- Run this in the Supabase SQL Editor.
-- Replace the email below with your own user's email before running.

do $$
declare
  target_user uuid;
begin
  select id into target_user
  from public.users
  where email = 'your.email@example.com'  -- <-- CHANGE THIS
  limit 1;

  if target_user is null then
    raise exception 'No user found. Update the email in this script.';
  end if;

  insert into public.contacts (first_name, last_name, email, phone, created_by) values
    ('Darth',     'Vader',      'darth.vader@empire.gov',          '+49 151 50550501', target_user),
    ('Gandalf',   'the Grey',   'you.shall@notpass.me',            '+49 152 50550502', target_user),
    ('Forrest',   'Gump',       'run.forrest@bubbagump.com',       '+49 153 50550503', target_user),
    ('Marty',     'McFly',      'marty@1985.future',               '+49 154 50550504', target_user),
    ('Indiana',   'Jones',      'indy@archeology.edu',             '+49 155 50550505', target_user),
    ('Ellen',     'Ripley',     'ripley@nostromo.space',           '+49 156 50550506', target_user),
    ('Michael',   'Scott',      'worlds.best.boss@dundermifflin.com','+49 157 50550507', target_user),
    ('Bilbo',     'Baggins',    'bilbo@bagend.shire',              '+49 158 50550508', target_user),
    ('Mary',      'Poppins',    'practically.perfect@umbrella.uk', '+49 159 50550509', target_user),
    ('Captain',   'Jack Sparrow','jack@blackpearl.sea',            '+49 160 50550510', target_user);
end $$;
