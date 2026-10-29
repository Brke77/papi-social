create table public.upload_limits(user_id uuid primary key references public.profiles on delete cascade,window_start timestamptz not null default now(),requests integer not null default 0);
alter table public.upload_limits enable row level security;
revoke all on public.upload_limits from anon,authenticated;
create function public.papi_upload_limit() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();n integer;
begin
 if uid is null then raise exception 'authentication required';end if;
 insert into public.upload_limits(user_id,requests) values(uid,1) on conflict(user_id) do update set requests=case when upload_limits.window_start<now()-interval '1 hour' then 1 else upload_limits.requests+1 end,window_start=case when upload_limits.window_start<now()-interval '1 hour' then now() else upload_limits.window_start end returning requests into n;
 if n>40 then raise exception 'upload limit';end if;
end $$;
revoke all on function public.papi_upload_limit() from public,anon;
grant execute on function public.papi_upload_limit() to authenticated;
-- Media edits and deletes enqueue cleanup in the same transaction.
create table public.media_deletions(path text primary key,owner_id uuid not null,created_at timestamptz not null default now());
alter table public.media_deletions enable row level security;
revoke all on public.media_deletions from anon,authenticated;
create function public.queue_old_media() returns trigger language plpgsql security definer set search_path='' as $$
declare files text[];url text;owner_id uuid;
begin
 if tg_table_name='posts' then files:=old.media;owner_id:=old."authorId";else files:=array[old.avatar,old.cover];owner_id:=old.id;end if;
 foreach url in array files loop
  if url like '/api/media?path=%' and not exists(select 1 from public.posts where url=any(media)) and not exists(select 1 from public.profiles where url in (avatar,cover)) then
   insert into public.media_deletions(path,owner_id) values(replace(substring(url from 17),'%2F','/'),owner_id) on conflict do nothing;
  end if;
 end loop;return null;
end $$;
create trigger posts_cleanup after update or delete on public.posts for each row execute function public.queue_old_media();
create trigger profiles_cleanup after update or delete on public.profiles for each row execute function public.queue_old_media();
revoke all on function public.queue_old_media() from public,anon,authenticated;
